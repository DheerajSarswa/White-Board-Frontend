import React, { useContext } from "react";
import { useEffect, useRef } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES } from "../../constants";

function Board() {
  const canvasRef = useRef();
  const {
    elements,
    toolActionType,
    handleBoardMouseDown,
    handleBoardMouseMove,
    handleBoardMouseUp,
  } = useContext(boardContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.save();
    const roughCanvas = rough.canvas(canvas);

    elements.forEach((element) => {
      roughCanvas.draw(element.roughEle);
    });

    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);

  const mouseDownHandler = (event) => {
    handleBoardMouseDown(event);
  };

  const mouseMoveHandler = (event) => {
    if (toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      handleBoardMouseMove(event);
    }
  };

  const mouseUpHandler = () => {
    handleBoardMouseUp();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={mouseDownHandler}
        onMouseMove={mouseMoveHandler}
        onMouseUp={mouseUpHandler}
      />
    </>
  );
}

export default Board;
