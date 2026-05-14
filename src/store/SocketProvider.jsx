import React, { useState, useEffect, useCallback } from "react";
import socketContext from "./socket-context";
import {
  initializeSocket,
  getSocket,
  disconnectSocket,
  onCanvasUpdated,
  onUserJoined,
  onUserLeft,
  onCursorMoved,
  removeSocketListener,
} from "../utils/socket";

export const SocketProvider = ({ children, token }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [socketListeners, setSocketListeners] = useState({});

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    try {
      const socketInstance = initializeSocket(token);
      setSocket(socketInstance);

      const handleConnect = () => {
        console.log("Socket connected");
        setIsConnected(true);
      };

      const handleDisconnect = () => {
        console.log("Socket disconnected");
        setIsConnected(false);
        setCollaborators([]);
      };

      socketInstance.on("connect", handleConnect);
      socketInstance.on("disconnect", handleDisconnect);

      if (socketInstance.connected) {
        setIsConnected(true);
      }

      return () => {
        socketInstance.off("connect", handleConnect);
        socketInstance.off("disconnect", handleDisconnect);
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

    // Store callbacks so we can clean them up later
    const listeners = {
      canvasUpdated: null,
      userJoined: null,
      userLeft: null,
      cursorMoved: null,
    };

    // Register the listeners
    onUserJoined(handleUserJoined);
    onUserLeft(handleUserLeft);

    setSocketListeners(listeners);

    return () => {
      // Clean up listeners
      removeSocketListener("user-joined", handleUserJoined);
      removeSocketListener("user-left", handleUserLeft);
    };
  }, [socket, isConnected, handleUserJoined, handleUserLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect on unmount unless the entire provider is being unmounted
      // This prevents disconnection when navigating between pages
    };
  }, []);

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
    <socketContext.Provider value={value}>{children}</socketContext.Provider>
  );
};

export default SocketProvider;
