import React from "react";
import styles from "./Modal.module.css";

export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const CanvasNameModal = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(name.trim() || "Untitled Canvas");
    setName("Untitled Canvas");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Create New Canvas</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Canvas Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter canvas name, Default : Untitled Canvas"
            autoFocus
          />
        </label>
        <div className={styles.buttons}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit">Create</button>
        </div>
      </form>
    </Modal>
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Confirm Action</h2>
      <p>{message}</p>
      <div className={styles.buttons}>
        <button onClick={onClose}>Cancel</button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
};
