import { Color } from "@paosder/gl-world";

export function drawToCanvas(
  text: string,
  fontSize: number,
  fontFamily = "Arial"
) {
  const canvas = document.createElement("canvas");
  canvas.height = fontSize;
  const textCtx = canvas.getContext("2d")!;
  textCtx.font = `${fontSize}px ${fontFamily}`;
  textCtx.textBaseline = "middle";
  textCtx.fillStyle = "black";
  const measured = textCtx.measureText(text);
  canvas.width =
    measured.actualBoundingBoxLeft + measured.actualBoundingBoxRight;

  // re-initialize context2d.
  // https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-set-bitmap-dimensions
  textCtx.font = `${fontSize}px ${fontFamily}`;
  textCtx.textBaseline = "middle";
  textCtx.fillStyle = "black";

  console.log(measured.actualBoundingBoxLeft + measured.actualBoundingBoxRight);
  textCtx.fillText(text, 0, fontSize * 0.5);
  return textCtx.getImageData(0, 0, canvas.width, fontSize);
}

export function determineColor(
  colors: Array<Color>,
  colorRatio: Array<number>,
  alpha?: number
): Color {
  const sum = colorRatio.reduce<number>((acc, el) => acc + el, 0);
  let random = Math.random() * sum;
  for (let i = 0, n = colorRatio.length; i < n; i += 1) {
    if (random > colorRatio[i]) {
      random -= colorRatio[i];
    } else {
      if (alpha) {
        // if alpha given, override it.
        const newColor: Color = [...colors[i]];
        newColor[3] = alpha;
        return newColor;
      }
      return colors[i];
    }
  }
  return colors[colors.length - 1];
}
