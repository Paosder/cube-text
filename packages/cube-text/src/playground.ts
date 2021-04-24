import { CubeText } from "./cube-text";

const wrapper = document.createElement("div");
wrapper.style.position = "relative";
wrapper.style.height = "200px";
document.body.appendChild(wrapper);

const cubeText = new CubeText(wrapper);
cubeText.onRenderCamera = (delta, cameraOptions) => {
  cameraOptions.eye[2] = 110;
  [cameraOptions.eye[0], cameraOptions.eye[1]] = cubeText.centerPos;
  [cameraOptions.lookAt[0], cameraOptions.lookAt[1]] = cubeText.centerPos;
  return true;
};
cubeText.loadText("Hello Cube World!", 24);
cubeText.run();
