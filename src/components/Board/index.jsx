import { useEffect, useRef } from "react";
import rough from "roughjs";

function Board() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const roughCanvas = rough.canvas(canvas);
    const generator = roughCanvas.generator;
    const rect1 = generator.rectangle(10, 10, 100, 100);
    const rect2 = generator.rectangle(10, 120, 100, 100, { fill: "red" });
    roughCanvas.draw(rect1);
    roughCanvas.draw(rect2);

    // const context = canvas.getContext("2d");
    // context.fillStyle = "pink";
    // context.fillRect(10, 10, 150, 100);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} />
    </>
  );
}

export default Board;
