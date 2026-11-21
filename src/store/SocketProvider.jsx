import { useState, useEffect, useCallback } from "react";
import SocketContext from "./socket-context";
import {
  initializeSocket,
  disconnectSocket,
  onCanvasUpdated,
  onUserJoined,
  onUserLeft,
  onCursorMoved,
  removeSocketListener,
} from "../utils/socket";

export const SocketProvider = ({ children, token }) => {
  const [connection, setConnection] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const socket = connection?.token === token ? connection?.socket : null;
  const isConnected = Boolean(socket && connection.isConnected);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    try {
      const socketInstance = initializeSocket(token);
      const handleConnect = () => {
        setConnection({ token, socket: socketInstance, isConnected: true });
      };

      const handleDisconnect = () => {
        setConnection({ token, socket: socketInstance, isConnected: false });
        setCollaborators([]);
      };

      socketInstance.on("connect", handleConnect);
      socketInstance.on("disconnect", handleDisconnect);

      return () => {
        socketInstance.off("connect", handleConnect);
        socketInstance.off("disconnect", handleDisconnect);
        disconnectSocket();
      };
    } catch (error) {
      console.error("Failed to initialize socket:", error);
    }
  }, [token]);

  // Handle user joined event
  const handleUserJoined = useCallback((data) => {
    setCollaborators((prev) => {
      const exists = prev.some((c) => c.userEmail === data.userEmail);
      if (exists) return prev;
      return [...prev, { userEmail: data.userEmail, joinedAt: data.timestamp }];
    });
  }, []);

  // Handle user left event
  const handleUserLeft = useCallback((data) => {
    setCollaborators((prev) =>
      prev.filter((c) => c.userEmail !== data.userEmail),
    );
  }, []);

  // Register event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    onUserJoined(handleUserJoined);
    onUserLeft(handleUserLeft);

    return () => {
      // Clean up listeners
      removeSocketListener("user-joined", handleUserJoined);
      removeSocketListener("user-left", handleUserLeft);
    };
  }, [socket, isConnected, handleUserJoined, handleUserLeft]);

  const value = {
    socket,
    isConnected,
    collaborators,
    onCanvasUpdated,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onCursorMoved,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
