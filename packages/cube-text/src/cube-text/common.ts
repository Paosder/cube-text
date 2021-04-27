export function drawToCanvas(
  text: string,
  fontSize: number,
  fontStyle = "",
  drawType = "fill",
  fontFamily = "Arial"
) {
  const canvas = document.createElement("canvas");
  canvas.height = fontSize;
  const textCtx = canvas.getContext("2d")!;
  textCtx.font =
    fontStyle === ""
      ? `${fontSize}px ${fontFamily}`
      : `${fontStyle} ${fontSize}px ${fontFamily}`;
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
