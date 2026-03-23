import { createContext } from "react";

const toolboxContext = createContext({
  toolboxState: {},
  handleChangeStroke: () => {},
  handleChangeFill: () => {},
  handleChangeSize: () => {},
});

export default toolboxContext;
