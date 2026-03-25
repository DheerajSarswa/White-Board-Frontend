import React, { useReducer } from "react";
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

    case BOARD_ACTIONS.DRAW_DOWN: {
      const { clientX, clientY, stroke, fill, size } = action.payload;
      const newElement = createRoughElement(
        state.elements.length,
        clientX,
        clientY,
        clientX,
        clientY,
        { type: state.activeToolItem, stroke, fill, size },
      );
      const prevElements = state.elements;
      return {
        ...state,
        toolActionType:
          state.activeToolItem === TOOL_ITEMS.TEXT
            ? TOOL_ACTION_TYPES.WRITING
            : TOOL_ACTION_TYPES.DRAWING,
        elements: [...prevElements, newElement],
      };
    }

    case BOARD_ACTIONS.DRAW_MOVE: {
      const { clientX, clientY } = action.payload;
      const newElements = [...state.elements];
      const index = newElements.length - 1;
      const { type, size } = newElements[index];
      switch (type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          const { x1, y1, stroke, fill } = newElements[index];
          const newElement = createRoughElement(
            index,
            x1,
            y1,
            clientX,
            clientY,
            {
              type: state.activeToolItem,
              stroke,
              fill,
              size,
            },
          );
          newElements[index] = newElement;
          return {
            ...state,
            elements: newElements,
          };
        case TOOL_ITEMS.BRUSH: {
          newElements[index].points = [
            ...newElements[index].points,
            { x: clientX, y: clientY },
          ];
          newElements[index].path = new Path2D(
            getSvgPathFromStroke(
              getStroke(newElements[index].points, { size: size }),
            ),
          );
          return {
            ...state,
            elements: newElements,
          };
        }
        default:
          break;
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
      const { clientX, clientY } = action.payload;
      let newElements = [...state.elements];
      newElements = newElements.filter((element) => {
        return !isPointNearElement(element, clientX, clientY);
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
      const newElements = [...state.elements];
      newElements[index].text = action.payload.text;
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

const BoardProvider = ({ children }) => {
  const [boardState, dispatchBoardAction] = useReducer(
    boardReducer,
    initialBoardState,
  );

  const handleToolItemClick = (tool) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TOOL,
      payload: {
        tool,
      },
    });
  };

  const handleBoardMouseDown = (event, toolboxState) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;
    if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: {
          actionType: TOOL_ACTION_TYPES.ERASING,
        },
      });
      return;
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        clientX,
        clientY,
        stroke: toolboxState[boardState.activeToolItem]?.stroke,
        fill: toolboxState[boardState.activeToolItem]?.fill,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
  };

  const handleBoardMouseMove = (event) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_MOVE,
        payload: {
          clientX,
          clientY,
        },
      });
    } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: {
          clientX,
          clientY,
        },
      });
    }
  };

  const handleBoardMouseUp = () => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_UP,
      });
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: {
        actionType: TOOL_ACTION_TYPES.NONE,
      },
    });
  };

  const handleTextAreaBlur = (text) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TEXT,
      payload: {
        text,
      },
    });
  };

  const handleBoardUndo = () => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.UNDO,
    });
  };
  const handleBoardRedo = () => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.REDO,
    });
  };

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
