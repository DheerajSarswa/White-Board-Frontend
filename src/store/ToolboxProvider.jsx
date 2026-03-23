import React, { act, useReducer } from "react";
import toolboxContext from "./toolbox-context";
import { COLORS, TOOL_ITEMS, TOOLBOX_ACTIONS } from "../constants";

function toolboxReducer(state, action) {
  switch (action.type) {
    case TOOLBOX_ACTIONS.CHANGE_STROKE: {
      const newState = { ...state };
      newState[action.payload.tool].stroke = action.payload.stroke;
      return newState;
    }
    default:
  }
}

const initialToolboxState = {
  [TOOL_ITEMS.LINE]: {
    stroke: COLORS.BLACK,
    size: 1,
  },
  [TOOL_ITEMS.RECTANGLE]: {
    stroke: COLORS.BLACK,
    fill: null,
    size: 1,
  },
  [TOOL_ITEMS.CIRCLE]: {
    stroke: COLORS.BLACK,
    fill: null,
    size: 1,
  },
  [TOOL_ITEMS.ARROW]: {
    stroke: COLORS.BLACK,
    size: 1,
  },
};

const ToolboxProvider = ({ children }) => {
  const [toolboxState, dispatchToolboxAction] = useReducer(
    toolboxReducer,
    initialToolboxState,
  );

  const handleChangeStroke = (tool, stroke) => {
    dispatchToolboxAction({
      type: TOOLBOX_ACTIONS.CHANGE_STROKE,
      payload: {
        tool,
        stroke,
      },
    });
  };

  const toolboxContextValue = {
    toolboxState,
    handleChangeStroke,
  };

  return (
    <toolboxContext.Provider value={toolboxContextValue}>
      {children}
    </toolboxContext.Provider>
  );
};

export default ToolboxProvider;
