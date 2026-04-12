import React, {
  useContext,
  useLayoutEffect,
  useEffect as useEffect2,
} from "react";
import { useEffect, useRef } from "react";
import rough from "roughjs";
import { createRoughElement, getSvgPathFromStroke } from "../../utils/element";
import getStroke from "perfect-freehand";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import classes from "./index.module.css";

function Board({ onElementsChange }) {
  const canvasRef = useRef();
  const textAreaRef = useRef();
  const {
    elements,
    toolActionType,
    handleBoardMouseDown,
    handleBoardMouseMove,
    handleBoardMouseUp,
    handleTextAreaBlur,
    handleBoardUndo,
    handleBoardRedo,
  } = useContext(boardContext);

  const { toolboxState } = useContext(toolboxContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      if (modifierKey && event.key === "z" && !event.shiftKey) {
        handleBoardUndo();
      } else if (modifierKey && event.key === "z" && event.shiftKey) {
        handleBoardRedo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleBoardUndo, handleBoardRedo]);

  // Call onElementsChange whenever elements change
  useEffect2(() => {
    if (onElementsChange) {
      onElementsChange(elements);
    }
  }, [elements, onElementsChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure canvas is sized correctly before drawing
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || window.innerWidth;
    canvas.height = rect.height || window.innerHeight;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    const roughCanvas = rough.canvas(canvas);

    elements.forEach((element) => {
      const normalizedElement = { ...element };
      if (
        [
          TOOL_ITEMS.LINE,
          TOOL_ITEMS.RECTANGLE,
          TOOL_ITEMS.CIRCLE,
          TOOL_ITEMS.ARROW,
        ].includes(normalizedElement.type) &&
        !normalizedElement.roughEle
      ) {
        normalizedElement.roughEle = createRoughElement(
          normalizedElement.id,
          normalizedElement.x1,
          normalizedElement.y1,
          normalizedElement.x2,
          normalizedElement.y2,
          normalizedElement,
        ).roughEle;
      }

      switch (normalizedElement.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          roughCanvas.draw(normalizedElement.roughEle);
          break;
        case TOOL_ITEMS.BRUSH: {
          const path =
            normalizedElement.path ||
            new Path2D(
              getSvgPathFromStroke(
                getStroke(normalizedElement.points || [], {
                  size: normalizedElement.size,
                }),
              ),
            );
          context.save();
          context.fillStyle = normalizedElement.stroke;
          context.fill(path);
          context.restore();
          break;
        }
        case TOOL_ITEMS.TEXT: {
          context.save();
          context.textBaseline = "top";
          context.font = `${normalizedElement.size}px Caveat, cursive`;
          context.fillStyle = normalizedElement.stroke;
          context.fillText(
            normalizedElement.text,
            normalizedElement.x1,
            normalizedElement.y1,
          );
          context.restore();
          break;
        }
        default:
          throw new Error("Type not recognized");
      }
    });
  }, [elements]);

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      setTimeout(() => {
        textarea.focus();
      }, 0);
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

  const mouseDownHandler = (event) => {
    handleBoardMouseDown(getCanvasCoordinates(event), toolboxState);
  };

  const mouseMoveHandler = (event) => {
    handleBoardMouseMove(getCanvasCoordinates(event));
  };

  const mouseUpHandler = () => {
    handleBoardMouseUp();
  };

  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && (
        <textarea
          type="text"
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: elements[elements.length - 1].y1,
            left: elements[elements.length - 1].x1,
            fontSize: `${elements[elements.length - 1]?.size}px`,
            color: elements[elements.length - 1]?.stroke,
            fontFamily: '"Caveat", cursive',
          }}
          onBlur={(e) => handleTextAreaBlur(e.target.value)}
        />
      )}
      <canvas
        className={classes.canvas}
        ref={canvasRef}
        id="canvas"
        onMouseDown={mouseDownHandler}
        onMouseMove={mouseMoveHandler}
        onMouseUp={mouseUpHandler}
      />
    </>
  );
}

export default Board;
