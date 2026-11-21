import { ARROW_LENGTH, TOOL_ITEMS } from "../constants";
import rough from "roughjs/bin/rough";
import { getArrowHeadsCoordinates, isPointCloseToLine } from "./math";
import getStroke from "perfect-freehand";

const gen = rough.generator();

export const createElementId = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
};

export const createRoughElement = (
  id,
  x1,
  y1,
  x2,
  y2,
  { type, stroke, fill, size },
) => {
  const element = {
    id,
    x1,
    y1,
    x2,
    y2,
    type,
    stroke,
    fill,
    size,
  };
  const legacyId = typeof id === "string" ? /^legacy-(\d+)-/.exec(id) : null;
  const seed = typeof id === "number" || legacyId
    ? Number(legacyId?.[1] ?? id) + 1
    : [...id].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) | 0, 0) >>> 1;
  const options = {
    seed: seed || 1,
    fillStyle: "solid",
  };
  if (stroke) {
    options.stroke = stroke;
  }
  if (fill) {
    options.fill = fill;
  }
  if (size) {
    options.strokeWidth = size;
  }
  switch (type) {
    case TOOL_ITEMS.BRUSH: {
      const brushElement = {
        id,
        points: [{ x: x1, y: y1 }],
        path: new Path2D(
          getSvgPathFromStroke(getStroke([{ x: x1, y: y1 }], { size: size })),
        ),
        type,
        stroke,
        size,
      };
      return brushElement;
    }
    case TOOL_ITEMS.LINE:
      element.roughEle = gen.line(x1, y1, x2, y2, options);
      return element;

    case TOOL_ITEMS.RECTANGLE:
      element.roughEle = gen.rectangle(x1, y1, x2 - x1, y2 - y1, options);
      return element;
    case TOOL_ITEMS.CIRCLE: {
      const cx = (x1 + x2) / 2,
        cy = (y1 + y2) / 2;
      const width = x2 - x1,
        height = y2 - y1;
      element.roughEle = gen.ellipse(cx, cy, width, height, options);
      return element;
    }
    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(
        x1,
        y1,
        x2,
        y2,
        ARROW_LENGTH,
      );
      const points = [
        [x1, y1],
        [x2, y2],
        [x3, y3],
        [x2, y2],
        [x4, y4],
      ];
      element.roughEle = gen.linearPath(points, options);
      return element;
    }
    case TOOL_ITEMS.TEXT:
      element.text = "";
      return element;
    default:
      throw new Error("Type not recognized");
  }
};

export const isPointNearElement = (element, pointX, pointY) => {
  const { x1, y1, x2, y2, type, fill } = element;
  const context = document.getElementById("canvas").getContext("2d");
  switch (type) {
    case TOOL_ITEMS.LINE:
      return isPointCloseToLine(x1, y1, x2, y2, pointX, pointY);
    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(
        x1,
        y1,
        x2,
        y2,
        ARROW_LENGTH,
      );
      return (
        isPointCloseToLine(x1, y1, x2, y2, pointX, pointY) ||
        isPointCloseToLine(x2, y2, x3, y3, pointX, pointY) ||
        isPointCloseToLine(x2, y2, x4, y4, pointX, pointY)
      );
    }
    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
      return (
        isPointCloseToLine(x1, y1, x2, y1, pointX, pointY) ||
        isPointCloseToLine(x2, y1, x2, y2, pointX, pointY) ||
        isPointCloseToLine(x2, y2, x1, y2, pointX, pointY) ||
        isPointCloseToLine(x1, y2, x1, y1, pointX, pointY) ||
        (fill !== null &&
          pointX <= Math.max(x1, x2) &&
          pointX >= Math.min(x1, x2) &&
          pointY <= Math.max(y1, y2) &&
          pointY >= Math.min(y1, y2))
      );
    case TOOL_ITEMS.BRUSH: {
      if (!element.path || !(element.path instanceof Path2D)) {
        // Reconstruct path if missing (for saved canvases)
        element.path = new Path2D(
          getSvgPathFromStroke(
            getStroke(element.points || [], { size: element.size }),
          ),
        );
      }
      const { x, y } = context.getTransform().transformPoint({ x: pointX, y: pointY });
      return context.isPointInPath(element.path, x, y);
    }
    case TOOL_ITEMS.TEXT: {
      context.save();
      context.font = `${element.size}px Caveat, cursive`;
      const textWidth = context.measureText(element.text).width;
      const textHeight = parseInt(element.size);
      context.restore();
      return (
        isPointCloseToLine(x1, y1, x1 + textWidth, y1, pointX, pointY) ||
        isPointCloseToLine(
          x1 + textWidth,
          y1,
          x1 + textWidth,
          y1 + textHeight,
          pointX,
          pointY,
        ) ||
        isPointCloseToLine(
          x1 + textWidth,
          y1 + textHeight,
          x1,
          y1 + textHeight,
          pointX,
          pointY,
        ) ||
        isPointCloseToLine(x1, y1 + textHeight, x1, y1, pointX, pointY)
      );
    }
    default:
      throw new Error("Type not recognized");
  }
};

export function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"],
  );

  d.push("Z");
  return d.join(" ");
}
