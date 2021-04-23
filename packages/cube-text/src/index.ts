import { mat4, quat } from "gl-matrix";
import { Queue, World } from "@paosder/gl-world";
import CubeRenderer from "./cube";

document.body.style.margin = "0";

function getTextImageData(text: string, fontSize: number) {
  // TODO: font async load.
  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font
  const canvas = document.createElement("canvas");
  canvas.height = fontSize;
  const textCtx = canvas.getContext("2d")!;
  textCtx.font = `${fontSize}px Arial`;
  textCtx.textBaseline = "middle";
  textCtx.fillStyle = "black";
  const measured = textCtx.measureText(text);
  canvas.width =
    measured.actualBoundingBoxLeft + measured.actualBoundingBoxRight;
  // re-initialize context2d.
  // https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-set-bitmap-dimensions
  textCtx.font = `${fontSize}px Arial`;
  textCtx.textBaseline = "middle";
  textCtx.fillStyle = "black";

  console.log(measured.actualBoundingBoxLeft + measured.actualBoundingBoxRight);
  textCtx.fillText(text, 0, fontSize * 0.5);
  return textCtx.getImageData(0, 0, canvas.width, fontSize);
}

const wrapper = document.createElement("div");
wrapper.style.position = "relative";
wrapper.style.height = "100vh";
document.body.append(wrapper);
const world = new World("world");
const cubeRenderer = new CubeRenderer();
cubeRenderer.onselect = (id: string) => {
  cubeRenderer.getCubeAttr(id, "color", (color) => {
    color[0] = 0;
    color[1] = 0;
    color[2] = 0;
    return true;
  });
};
world.canvas.addEventListener("pointermove", (e) => {
  world.mouseX = e.offsetX;
  world.mouseY = e.offsetY;
});

world.addRenderer(cubeRenderer);
world.attach(wrapper);

world.autoResize = true;

const textData = getTextImageData(`Hello Cube Text!!`, 24);
const centerPos = {
  x: textData.width,
  y: textData.height,
};

const cubes = new Queue<{
  id: string;
  color: [r: number, g: number, b: number, a: number];
  position: [x: number, y: number, z: number];
  rotation: mat4;
  size: [size: number];
}>();

for (let i = textData.height - 1; i >= 0; i -= 1) {
  for (let j = textData.width - 1; j >= 0; j -= 1) {
    const alpha = textData.data[i * textData.width * 4 + j * 4 + 3];
    if (alpha > 10) {
      // exceeds threshold.
      cubes.enqueue({
        id: `${cubes.length}`,
        color: [Math.random() > 0.5 ? 1 : 0, 0, 0, alpha / 256],
        position: [j * 2, -i * 2 + textData.height * 2, 0],
        size: [1],
        rotation: mat4.fromQuat(
          mat4.create(),
          quat.random(
            quat.identity(quat.create())
            // [0, 1, 0],
            // [0, Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)]
          )
        ),
      });
      if (centerPos.y < -i + textData.height) {
        centerPos.y = -i + textData.height;
      }
    }
  }
}
console.log(cubes.length);
world.lookAt[0] = centerPos.x;
world.lookAt[1] = centerPos.y;
world.lookAt[2] = 0;

world.eye[0] = centerPos.x;
world.eye[1] = centerPos.y;

world.canvas.style.backgroundColor = "transparent";

const renderLoop = (time: number) => {
  if (cubes.length > 0) {
    for (let i = 0; cubes.length > 0 && i < 5; i += 1) {
      const { id, ...props } = cubes.dequeue();
      cubeRenderer.add(id, props);
    }
  }
  // if (time > 10000) {
  //   // TODO: clear.
  //   cubeRenderer.clear();
  // }

  // world.eye[0] =
  //   centerPos.x + centerPos.x * Math.sin((time * 0.05 * Math.PI) / 180);
  // world.eye[2] = centerPos.x * Math.cos((time * 0.05 * Math.PI) / 180);
  // world.eye[0] = centerPos.x;
  // world.eye[0] = 10 * Math.sin((time * 0.05 * Math.PI) / 180);
  // world.eye[1] = 0;
  // world.eye[2] = 10 * Math.cos((time * 0.05 * Math.PI) / 180);
  world.eye[2] = centerPos.x * 0.75; // * Math.sin((time * 0.05 * Math.PI) / 180) ** 2;

  world.refreshCamera();
  world.render();
  requestAnimationFrame(renderLoop);
};

renderLoop(0);
