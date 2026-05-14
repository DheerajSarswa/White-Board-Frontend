import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./store/AuthContext";
import { SocketProvider } from "./store/SocketProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Canvas } from "./pages/Canvas";
import authContext from "./store/auth-context";
import { useContext } from "react";

function AppRoutes() {
  const { token } = useContext(authContext);

  return (
    <SocketProvider token={token}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/canvas/:id"
          element={
            <ProtectedRoute>
              <Canvas />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </SocketProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
