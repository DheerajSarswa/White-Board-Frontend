import { createContext } from "react";

const socketContext = createContext({
  socket: null,
  isConnected: false,
  collaborators: [],
  onCanvasUpdated: null,
  onUserJoined: null,
  onUserLeft: null,
  onCursorMoved: null,
});

export default socketContext;
