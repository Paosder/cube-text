import {
  CubeText,
  generateFullscreen,
  generateGradientColor,
  generateRandomColor,
  generateRandomPosition,
  generateRotateY,
  generateZoom,
  randomRotate,
} from "./cube-text";
import { generateRewindToOrigin } from "./cube-text/plugins/render";

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
cubeText.register("init-cube", generateGradientColor());
cubeText.register("render", generateRewindToOrigin({ duration: 5000 }));
cubeText.register("render-camera", generateFullscreen());
cubeText.register(
  "render-camera",
  generateRotateY({
    duration: 5000,
    loop: false,
  })
);
cubeText.register(
  "render-camera",
  generateZoom({
    init: 0.1,
    targetRatio: 1,
    duration: 5000,
  })
);
const drawText = "Hello CubeText!";
cubeText.drawText(drawText, { size: 16 }, { size: 2, margin: 1 });

cubeText.run();
