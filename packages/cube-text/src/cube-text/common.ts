import { Color } from "@paosder/gl-world";
import { GradientColorArgs, RandomColor } from "./type";

export function drawToCanvas(
  text: string,
  fontSize: number,
  drawType = "fill",
  fontFamily = "Arial"
) {
  const canvas = document.createElement("canvas");
  canvas.height = fontSize;
  const textCtx = canvas.getContext("2d")!;
  textCtx.font = `${fontSize}px ${fontFamily}`;
  textCtx.textBaseline = "middle";
  textCtx.fillStyle = "black";
  const measured = textCtx.measureText(text);
  // Because of italic, we need to calculate more precisely via the bounding box.
  canvas.width = Math.ceil(
    measured.actualBoundingBoxLeft + measured.actualBoundingBoxRight
  );

  // re-initialize context2d.
  // https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-set-bitmap-dimensions
  textCtx.font = `${fontSize}px ${fontFamily}`;
  textCtx.textBaseline = "middle";
  textCtx.fillStyle = "black";

  if (drawType === "fill") {
    textCtx.fillText(text, 0, fontSize * 0.5);
  } else {
    textCtx.strokeText(text, 0, fontSize * 0.5);
  }
  return textCtx.getImageData(0, 0, canvas.width, fontSize);
}

export function determineColor(
  colors: Array<Color>,
  colorArgs: GradientColorArgs | RandomColor,
  alpha?: number
): Color {
  if (colorArgs.type === "random") {
    const sum = colorArgs.ratio.reduce<number>((acc, el) => acc + el, 0);
    let random = Math.random() * sum;
    for (let i = 0, n = colorArgs.ratio.length; i < n; i += 1) {
      if (random > colorArgs.ratio[i]) {
        random -= colorArgs.ratio[i];
      } else {
        if (alpha) {
          // If alpha is given, override it.
          const newColor: Color = [...colors[i]];
          newColor[3] = alpha;
          return newColor;
        }
        return colors[i];
      }
    }
    return colors[colors.length - 1];
  }
  if (colorArgs.type === "gradient") {
    return colors[0];
  }
  throw new Error(`unknown colorArgs: ${colorArgs}`);
}
