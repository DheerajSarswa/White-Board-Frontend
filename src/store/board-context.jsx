import { createContext } from "react";

const boardContext = createContext({
  activeToolItem: "",
  toolActionType: "",
  elements: [],
  handleBoardMouseDown: () => {},
  handleToolItemClick: () => {},
  handleBoardMouseMove: () => {},
  handleBoardMouseUp: () => {},
  handleTextAreaBlur: () => {},
});

export default boardContext;
