import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCanvases, createCanvas, deleteCanvas } from "../utils/api";
import { useAuth } from "../store/AuthContext";
import { CanvasNameModal, ConfirmModal } from "../components/Modal";
import styles from "./Dashboard.module.css";

export const Dashboard = () => {
  const [canvases, setCanvases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [canvasToDelete, setCanvasToDelete] = useState(null);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchCanvases();
  }, []);

  const fetchCanvases = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getAllCanvases();
      setCanvases(response.canvases);
    } catch (err) {
      setError("Failed to load canvases");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCanvas = () => {
    setShowCreateModal(true);
  };

  const handleCreateConfirm = async (canvasName) => {
    setIsCreating(true);
    setError("");
    try {
      const response = await createCanvas(canvasName, []);
      navigate(`/canvas/${response.canvas._id}`);
    } catch (err) {
      setError("Failed to create canvas");
      console.error(err);
      setIsCreating(false);
    }
  };

  const handleDeleteCanvas = (id) => {
    setCanvasToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!canvasToDelete) return;

    setDeletingId(canvasToDelete);
    setError("");
    try {
      await deleteCanvas(canvasToDelete);
      setCanvases(canvases.filter((canvas) => canvas._id !== canvasToDelete));
    } catch (err) {
      setError("Failed to delete canvas");
      console.error(err);
    } finally {
      setDeletingId(null);
      setCanvasToDelete(null);
    }
  };

  const handleCanvasClick = (id) => {
    navigate(`/canvas/${id}`);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Welcome back, {user?.name || "User"}</h1>
          <p className={styles.subTitle}>Your canvases are ready.</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <button
        className={styles.createBtn}
        onClick={handleCreateCanvas}
        disabled={isCreating}
      >
        {isCreating ? "Creating..." : "+ Create New Canvas"}
      </button>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <p>Loading canvases...</p>
        </div>
      ) : canvases.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No canvases yet. Create one to get started!</p>
        </div>
      ) : (
        <div className={styles.canvasGrid}>
          {canvases.map((canvas) => (
            <div
              key={canvas._id}
              className={styles.canvasCard}
              onClick={() => handleCanvasClick(canvas._id)}
            >
              <div className={styles.canvasPreview}>
                <span className={styles.previewPlaceholder}>Canvas</span>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.canvasName}>{canvas.name}</h3>
                <p className={styles.canvasDate}>
                  {new Date(canvas.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCanvas(canvas._id);
                }}
                disabled={deletingId === canvas._id}
              >
                {deletingId === canvas._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}

      <CanvasNameModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateConfirm}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this canvas? This action cannot be undone."
      />
    </div>
  );
};
