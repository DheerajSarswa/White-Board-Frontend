import React, { useContext, useLayoutEffect } from "react";
import { useEffect, useRef } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";

function Board() {
  const canvasRef = useRef();
  const {
    elements,
    handleBoardMouseDown,
    handleBoardMouseMove,
    handleBoardMouseUp,
  } = useContext(boardContext);

  const { toolboxState } = useContext(toolboxContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.save();
    const roughCanvas = rough.canvas(canvas);

    elements.forEach((element) => {
      switch (element.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          roughCanvas.draw(element.roughEle);
          break;
        case TOOL_ITEMS.BRUSH:
          context.fillStyle = element.stroke;
          context.fill(element.path);
          context.restore();
          break;
        default:
          throw new Error("Type not recognized");
      }
    });

    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);

  const mouseDownHandler = (event) => {
    handleBoardMouseDown(event, toolboxState);
  };

  const mouseMoveHandler = (event) => {
    handleBoardMouseMove(event);
  };

  const mouseUpHandler = () => {
    handleBoardMouseUp();
  };

  return (
    <>
      <canvas
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
