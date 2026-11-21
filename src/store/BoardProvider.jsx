import { useCallback, useMemo, useReducer } from "react";
import BoardContext from "./board-context";
import { TOOL_ITEMS, BOARD_ACTIONS, TOOL_ACTION_TYPES } from "../constants";
import { createElementId, createRoughElement } from "../utils/element";
import { useCanvasSync } from "./useCanvasSync";

const noEdit = { add: [], remove: [] };

const applyEdit = (elements, { add, remove }) => {
  const removed = new Set(remove);
  const updated = elements.filter(({ id }) => !removed.has(id));
  const existing = new Set(updated.map(({ id }) => id));
  for (const { element, index } of add) {
    if (existing.has(element.id)) continue;
    updated.splice(index ?? updated.length, 0, element);
    existing.add(element.id);
  }
  return updated;
};

const queueEdit = (state, edit, editId) => {
  const sequence = state.sequence + 1;
  return {
    ...state,
    sequence,
    pending: [...state.pending, { edit, editId, sequence }],
    elements: applyEdit(state.elements, edit),
  };
};

const commitGesture = (state, redo, undo, editId) => {
  const finished = { ...state, gestureId: null, draft: null, erased: [], toolActionType: TOOL_ACTION_TYPES.NONE };
  if (!redo.add.length && !redo.remove.length) return finished;
  return queueEdit({
    ...finished,
    undo: [...state.undo, { undo, redo }],
    redo: [],
  }, redo, editId);
};

const addDrawing = (state, element, editId) => commitGesture(
  state,
  { ...noEdit, add: [{ element }] },
  { ...noEdit, remove: [element.id] },
  editId,
);

const boardReducer = (state, { type, payload }) => {
  switch (type) {
    case BOARD_ACTIONS.CHANGE_TOOL:
      return { ...state, activeToolItem: payload.tool };

    case BOARD_ACTIONS.DRAW_DOWN: {
      if (state.toolActionType !== TOOL_ACTION_TYPES.NONE) return state;
      const tool = state.activeToolItem;
      const { id, x, y, options } = payload;
      if (tool === TOOL_ITEMS.ERASER) {
        return {
          ...state,
          gestureId: id,
          toolActionType: TOOL_ACTION_TYPES.ERASING,
          erased: payload.erased,
        };
      }
      return {
        ...state,
        gestureId: id,
        toolActionType: tool === TOOL_ITEMS.TEXT ? TOOL_ACTION_TYPES.WRITING : TOOL_ACTION_TYPES.DRAWING,
        draft: createRoughElement(id, x, y, x, y, { ...options, type: tool }),
      };
    }

    case BOARD_ACTIONS.DRAW_MOVE: {
      if (state.toolActionType !== TOOL_ACTION_TYPES.DRAWING) return state;
      const { x, y } = payload;
      const draft = state.draft;
      return {
        ...state,
        draft: draft.type === TOOL_ITEMS.BRUSH
          ? { ...draft, points: [...draft.points, { x, y }], path: undefined }
          : createRoughElement(draft.id, draft.x1, draft.y1, x, y, draft),
      };
    }

    case BOARD_ACTIONS.ERASE: {
      if (state.toolActionType !== TOOL_ACTION_TYPES.ERASING || !payload.length) return state;
      const erasedIds = new Set(state.erased.map(({ element }) => element.id));
      return {
        ...state,
        erased: [...state.erased, ...payload.filter(({ element }) => !erasedIds.has(element.id))],
      };
    }

    case BOARD_ACTIONS.DRAW_UP:
      if (state.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
        return addDrawing(state, state.draft, state.gestureId);
      }
      if (state.toolActionType === TOOL_ACTION_TYPES.ERASING) {
        // Capture only removals still present when the gesture finishes.
        const erasedIds = new Set(state.erased.map(({ element }) => element.id));
        const add = state.elements.flatMap((element, index) =>
          erasedIds.has(element.id) ? [{ element, index }] : [],
        );
        return commitGesture(
          state,
          { ...noEdit, remove: add.map(({ element }) => element.id) },
          { ...noEdit, add },
          state.gestureId,
        );
      }
      return state;

    case BOARD_ACTIONS.CHANGE_TEXT:
      if (state.toolActionType !== TOOL_ACTION_TYPES.WRITING) return state;
      return payload.text.trim()
        ? addDrawing(state, { ...state.draft, text: payload.text }, state.gestureId)
        : commitGesture(state, noEdit, noEdit, state.gestureId);

    case BOARD_ACTIONS.UNDO:
    case BOARD_ACTIONS.REDO: {
      if (state.toolActionType !== TOOL_ACTION_TYPES.NONE) return state;
      const direction = type === BOARD_ACTIONS.UNDO ? "undo" : "redo";
      const opposite = direction === "undo" ? "redo" : "undo";
      const history = state[direction];
      let entry = history.at(-1);
      if (!entry) return state;
      if (direction === "undo" && entry.redo.add.length) {
        const redo = {
          ...entry.redo,
          add: entry.redo.add.map(({ element, index }) => {
            const currentIndex = state.elements.findIndex(({ id }) => id === element.id);
            return { element, index: currentIndex >= 0 ? currentIndex : index };
          }),
        };
        entry = { ...entry, redo };
      }
      return queueEdit({
        ...state,
        [direction]: history.slice(0, -1),
        [opposite]: [...state[opposite], entry],
      }, entry[direction], payload.editId);
    }

    case BOARD_ACTIONS.SYNC_REMOTE_ELEMENTS:
    case BOARD_ACTIONS.SAVE_CONFIRMED: {
      const confirmed = type === BOARD_ACTIONS.SAVE_CONFIRMED;
      const newer = payload.revision > state.revision;
      if (!newer && !confirmed) return state;
      const savedElements = newer ? payload.elements : state.savedElements;
      const pending = confirmed
        ? state.pending.filter(({ editId }) => editId !== payload.editId)
        : state.pending;
      return {
        ...state,
        savedElements,
        revision: newer ? payload.revision : state.revision,
        elements: pending.reduce((elements, { edit }) => applyEdit(elements, edit), savedElements),
        pending,
        lastSaveTime: confirmed ? payload.savedAt : state.lastSaveTime,
      };
    }

    default:
      return state;
  }
};

