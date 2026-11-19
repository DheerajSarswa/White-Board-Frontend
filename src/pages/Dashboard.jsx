import { FiPlus, FiSearch, FiGrid, FiShare2, FiTrash2, FiEdit3 } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllCanvases,
  createCanvas,
  deleteCanvas,
  shareCanvas,
} from "../utils/api";
import { useAuth } from "../store/AuthContext";
import {
  CanvasNameModal,
  ConfirmModal,
  EmailInputModal,
} from "../components/Modal";
import styles from "./Dashboard.module.css";

export const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [canvases, setCanvases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [canvasToDelete, setCanvasToDelete] = useState(null);
  const [canvasToShare, setCanvasToShare] = useState(null);
  const [shareError, setShareError] = useState("");

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

  const handleShareCanvas = (canvas) => {
    setCanvasToShare(canvas);
    setShareError("");
    setShowShareModal(true);
  };

  const handleShareConfirm = async (sharedWithEmail) => {
    if (!canvasToShare) return;

    setShareError("");
    try {
      await shareCanvas(canvasToShare._id, sharedWithEmail);
      setShowShareModal(false);
      setCanvasToShare(null);
      // Optionally show success message or refresh canvases
    } catch (err) {
      // Display backend error message directly
      if (err.message) {
        setShareError(err.message);
      } else {
        setShareError("Failed to share canvas");
      }
      console.error(err);
    }
  };

  const handleCanvasClick = (id) => {
    navigate(`/canvas/${id}`);
  };

  const visibleCanvases = canvases.filter((canvas) => canvas.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}><span className={styles.brandMark}>✳</span> whiteboard</div>
        <div className={styles.headerRight}>
          <span className={styles.userName}>{user?.name || "My workspace"}</span>
          <button className={styles.logoutBtn} onClick={logout}>Log out</button>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.eyebrow}>Your workspace</div>
        <div className={styles.intro}>
          <div><h1>A fresh space for your next idea.</h1>
          <p className={styles.subTitle}>Welcome back, {user?.name || "there"}. Pick up a canvas or start something new.</p></div>
          <button className={styles.createBtn} onClick={handleCreateCanvas} disabled={isCreating}>
            <FiPlus size={18} /> {isCreating ? "Creating…" : "New canvas"}
          </button>
        </div>
        {error && <div role="alert" className={styles.error}>{error}</div>}
        <div className={styles.sectionHeader}>
          <h2><FiGrid size={16} /> Your canvases <span className={styles.count}>{canvases.length}</span></h2>
          <label className={styles.search}><FiSearch size={15} /><input aria-label="Search canvases" placeholder="Find a canvas…" value={search} onChange={(e) => setSearch(e.target.value)} type="search" /></label>
        </div>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <p>Loading canvases...</p>
        </div>
      ) : visibleCanvases.length === 0 ? (
        <div className={styles.emptyState}>
          <FiEdit3 /><h3>{search ? "No matching canvases" : "Every great idea starts here."}</h3>
          <p>{search ? "Try a different name to find your canvas." : "Create your first canvas and see where it takes you."}</p>
        </div>
      ) : (
        <div className={styles.canvasGrid}>
          {visibleCanvases.map((canvas) => (
            <div
              key={canvas._id}
              className={styles.canvasCard}
            >
              <button className={styles.openCanvas} onClick={() => handleCanvasClick(canvas._id)} aria-label={`Open ${canvas.name}`}>
              <div className={styles.canvasPreview}>
                <span className={styles.previewPlaceholder}><FiEdit3 /></span>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.canvasName}>{canvas.name}</h3>
                <p className={styles.canvasDate}>
                  Created {new Date(canvas.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              </button>
              <div className={styles.cardActions}>
              <button
                className={styles.shareBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareCanvas(canvas);
                }}
              >
                <FiShare2 /> Share
              </button>
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCanvas(canvas._id);
                }}
                disabled={deletingId === canvas._id}
              >
                <FiTrash2 /> {deletingId === canvas._id ? "Deleting…" : "Delete"}
              </button>
              </div>
            </div>
          ))}
        </div>
      )}

      </main>
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

      <EmailInputModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setCanvasToShare(null);
          setShareError("");
        }}
        onConfirm={handleShareConfirm}
        canvasName={canvasToShare?.name || ""}
        error={shareError}
      />
    </div>
  );
};
