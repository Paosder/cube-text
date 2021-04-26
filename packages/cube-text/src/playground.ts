import { CubeText } from "./cube-text";

const wrapper = document.createElement("div");
wrapper.style.position = "relative";
wrapper.style.height = "200px";
wrapper.style.border = "1px solid gray";
document.body.appendChild(wrapper);

const cubeText = new CubeText(wrapper);
cubeText.onRenderCamera = (config, delta, time) => {
  const zPos = Math.max(
    config.textSizeReadOnly.height / Math.tan(Math.PI / 8),
    config.textSizeReadOnly.width /
      Math.tan(Math.PI / 8) /
      (config.screenSizeReadOnly.width / config.screenSizeReadOnly.height)
  );

  config.camera.eye[2] = zPos;
  // cameraOptions.eye[2] = zPos * Math.cos((Math.PI * time * 0.1) / 180);
  // cameraOptions.eye[0] = zPos * Math.sin((Math.PI * time * 0.1) / 180);
  return true;
};
let i = 1;
const arr = "Hello CubeText!".split("");
let drawText = "";

const interval = () => {
  if (i < 48) {
    if (i <= arr.length) {
      drawText += arr[i - 1];
    }
    i += 1;
    cubeText.drawText(drawText, 49 - i, {
      align: "center",
    });
  } else if (i === 48) {
    cubeText.clearText();
    clearInterval(t);
  }
};
const t = setInterval(interval, 30);

cubeText.run();
