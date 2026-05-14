import { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadCanvas, updateCanvas } from "../utils/api";
import BoardProvider from "../store/BoardProvider";
import ToolboxProvider from "../store/ToolboxProvider";
import Toolbar from "../components/Toolbar";
import Board from "../components/Board";
import Toolbox from "../components/Toolbox";
import styles from "./Canvas.module.css";
import authContext from "../store/auth-context";
import socketContext from "../store/socket-context";
import {
  joinCanvas,
  leaveCanvas,
  sendCanvasUpdate,
  onCanvasUpdated,
  removeSocketListener,
} from "../utils/socket";

const CanvasPageContent = ({ initialElements, canvasId, onElementsChange }) => {
  return (
    <ToolboxProvider>
      <div className={styles.canvasContainer}>
        <Toolbar />
        <Board onElementsChange={onElementsChange} />
        <Toolbox />
      </div>
    </ToolboxProvider>
  );
};

export const Canvas = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(authContext);
  const { isConnected } = useContext(socketContext);

  const [canvas, setCanvas] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState(null);

  const fetchCanvas = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await loadCanvas(id);
      setCanvas(response.canvas);
    } catch (err) {
      setError("Failed to load canvas");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCanvas();
    }
  }, [id]);

  // Join canvas room and setup WebSocket listeners
  useEffect(() => {
    if (!id || !isConnected || !token) return;

    const joinRoom = async () => {
      try {
        await joinCanvas(id);
        console.log(`Joined canvas room: ${id}`);

        // Setup listener for remote canvas updates
        const handleRemoteUpdate = (data) => {
          console.log("Received remote canvas update:", data);
          setLastRemoteUpdate({
            elements: data.elements,
            updatedBy: data.updatedBy,
            timestamp: data.timestamp,
          });
        };

        onCanvasUpdated(handleRemoteUpdate);

        return () => {
          removeSocketListener("canvas-updated", handleRemoteUpdate);
        };
      } catch (err) {
        console.error("Failed to join canvas room:", err);
      }
    };

    const cleanup = joinRoom();

    return () => {
      cleanup?.then?.((fn) => fn?.());
      leaveCanvas(id);
    };
  }, [id, isConnected, token]);

  const saveCanvas = useCallback(
    async (elements) => {
      if (!id || isSaving) return;

      const serializableElements = elements.map(
        ({ id, type, x1, y1, x2, y2, stroke, fill, size, points, text }) => ({
          id,
          type,
          x1,
          y1,
          x2,
          y2,
          stroke,
          fill,
          size,
          points,
          text,
        }),
      );

      setIsSaving(true);
      try {
        // Save to backend
        await updateCanvas(id, serializableElements);
        setLastSaveTime(new Date());

        // Broadcast update to other users via WebSocket
        if (isConnected) {
          sendCanvasUpdate(id, serializableElements);
        }
      } catch (err) {
        console.error("Failed to save canvas:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [id, isSaving, isConnected],
  );

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading canvas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={handleGoBack}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={handleGoBack}>
          ← Back to Dashboard
        </button>
        <h2 className={styles.canvasTitle}>{canvas?.name || "Canvas"}</h2>
        <div className={styles.statusContainer}>
          {isSaving && <span className={styles.status}>Saving...</span>}
          {lastSaveTime && !isSaving && (
            <span className={styles.status}>
              Last saved: {lastSaveTime.toLocaleTimeString()}
            </span>
          )}
          <span
            className={`${styles.status} ${isConnected ? styles.connected : styles.disconnected}`}
          >
            {isConnected ? "✓ Online" : "✗ Offline"}
          </span>
          {collaborators.length > 0 && (
            <span className={styles.collaborators}>
              {collaborators.length} collaborator
              {collaborators.length !== 1 ? "s" : ""} online
            </span>
          )}
        </div>
      </div>

      <BoardProvider
        initialElements={canvas?.elements || []}
        remoteUpdate={lastRemoteUpdate}
      >
        <CanvasPageContent
          initialElements={canvas?.elements || []}
          canvasId={id}
          onElementsChange={saveCanvas}
        />
      </BoardProvider>
    </div>
  );
};
