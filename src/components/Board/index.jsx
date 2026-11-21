import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import { createElementId, createRoughElement, getSvgPathFromStroke, isPointNearElement } from "../../utils/element";
import getStroke from "perfect-freehand";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import classes from "./index.module.css";

const drawnShapes = new WeakMap();
const brushPaths = new WeakMap();

function Board() {
  const canvasRef = useRef();
  const textAreaRef = useRef();
  const {
    activeToolItem,
    elements,
    erasableElements,
    draft,
    toolActionType,
    handleBoardMouseDown,
    handleBoardMouseMove,
    handleBoardMouseUp,
    handleErase,
    handleTextAreaBlur,
    handleBoardUndo,
    handleBoardRedo,
  } = useContext(boardContext);

  const { toolboxState } = useContext(toolboxContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      // Redraw existing content after resizing the bitmap.
      canvas.dispatchEvent(new Event("board-resize"));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const modifierKey = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target.isContentEditable) return;
      if (modifierKey && key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleBoardUndo();
      } else if (modifierKey && ((key === "z" && event.shiftKey) || key === "y")) {
        event.preventDefault();
        handleBoardRedo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleBoardUndo, handleBoardRedo]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;
      const bitmapWidth = Math.round(width * scale);
      const bitmapHeight = Math.round(height * scale);
      if (canvas.width !== bitmapWidth) canvas.width = bitmapWidth;
      if (canvas.height !== bitmapHeight) canvas.height = bitmapHeight;

      const context = canvas.getContext("2d");
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);
      const roughCanvas = rough.canvas(canvas);

      for (const element of elements) {
        const { id, type, x1, y1, x2, y2, stroke, size } = element;
        switch (type) {
          case TOOL_ITEMS.LINE:
          case TOOL_ITEMS.RECTANGLE:
          case TOOL_ITEMS.CIRCLE:
          case TOOL_ITEMS.ARROW: {
            let shape = element.roughEle || drawnShapes.get(element);
            if (!shape) {
              shape = createRoughElement(id, x1, y1, x2, y2, element).roughEle;
              drawnShapes.set(element, shape);
            }
            roughCanvas.draw(shape);
            break;
          }
          case TOOL_ITEMS.BRUSH: {
            let path = element.path || brushPaths.get(element);
            if (!path) {
              path = new Path2D(getSvgPathFromStroke(getStroke(element.points || [], { size })));
              brushPaths.set(element, path);
            }
            context.save();
            context.fillStyle = stroke;
            context.fill(path);
            context.restore();
            break;
          }
          case TOOL_ITEMS.TEXT:
            context.save();
            context.textBaseline = "top";
            context.font = `${size}px Caveat, cursive`;
            context.fillStyle = stroke;
            context.fillText(element.text, x1, y1);
            context.restore();
            break;
        }
      }
    };
    draw();
    canvas.addEventListener("board-resize", draw);
    return () => canvas.removeEventListener("board-resize", draw);
  }, [elements]);

  useEffect(() => {
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      textAreaRef.current?.focus();
    }
  }, [toolActionType]);

  const getCanvasCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const erasedAt = ({ x, y }) => erasableElements.flatMap((element) =>
    isPointNearElement(element, x, y) ? [{ element }] : [],
  );

  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && (
        <textarea
          type="text"
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: draft.y1,
            left: draft.x1,
            fontSize: `${draft.size}px`,
            color: draft.stroke,
            fontFamily: '"Caveat", cursive',
          }}
          onBlur={(e) => handleTextAreaBlur(e.target.value)}
        />
      )}
      <canvas
        className={classes.canvas}
        ref={canvasRef}
        id="canvas"
        aria-label="Drawing canvas"
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return;
          if (toolActionType === TOOL_ACTION_TYPES.WRITING) return;
          if (activeToolItem === TOOL_ITEMS.TEXT) {
            // Keep the pointer's default focus change from blurring the new editor.
            event.preventDefault();
          } else {
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          const coords = getCanvasCoordinates(event);
          handleBoardMouseDown({
            ...coords,
            id: createElementId(),
            options: toolboxState[activeToolItem],
            erased: activeToolItem === TOOL_ITEMS.ERASER ? erasedAt(coords) : [],
          });
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const coords = getCanvasCoordinates(event);
          if (toolActionType === TOOL_ACTION_TYPES.ERASING) handleErase(erasedAt(coords));
          else if (toolActionType === TOOL_ACTION_TYPES.DRAWING) handleBoardMouseMove(coords);
        }}
        onPointerUp={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const coords = getCanvasCoordinates(event);
          if (toolActionType === TOOL_ACTION_TYPES.ERASING) handleErase(erasedAt(coords));
          else if (toolActionType === TOOL_ACTION_TYPES.DRAWING) handleBoardMouseMove(coords);
          handleBoardMouseUp();
        }}
        onLostPointerCapture={handleBoardMouseUp}
      />
    </>
  );
}

export default Board;
