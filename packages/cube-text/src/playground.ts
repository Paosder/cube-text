import {
  CubeText,
  generateFullscreen,
  generateGradientColor,
  generateRandomColor,
  generateRotateCameraUp,
  generateRotateZAxis,
  generateZoom,
  randomRotate,
} from "./cube-text";
import { generateRotateTo } from "./cube-text/utils/render";

const wrapper = document.createElement("div");
wrapper.style.position = "relative";
wrapper.style.height = "200px";
wrapper.style.border = "1px solid gray";
document.body.appendChild(wrapper);

const cubeText = new CubeText(wrapper);
// cubeText.register(
//   "initCube",
//   generateRandomColor([
//     {
//       color: [0, 0, 0, 1],
//       ratio: 0.5,
//     },
//     {
//       color: [1, 0, 0, 1],
//       ratio: 0.5,
//     },
//   ])
// );
// cubeText.register("initCube", randomRotate);
// cubeText.register(
//   "initCube",
//   generateGradientColor([1, 0, 0, 1], [1, 0, 1, 1])
// );
cubeText.register("render", generateRotateTo(3000));
cubeText.register("renderCamera", generateFullscreen());
// cubeText.register("renderCamera", generateRotateZAxis(3000, true));
// cubeText.register("renderCamera", generateRotateCameraUp(3000, 1, true));
cubeText.register("renderCamera", generateZoom(3000, 1));
let drawText = "!";
// cubeText.drawText(drawText, { size: 49 });

let i = 1;
const arr = "Hello CubeText!".split("");
const interval = () => {
  if (i < 48) {
    if (i <= arr.length) {
      drawText += arr[i - 1];
    }
    i += 1;
    cubeText.drawText(drawText, {
      size: 49 - i,
    });
    cubeText.run();
  } else if (i === 48) {
    cubeText.clearText();
    clearInterval(t);
  }
};
const t = setInterval(interval, 30);

// cubeText.run();
