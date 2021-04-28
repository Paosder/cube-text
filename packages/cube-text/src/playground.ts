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

const style = document.createElement("style");
document.body.style.margin = "0";
style.innerHTML = `
.wrapper {
  height: 300px;
}
`;
document.head.appendChild(style);

const wrapper = document.createElement("div");
wrapper.style.position = "relative";
wrapper.style.border = "1px solid gray";
wrapper.style.boxSizing = "border-box";
wrapper.classList.add("wrapper");
document.body.appendChild(wrapper);
const wrapper2 = document.createElement("div");
wrapper2.style.height = "100%";
wrapper.appendChild(wrapper2);

const cubeText = new CubeText(wrapper2);
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
cubeText.register("initCube", randomRotate);
cubeText.register(
  "initCube",
  generateGradientColor([1, 0, 0, 1], [1, 0, 1, 1])
);
// cubeText.register("render", generateRotateTo(3000));
cubeText.register("renderCamera", generateFullscreen());
// cubeText.register("renderCamera", generateRotateZAxis(3000, true));
// cubeText.register("renderCamera", generateRotateCameraUp(3000, 1, true));
cubeText.register("renderCamera", generateZoom(3000, 1));
const drawText = "Hello CubeText!";
cubeText.drawText(drawText, { size: 10 });

// let i = 1;
// const arr = "Hello CubeText!".split("");
// const interval = () => {
//   if (i < 48) {
//     if (i <= arr.length) {
//       drawText += arr[i - 1];
//     }
//     i += 1;
//     cubeText.drawText(drawText, {
//       size: 49 - i,
//     });
//     // cubeText.run();
//   } else if (i === 48) {
//     cubeText.clearText();
//     clearInterval(t);
//   }
// };
// const t = setInterval(interval, 30);

cubeText.run();
