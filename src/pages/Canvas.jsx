import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadCanvas, updateCanvas } from "../utils/api";
import BoardProvider from "../store/BoardProvider";
import ToolboxProvider from "../store/ToolboxProvider";
import Toolbar from "../components/Toolbar";
import Board from "../components/Board";
import Toolbox from "../components/Toolbox";
import styles from "./Canvas.module.css";

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

  const [canvas, setCanvas] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSaveTime, setLastSaveTime] = useState(null);

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

  // Debounced save function
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
        await updateCanvas(id, serializableElements);
        setLastSaveTime(new Date());
      } catch (err) {
        console.error("Failed to save canvas:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [id, isSaving],
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
        </div>
      </div>

      <BoardProvider initialElements={canvas?.elements || []}>
        <CanvasPageContent
          initialElements={canvas?.elements || []}
          canvasId={id}
          onElementsChange={saveCanvas}
        />
      </BoardProvider>
    </div>
  );
};
