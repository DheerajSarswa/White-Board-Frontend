import { createContext } from "react";

const boardContext = createContext({
  activeToolItem: "",
  toolActionType: "",
  elements: [],
  history: [[]],
  index: 0,
  handleBoardMouseDown: () => {},
  handleToolItemClick: () => {},
  handleBoardMouseMove: () => {},
  handleBoardMouseUp: () => {},
  handleTextAreaBlur: () => {},
  handleBoardUndo: () => {},
  handleBoardRedo: () => {},
});

export default boardContext;
