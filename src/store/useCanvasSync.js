import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { BOARD_ACTIONS } from "../constants";
import { saveCanvasEdit } from "../utils/api";
import { joinCanvas, leaveCanvas } from "../utils/socket";
import socketContext from "./socket-context";

const AUTOSAVE_DELAY = 1000;
const PREVIEW_INTERVAL = 32;
const MAX_RECENT_EDITS = 128;

const serializeEdit = ({ add, remove }) => ({
  add: add.map(({ element: { id, type, x1, y1, x2, y2, stroke, fill, size, points, text }, index }) => ({
    element: { id, type, x1, y1, x2, y2, stroke, fill, size, points, text },
    index,
  })),
  remove,
});

export const useCanvasSync = (canvasId, pending, gesture, dispatch) => {
  const { socket, isConnected } = useContext(socketContext);
  const [joinedSocketId, setJoinedSocketId] = useState(null);
  const [previews, setPreviews] = useState(() => new Map());
  const [saveError, setSaveError] = useState("");
  const readySocket = useRef(null);
  const saves = useRef({
    queue: [], lastQueued: 0, running: false, failed: false, timer: null, published: new Set(),
  });
  const preview = useRef({ timer: null, gesture: null, publishedId: null });
  const isLive = isConnected && joinedSocketId !== null && joinedSocketId === socket?.id;

  const publishPending = useCallback(() => {
    const live = readySocket.current;
    if (!live?.connected) return;
    const { queue, published } = saves.current;
    for (const { editId, edit } of queue) {
      if (published.has(editId)) continue;
      live.emit("canvas-edit-preview", { canvasId, editId, edit });
      published.add(editId);
    }
  }, [canvasId]);

  const clearPreview = useCallback((editId) => {
    const live = readySocket.current;
    if (live?.connected) live.emit("canvas-edit-preview", { canvasId, editId, edit: null });
  }, [canvasId]);

  const retrySave = useCallback(async () => {
    const state = saves.current;
    if (state.running || !state.queue.length) return;
    clearTimeout(state.timer);
    state.running = true;
    state.failed = false;
    setSaveError("");
    publishPending();

    try {
      while (state.queue.length) {
        const { editId, edit } = state.queue[0];
        const snapshot = await saveCanvasEdit(canvasId, { ...edit, editId });
        state.queue.shift();
        // Also clears previews when a retried edit was already persisted.
        if (state.published.delete(editId)) clearPreview(editId);
        dispatch({
          type: BOARD_ACTIONS.SAVE_CONFIRMED,
          payload: { ...snapshot, editId, savedAt: new Date() },
        });
      }
    } catch (error) {
      state.failed = true;
      for (const editId of state.published) clearPreview(editId);
      state.published.clear();
      setSaveError(error.response?.data?.message || "Couldn’t save canvas changes");
    } finally {
      state.running = false;
    }
  }, [canvasId, clearPreview, dispatch, publishPending]);

  useEffect(() => {
    const state = saves.current;
    const newEntries = pending.filter(({ sequence }) => sequence > state.lastQueued);
    if (!newEntries.length) return;
    for (const { editId, edit, sequence } of newEntries) {
      state.queue.push({ editId, edit: serializeEdit(edit) });
      state.lastQueued = sequence;
    }
    if (state.failed) return;
    publishPending();
    if (!state.running) {
      clearTimeout(state.timer);
      state.timer = setTimeout(retrySave, AUTOSAVE_DELAY);
    }
  }, [pending, publishPending, retrySave]);

  useEffect(() => {
    const state = saves.current;
    window.addEventListener("online", retrySave);
    return () => {
      window.removeEventListener("online", retrySave);
      clearTimeout(state.timer);
      if (!state.failed) retrySave();
    };
  }, [retrySave]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    let active = true;
    const committed = new Set();
    const published = saves.current.published;
    const currentPreview = preview.current;

    const handleSnapshot = (snapshot) => {
      if (snapshot.canvasId !== canvasId || !Number.isInteger(snapshot.revision)) return;
      if (snapshot.editId) {
        committed.add(snapshot.editId);
        if (committed.size > MAX_RECENT_EDITS) committed.delete(committed.values().next().value);
        setPreviews((current) => {
          const remaining = new Map(current);
          for (const [key, entry] of current) {
            if (entry.editId === snapshot.editId) remaining.delete(key);
          }
          return remaining.size === current.size ? current : remaining;
        });
      }
      dispatch({ type: BOARD_ACTIONS.SYNC_REMOTE_ELEMENTS, payload: snapshot });
    };
    const handlePreview = ({ canvasId: room, sender, editId, edit }) => {
      if (room !== canvasId || (edit && committed.has(editId))) return;
      setPreviews((current) => {
        const updated = new Map(current);
        if (edit) {
          updated.set(`${sender}:${editId}`, { sender, editId, edit });
        } else if (editId) {
          updated.delete(`${sender}:${editId}`);
        } else {
          for (const [key, entry] of current) {
            if (entry.sender === sender) updated.delete(key);
          }
        }
        return !edit && updated.size === current.size ? current : updated;
      });
    };
    const handleDisconnect = () => {
      readySocket.current = null;
      published.clear();
      currentPreview.publishedId = null;
      setJoinedSocketId(null);
      setPreviews(new Map());
    };

    socket.on("canvas-updated", handleSnapshot);
    socket.on("canvas-edit-preview", handlePreview);
    socket.on("disconnect", handleDisconnect);
    joinCanvas(canvasId).then((snapshot) => {
      if (!active || snapshot.canvasId !== canvasId) return;
      readySocket.current = socket;
      handleSnapshot(snapshot);
      setJoinedSocketId(socket.id);
      if (saves.current.failed) retrySave();
      else publishPending();
    }).catch((error) => {
      if (active) console.error("Failed to join canvas room:", error);
    });

    return () => {
      active = false;
      readySocket.current = null;
      published.clear();
      socket.off("canvas-updated", handleSnapshot);
      socket.off("canvas-edit-preview", handlePreview);
      socket.off("disconnect", handleDisconnect);
      leaveCanvas(canvasId);
    };
  }, [canvasId, dispatch, isConnected, publishPending, retrySave, socket]);

  useEffect(() => {
    const current = preview.current;
    current.gesture = gesture;
    if (current.publishedId && current.publishedId !== gesture?.editId) {
      if (!saves.current.published.has(current.publishedId)) clearPreview(current.publishedId);
      current.publishedId = null;
    }
    if (!gesture || !isLive || saveError) {
      clearTimeout(current.timer);
      current.timer = null;
      if (current.publishedId) clearPreview(current.publishedId);
      current.publishedId = null;
      return;
    }
    if (current.timer !== null) return;
    current.timer = setTimeout(() => {
      current.timer = null;
      const live = readySocket.current;
      if (!live?.connected) return;
      const { editId, edit } = current.gesture;
      current.publishedId = editId;
      live.volatile.emit("canvas-edit-preview", { canvasId, editId, edit: serializeEdit(edit), draft: true });
    }, PREVIEW_INTERVAL);
  }, [canvasId, clearPreview, gesture, isLive, saveError]);

  useEffect(() => {
    const current = preview.current;
    return () => clearTimeout(current.timer);
  }, []);

  return { previews, saveError, retrySave, isLive };
};