const BoardProvider = ({ children, canvas }) => {
  const [state, dispatch] = useReducer(boardReducer, canvas, (initial) => ({
    activeToolItem: TOOL_ITEMS.BRUSH,
    toolActionType: TOOL_ACTION_TYPES.NONE,
    gestureId: null,
    draft: null,
    erased: [],
    elements: initial.elements,
    savedElements: initial.elements,
    revision: initial.revision ?? 0,
    undo: [],
    redo: [],
    sequence: 0,
    pending: [],
    lastSaveTime: null,
  }));

  const gesture = useMemo(() => {
    if (state.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      return { editId: state.gestureId, edit: { ...noEdit, add: [{ element: state.draft }] } };
    }
    if (state.erased.length) {
      return { editId: state.gestureId, edit: { ...noEdit, remove: state.erased.map(({ element }) => element.id) } };
    }
    return null;
  }, [state.draft, state.erased, state.gestureId, state.toolActionType]);
  const { previews, saveError, retrySave, isLive } = useCanvasSync(canvas._id, state.pending, gesture, dispatch);

  const visibleElements = useMemo(() => {
    const withPreviews = Array.from(previews.values()).reduce(
      (elements, { edit }) => applyEdit(elements, edit),
      state.elements,
    );
    if (gesture) return applyEdit(withPreviews, gesture.edit);
    return state.draft ? [...withPreviews, state.draft] : withPreviews;
  }, [state.elements, state.draft, gesture, previews]);

  const handleBoardUndo = useCallback(() => {
    dispatch({ type: BOARD_ACTIONS.UNDO, payload: { editId: createElementId() } });
  }, []);
  const handleBoardRedo = useCallback(() => {
    dispatch({ type: BOARD_ACTIONS.REDO, payload: { editId: createElementId() } });
  }, []);

  const value = {
    activeToolItem: state.activeToolItem,
    toolActionType: state.toolActionType,
    elements: visibleElements,
    draft: state.draft,
    erasableElements: state.elements,
    isSaving: state.pending.length > 0,
    lastSaveTime: state.lastSaveTime,
    saveError,
    retrySave,
    isLive,
    handleToolItemClick: (tool) => dispatch({ type: BOARD_ACTIONS.CHANGE_TOOL, payload: { tool } }),
    handleBoardMouseDown: (payload) => dispatch({ type: BOARD_ACTIONS.DRAW_DOWN, payload }),
    handleBoardMouseMove: (payload) => dispatch({ type: BOARD_ACTIONS.DRAW_MOVE, payload }),
    handleErase: (payload) => dispatch({ type: BOARD_ACTIONS.ERASE, payload }),
    handleBoardMouseUp: () => dispatch({ type: BOARD_ACTIONS.DRAW_UP }),
    handleTextAreaBlur: (text) => dispatch({ type: BOARD_ACTIONS.CHANGE_TEXT, payload: { text } }),
    handleBoardUndo,
    handleBoardRedo,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export default BoardProvider;
