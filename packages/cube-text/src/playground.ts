import { CubeText, defaultTextOptions } from "./cube-text";

const wrapper = document.createElement("div");
wrapper.style.position = "relative";
wrapper.style.height = "200px";
wrapper.style.border = "1px solid gray";
document.body.appendChild(wrapper);

const cubeText = new CubeText(wrapper);
cubeText.onRenderCamera = (delta, cameraOptions, time) => {
  cameraOptions.eye[2] = cubeText.textWidth * 0.5;
  [cameraOptions.eye[0], cameraOptions.eye[1]] = cubeText.textCenterPos;
  [cameraOptions.lookAt[0], cameraOptions.lookAt[1]] = cubeText.textCenterPos;

  return true;
};
let i = 1;
const arr = "안녕하세요.".split("");
let drawText = "";

setInterval(() => {
  if (i < 48) {
    if (i <= arr.length) {
      drawText += arr[i - 1];
    }
    i += 1;
    cubeText.drawText(drawText, 49 - i, {
      rotate: true,
    });
  } else if (i === 48) {
    cubeText.clearText();
  }
}, 30);

cubeText.run();
