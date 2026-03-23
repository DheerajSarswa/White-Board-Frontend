import { createContext } from "react";

const toolboxContext = createContext({
  toolboxState: {},
  handleChangeStroke: () => {},
});

export default toolboxContext;
