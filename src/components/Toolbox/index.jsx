import React, { useContext } from "react";
import classes from "./index.module.css";
import cx from "classnames";
import {
  COLORS,
  FILL_TOOL_TYPES,
  SIZE_TOOL_TYPES,
  STROKE_TOOL_TYPES,
  TOOL_ITEMS,
} from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import boardContext from "../../store/board-context";

const Toolbox = () => {
  const { activeToolItem } = useContext(boardContext);
  const {
    toolboxState,
    handleChangeStroke,
    handleChangeFill,
    handleChangeSize,
  } = useContext(toolboxContext);

  const strokeColor = toolboxState[activeToolItem]?.stroke;
  const fillColor = toolboxState[activeToolItem]?.fill;
  const size = toolboxState[activeToolItem]?.size;

  return (
    <div className={classes.container}>
      {STROKE_TOOL_TYPES.includes(activeToolItem) && (
        <div className={classes.selectOptionContainer}>
          <div className={classes.toolBoxLabel}>Stroke Color</div>
          <div className={classes.colorsContainer}>
            <div>
              <input
                aria-label="Custom color" type="color"
                className={classes.colorPicker}
                value={strokeColor}
                onChange={(e) =>
                  handleChangeStroke(activeToolItem, e.target.value)
                }
              />
            </div>
            {Object.keys(COLORS).map((k) => {
              return (
                <button
                  type="button" title={k.toLowerCase()} aria-label={`Stroke ${k.toLowerCase()}`} aria-pressed={strokeColor === COLORS[k]}
                  key={k}
                  className={cx(classes.colorBox, {
                    [classes.activeColorBox]: strokeColor === COLORS[k],
                  })}
                  style={{ backgroundColor: COLORS[k] }}
                  onClick={() => handleChangeStroke(activeToolItem, COLORS[k])}
                />
              );
            })}
          </div>
        </div>
      )}

      {FILL_TOOL_TYPES.includes(activeToolItem) && (
        <div className={classes.selectOptionContainer}>
          <div className={classes.toolBoxLabel}>Fill Color</div>
          <div className={classes.colorsContainer}>
            {fillColor === null ? (
              <button type="button" aria-label="Choose a fill color"
                className={cx(classes.colorPicker, classes.noFillColorBox)}
                onClick={() => handleChangeFill(activeToolItem, COLORS.BLACK)}
              />
            ) : (
              <div>
                <input
                  className={classes.colorPicker}
                  aria-label="Custom color" type="color"
                  value={fillColor}
                  onChange={(e) =>
                    handleChangeFill(activeToolItem, e.target.value)
                  }
                ></input>
              </div>
            )}
            <button type="button" title="No fill" aria-label="No fill" aria-pressed={fillColor === null}
              className={cx(classes.colorBox, classes.noFillColorBox, {
                [classes.activeColorBox]: fillColor === null,
              })}
              onClick={() => handleChangeFill(activeToolItem, null)}
            />
            {Object.keys(COLORS).map((k) => {
              return (
                <button
                  type="button" title={k.toLowerCase()} aria-label={`Fill ${k.toLowerCase()}`} aria-pressed={fillColor === COLORS[k]}
                  key={k}
                  className={cx(classes.colorBox, {
                    [classes.activeColorBox]: fillColor === COLORS[k],
                  })}
                  style={{ backgroundColor: COLORS[k] }}
                  onClick={() => handleChangeFill(activeToolItem, COLORS[k])}
                />
              );
            })}
          </div>
        </div>
      )}

      {SIZE_TOOL_TYPES.includes(activeToolItem) && (
        <div className={classes.selectOptionContainer}>
          <div className={classes.toolBoxLabel}>
            {activeToolItem === TOOL_ITEMS.TEXT ? "Font Size" : "Brush Size"}
          </div>
          <input
            aria-label={activeToolItem === TOOL_ITEMS.TEXT ? "Font size" : "Brush size"} type="range"
            min={activeToolItem === TOOL_ITEMS.TEXT ? 12 : 1}
            max={activeToolItem === TOOL_ITEMS.TEXT ? 64 : 10}
            step={1}
            value={size}
            onChange={(e) => {
              handleChangeSize(activeToolItem, parseInt(e.target.value));
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Toolbox;
