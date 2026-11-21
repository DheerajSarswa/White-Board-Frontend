import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadCanvas } from "../utils/api";
import BoardProvider from "../store/BoardProvider";
import ToolboxProvider from "../store/ToolboxProvider";
import Toolbar from "../components/Toolbar";
import Board from "../components/Board";
import Toolbox from "../components/Toolbox";
import boardContext from "../store/board-context";
import styles from "./Canvas.module.css";

const CanvasPageContent = ({ name, onGoBack }) => {
  const { isLive, isSaving, lastSaveTime, saveError, retrySave } = useContext(boardContext);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onGoBack}>
          ← All canvases
        </button>
        <h2 className={styles.canvasTitle}>{name || "Canvas"}</h2>
        <div className={styles.statusContainer}>
          {saveError ? (
            <>
              <span className={styles.status} role="alert">{saveError}</span>
              <button className={styles.backBtn} onClick={retrySave}>Retry save</button>
            </>
          ) : isSaving ? (
            <span className={styles.status}>Saving...</span>
          ) : lastSaveTime && (
            <span className={styles.status}>
              Saved {lastSaveTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <span className={`${styles.status} ${isLive ? styles.connected : styles.disconnected}`}>
            {isLive ? "✓ Online" : "✗ Offline"}
          </span>
        </div>
      </div>

      <ToolboxProvider>
        <div className={styles.canvasContainer}>
          <Toolbar />
          <Board />
          <Toolbox />
        </div>
      </ToolboxProvider>
    </div>
  );
};

const CanvasRoom = ({ id }) => {
  const navigate = useNavigate();
  const [canvas, setCanvas] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    loadCanvas(id).then((response) => {
      if (active) setCanvas(response.canvas);
    }).catch((err) => {
      if (active) {
        setError(true);
        console.error(err);
      }
    });
    return () => { active = false; };
  }, [id]);

  const handleGoBack = () => navigate("/dashboard");

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load canvas</p>
        <button onClick={handleGoBack}>Back to Dashboard</button>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading canvas...</p>
      </div>
    );
  }

  return (
    <BoardProvider canvas={canvas}>
      <CanvasPageContent name={canvas.name} onGoBack={handleGoBack} />
    </BoardProvider>
  );
};

export const Canvas = () => {
  const { id } = useParams();
  return <CanvasRoom key={id} id={id} />;
};
