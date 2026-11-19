import React, { useContext } from "react";
import classes from "./index.module.css";
import cx from "classnames";
import {
  FaSlash,
  FaRegCircle,
  FaArrowRight,
  FaPaintBrush,
  FaEraser,
  FaFont,
  FaUndoAlt,
  FaRedoAlt,
  FaDownload,
} from "react-icons/fa";
import { LuRectangleHorizontal } from "react-icons/lu";
import boardContext from "../../store/board-context";
import { TOOL_ITEMS } from "../../constants";

const Toolbar = () => {
  const {
    activeToolItem,
    handleToolItemClick,
    handleBoardUndo,
    handleBoardRedo,
  } = useContext(boardContext);

  const handleDownloadClick = () => {
    const canvas = document.getElementById("canvas");

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempContext = tempCanvas.getContext("2d");

    tempContext.fillStyle = "white";
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempContext.drawImage(canvas, 0, 0);

    const data = tempCanvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = data;
    anchor.download = "board.png";
    anchor.click();
  };

  const tools = [
    [TOOL_ITEMS.BRUSH, "Brush", <FaPaintBrush key="FaPaintBrush" />],
    [TOOL_ITEMS.LINE, "Line", <FaSlash key="FaSlash" />],
    [TOOL_ITEMS.RECTANGLE, "Rectangle", <LuRectangleHorizontal key="LuRectangleHorizontal" />],
    [TOOL_ITEMS.CIRCLE, "Circle", <FaRegCircle key="FaRegCircle" />],
    [TOOL_ITEMS.ARROW, "Arrow", <FaArrowRight key="FaArrowRight" />],
    [TOOL_ITEMS.TEXT, "Text", <FaFont key="FaFont" />],
    [TOOL_ITEMS.ERASER, "Eraser", <FaEraser key="FaEraser" />],
  ];
  return (
    <div className={classes.container} role="group" aria-label="Drawing tools">
      {tools.map(([tool, label, icon]) => (
        <button key={tool} type="button" title={label} aria-label={label}
          aria-pressed={activeToolItem === tool}
          className={cx(classes.toolItem, { [classes.active]: activeToolItem === tool })}
          onClick={() => handleToolItemClick(tool)}>{icon}</button>
      ))}
      <span className={classes.divider} aria-hidden="true" />
      <button type="button" className={classes.toolItem} title="Undo (⌘/Ctrl Z)" aria-label="Undo" onClick={handleBoardUndo}><FaUndoAlt /></button>
      <button type="button" className={classes.toolItem} title="Redo (⌘/Ctrl Shift Z)" aria-label="Redo" onClick={handleBoardRedo}><FaRedoAlt /></button>
      <button type="button" className={classes.toolItem} title="Download PNG" aria-label="Download PNG" onClick={handleDownloadClick}><FaDownload /></button>
    </div>
  );
};
export default Toolbar;
