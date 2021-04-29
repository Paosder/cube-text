import {
  CubeText,
  generateFullscreen,
  generateGradientColor,
  generateRandomColor,
  generateRandomPosition,
  generateRotateCameraUp,
  generateRotateY,
  generateZoom,
  randomRotate,
} from "./cube-text";
import {
  generateNoisy,
  generateRewindToOrigin,
  generateRotateCube,
  generateRotateTo,
} from "./cube-text/plugins/render";

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
//   "init-cube",
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
cubeText.register("init-cube", randomRotate);
cubeText.register("init-cube", generateRandomPosition([-1, -1, -1], [1, 1, 1]));
cubeText.register(
  "init-cube",
  generateGradientColor([1, 0, 0, 1], [1, 0, 1, 1])
);
// cubeText.register("render", generateRotateTo(3000));
cubeText.register("render", generateRotateCube(1, 1000, true, true));
cubeText.register("render", generateRewindToOrigin(3000));
cubeText.register("render-camera", generateFullscreen());
cubeText.register("render-camera", generateRotateY(3000));
// cubeText.register("render-camera", generateRotateCameraUp(3000, 1, true));
cubeText.register("render-camera", generateZoom(3000, 1));
const drawText = "Hello CubeText!";
cubeText.drawText(drawText, { size: 24 });

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
