import io from "socket.io-client";

import { BACKEND_URL } from "./config";

const SOCKET_URL = BACKEND_URL;

let socket = null;

/**
 * Initialize and connect to WebSocket server
 * @param {string} token - JWT token for authentication
 * @returns {Object} socket instance
 */
export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("Connected to WebSocket server");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket server");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  return socket;
};

/**
 * Get the current socket instance
 * @returns {Object} socket instance or null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Join a canvas room
 * @param {string} canvasId - The canvas ID
 * @returns {Promise}
 */
export const joinCanvas = async (canvasId) => {
  if (!socket?.connected) throw new Error("Socket is disconnected");
  const result = await socket.timeout(10000).emitWithAck("join-canvas", canvasId);
  if (!result.success) throw new Error(result.message);
  return result;
};

/**
 * Leave a canvas room
 * @param {string} canvasId - The canvas ID
 */
export const leaveCanvas = (canvasId) => {
  if (socket && socket.connected) {
    socket.emit("leave-canvas", canvasId);
  }
};

/**
 * Send canvas updates to other users
 * @param {string} canvasId - The canvas ID
 * @param {Array} elements - The canvas elements
 */
export const sendCanvasUpdate = (canvasId, elements) => {
  if (socket && socket.connected) {
    socket.emit("canvas-update", {
      canvasId,
      elements,
    });
  }
};

/**
 * Send cursor position to other users
 * @param {string} canvasId - The canvas ID
 * @param {Object} position - { x, y } coordinates
 */
export const sendCursorMove = (canvasId, position) => {
  if (socket && socket.connected) {
    socket.emit("cursor-move", {
      canvasId,
      position,
    });
  }
};

/**
 * Send user presence update
 * @param {string} canvasId - The canvas ID
 * @param {string} action - 'join' or 'leave'
 */
export const sendUserPresence = (canvasId, action) => {
  if (socket && socket.connected) {
    socket.emit("user-presence", {
      canvasId,
      action,
    });
  }
};

/**
 * Listen for canvas updates from other users
 * @param {Function} callback - Called when canvas is updated
 */
export const onCanvasUpdated = (callback) => {
  if (socket) {
    socket.on("canvas-updated", callback);
  }
};

/**
 * Listen for user join events
 * @param {Function} callback - Called when a user joins
 */
export const onUserJoined = (callback) => {
  if (socket) {
    socket.on("user-joined", callback);
  }
};

/**
 * Listen for user leave events
 * @param {Function} callback - Called when a user leaves
 */
export const onUserLeft = (callback) => {
  if (socket) {
    socket.on("user-left", callback);
  }
};

/**
 * Listen for cursor move events
 * @param {Function} callback - Called when a user moves cursor
 */
export const onCursorMoved = (callback) => {
  if (socket) {
    socket.on("cursor-moved", callback);
  }
};

/**
 * Listen for user presence changes
 * @param {Function} callback - Called when user presence changes
 */
export const onUserPresenceChanged = (callback) => {
  if (socket) {
    socket.on("user-presence-changed", callback);
  }
};

/**
 * Disconnect from WebSocket server
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Remove a specific event listener
 * @param {string} eventName - The event name
 * @param {Function} callback - The callback to remove
 */
export const removeSocketListener = (eventName, callback) => {
  if (socket) {
    socket.off(eventName, callback);
  }
};
