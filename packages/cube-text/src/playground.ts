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
  generateRotateCubeTo,
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
cubeText.register("init-cube", generateRandomColor());
cubeText.register("init-cube", randomRotate);
cubeText.register(
  "init-cube",
  generateRandomPosition({ basis: true, min: [-1000, -1000, -1000] })
);
// cubeText.register("init-cube", generateGradientColor());
// cubeText.register(
//   "render",
//   generateRotateCubeTo({
//     duration: 3000,
//   })
// );
// cubeText.register("render", generateRotateCube(4, 3000, true, true));
cubeText.register("render", generateRewindToOrigin({ duration: 5000 }));
cubeText.register("render-camera", generateFullscreen());
// cubeText.register(
//   "render-camera",
//   generateRotateY({
//     duration: 3000,
//   })
// );
// cubeText.register(
//   "render-camera",
//   generateRotateCameraUp({
//     cycle: 2,
//   })
// );
// cubeText.register(
//   "render-camera",
//   generateZoom({
//     init: 0.1,
//     targetRatio: 1,
//     duration: 3000,
//   })
// );
// cubeText.register(
//   "render",
//   generateRotateCube({ radius: 0.5, individual: false })
// );
const drawText = "Hello CubeText!";
cubeText.drawText(drawText, { size: 12 }, { size: 1, margin: 1 });

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
// const t = setInterval(interval, 300);

cubeText.run();
