import { CubeText } from "./cube-text";

const wrapper = document.createElement("div");
wrapper.style.position = "relative";
wrapper.style.height = "200px";
wrapper.style.border = "1px solid gray";
document.body.appendChild(wrapper);

const cubeText = new CubeText(wrapper);
cubeText.onRenderCamera = (delta, cameraOptions, time) => {
  cameraOptions.eye[2] = cubeText.textWidth * 0.25;
  // [cameraOptions.eye[0], cameraOptions.eye[1]] = cubeText.textCenterPos;
  [cameraOptions.lookAt[0], cameraOptions.lookAt[1]] = cubeText.textCenterPos;
  cameraOptions.up[0] = Math.sin((time * 0.05 * Math.PI) / 180);
  cameraOptions.up[1] = Math.cos((time * 0.05 * Math.PI) / 180);
  return true;
};
let i = 1;
const arr = "Hello CubeText!".split("");
let drawText = "";
cubeText.drawText("Hello CubeText!", 48, {
  align: "center",
  drawType: "fill",
});
// setInterval(() => {
//   if (i < 48) {
//     if (i <= arr.length) {
//       drawText += arr[i - 1];
//     }
//     i += 1;
//     cubeText.drawText(drawText, 49 - i, {
//       align: "right",
//     });
//   } else if (i === 48) {
//     cubeText.clearText();
//   }
// }, 30);

cubeText.run();
