import React, { useCallback, useEffect, useReducer } from "react";
import boardContext from "./board-context";
import { TOOL_ITEMS, BOARD_ACTIONS, TOOL_ACTION_TYPES } from "../constants";
import {
  createRoughElement,
  getSvgPathFromStroke,
  isPointNearElement,
} from "../utils/element";
import getStroke from "perfect-freehand";

const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL: {
      return { ...state, activeToolItem: action.payload.tool };
    }

    case BOARD_ACTIONS.CHANGE_ACTION_TYPE: {
      return { ...state, toolActionType: action.payload.actionType };
    }

    case BOARD_ACTIONS.SET_ELEMENTS: {
      const normalizedElements = action.payload || [];
      return {
        ...state,
        elements: normalizedElements,
        history: [normalizedElements],
        index: 0,
        toolActionType: TOOL_ACTION_TYPES.NONE,
      };
    }

    case BOARD_ACTIONS.DRAW_DOWN: {
      const { x, y, stroke, fill, size } = action.payload;
      const newElement = createRoughElement(state.elements.length, x, y, x, y, {
        type: state.activeToolItem,
        stroke,
        fill,
        size,
      });
      return {
        ...state,
        toolActionType:
          state.activeToolItem === TOOL_ITEMS.TEXT
            ? TOOL_ACTION_TYPES.WRITING
            : TOOL_ACTION_TYPES.DRAWING,
        elements: [...state.elements, newElement],
      };
    }

    case BOARD_ACTIONS.DRAW_MOVE: {
      const { x, y } = action.payload;
      const newElements = [...state.elements];
      const index = newElements.length - 1;
      if (index < 0) return state;

      const element = newElements[index];
      const { type, size } = element;

      switch (type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW: {
          const { x1, y1, stroke, fill } = element;
          const updatedElement = createRoughElement(index, x1, y1, x, y, {
            type: state.activeToolItem,
            stroke,
            fill,
            size,
          });
          newElements[index] = updatedElement;
          return {
            ...state,
            elements: newElements,
          };
        }
        case TOOL_ITEMS.BRUSH: {
          const updatedPoints = [...element.points, { x, y }];
          newElements[index] = {
            ...element,
            points: updatedPoints,
            path: new Path2D(
              getSvgPathFromStroke(getStroke(updatedPoints, { size })),
            ),
          };
          return {
            ...state,
            elements: newElements,
          };
        }
        default:
          return state;
      }
    }

    case BOARD_ACTIONS.DRAW_UP: {
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(state.elements);
      return {
        ...state,
        history: newHistory,
        index: state.index + 1,
      };
    }

    case BOARD_ACTIONS.ERASE: {
      const { x, y } = action.payload;
      const newElements = state.elements.filter((element) => {
        return !isPointNearElement(element, x, y);
      });
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return {
        ...state,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }

    case BOARD_ACTIONS.CHANGE_TEXT: {
      const index = state.elements.length - 1;
      if (index < 0) return state;
      const newElements = [...state.elements];
      newElements[index] = { ...newElements[index], text: action.payload.text };
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }

    case BOARD_ACTIONS.UNDO: {
      if (state.index <= 0) return state;
      return {
        ...state,
        elements: state.history[state.index - 1],
        index: state.index - 1,
      };
    }

    case BOARD_ACTIONS.REDO: {
      if (state.index >= state.history.length - 1) return state;
      return {
        ...state,
        elements: state.history[state.index + 1],
        index: state.index + 1,
      };
    }

    case BOARD_ACTIONS.SYNC_REMOTE_ELEMENTS: {
      // Sync remote elements without affecting local undo/redo history
      // Only update if the remote elements are different from current
      const remoteElements = action.payload || [];
      if (JSON.stringify(state.elements) !== JSON.stringify(remoteElements)) {
        return {
          ...state,
          elements: remoteElements,
        };
      }
      return state;
    }

    default:
      return state;
  }
};

const initialBoardState = {
  activeToolItem: TOOL_ITEMS.BRUSH,
  toolActionType: TOOL_ACTION_TYPES.NONE,
  elements: [],
  history: [[]],
  index: 0,
};

const BoardProvider = ({
  children,
  initialElements = [],
  remoteUpdate = null,
}) => {
  const [boardState, dispatchBoardAction] = useReducer(boardReducer, {
    ...initialBoardState,
    elements: initialElements,
    history: [initialElements],
  });

  useEffect(() => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.SET_ELEMENTS,
      payload: initialElements,
    });
  }, [initialElements]);

  // Handle remote updates from WebSocket
  useEffect(() => {
    if (remoteUpdate && remoteUpdate.elements) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.SYNC_REMOTE_ELEMENTS,
        payload: remoteUpdate.elements,
      });
    }
  }, [remoteUpdate]);

  const handleToolItemClick = (tool) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TOOL,
      payload: { tool },
    });
  };

  const handleBoardMouseDown = (coords, toolboxState) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;

    if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: { actionType: TOOL_ACTION_TYPES.ERASING },
      });
      dispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: { x: coords.x, y: coords.y },
      });
      return;
    }

    dispatchBoardAction({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        x: coords.x,
        y: coords.y,
        stroke: toolboxState[boardState.activeToolItem]?.stroke,
        fill: toolboxState[boardState.activeToolItem]?.fill,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
  };

  const handleBoardMouseMove = (coords) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;

    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_MOVE,
        payload: { x: coords.x, y: coords.y },
      });
    } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: { x: coords.x, y: coords.y },
      });
    }
  };

  const handleBoardMouseUp = () => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({ type: BOARD_ACTIONS.DRAW_UP });
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: { actionType: TOOL_ACTION_TYPES.NONE },
    });
  };

  const handleTextAreaBlur = (text) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TEXT,
      payload: { text },
    });
  };

  const handleBoardUndo = useCallback(() => {
    dispatchBoardAction({ type: BOARD_ACTIONS.UNDO });
  }, []);

  const handleBoardRedo = useCallback(() => {
    dispatchBoardAction({ type: BOARD_ACTIONS.REDO });
  }, []);

  const boardContextValue = {
    activeToolItem: boardState.activeToolItem,
    toolActionType: boardState.toolActionType,
    elements: boardState.elements,
    handleToolItemClick,
    handleBoardMouseDown,
    handleBoardMouseMove,
    handleBoardMouseUp,
    handleTextAreaBlur,
    handleBoardUndo,
    handleBoardRedo,
  };

  return (
    <boardContext.Provider value={boardContextValue}>
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;
