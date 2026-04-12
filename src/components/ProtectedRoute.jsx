import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/register" replace />;
  }

  return children;
};
