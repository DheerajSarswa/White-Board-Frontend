// Use the same backend for REST requests and Socket.IO connections.
export const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3030"
).replace(/\/+$/, "");
