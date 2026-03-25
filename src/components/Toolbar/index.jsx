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
    const data = canvas.toDataURL("image/jpeg");
    const anchor = document.createElement("a");
    anchor.href = data;
    anchor.download = "board.jpeg";
    anchor.click();
  };

  return (
    <div className={classes.container}>
      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.BRUSH,
        })}
        onClick={() => handleToolItemClick(TOOL_ITEMS.BRUSH)}
      >
        <FaPaintBrush />
      </div>
      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.LINE,
        })}
        onClick={() => handleToolItemClick(TOOL_ITEMS.LINE)}
      >
        <FaSlash />
      </div>
      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.RECTANGLE,
        })}
        onClick={() => handleToolItemClick(TOOL_ITEMS.RECTANGLE)}
      >
        <LuRectangleHorizontal />
      </div>
      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.CIRCLE,
        })}
        onClick={() => handleToolItemClick(TOOL_ITEMS.CIRCLE)}
      >
        <FaRegCircle />
      </div>
      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.ARROW,
        })}
        onClick={() => handleToolItemClick(TOOL_ITEMS.ARROW)}
      >
        <FaArrowRight />
      </div>
      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.TEXT,
        })}
        onClick={() => handleToolItemClick(TOOL_ITEMS.TEXT)}
      >
        <FaFont />
      </div>
      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.ERASER,
        })}
        onClick={() => handleToolItemClick(TOOL_ITEMS.ERASER)}
      >
        <FaEraser />
      </div>
      <div className={classes.toolItem} onClick={handleBoardUndo}>
        <FaUndoAlt />
      </div>
      <div className={classes.toolItem} onClick={handleBoardRedo}>
        <FaRedoAlt />
      </div>
      <div className={classes.toolItem} onClick={handleDownloadClick}>
        <FaDownload />
      </div>
    </div>
  );
};

export default Toolbar;
