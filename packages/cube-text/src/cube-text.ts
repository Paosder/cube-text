import { Coordinate, World } from "@paosder/gl-world";
import { VectorMap } from "@paosder/vector-map";
import { mat4, quat } from "gl-matrix";
import CubeRenderer from "./cube";

// eslint-disable-next-line no-shadow
export enum DrawOrder {
  static,
  incremental,
  line,
}

const DEFAULT_THRESHOLD = 10;

function drawToCanvas(text: string, fontSize: number, fontFamily = "Arial") {
  const canvas = document.createElement("canvas");
  canvas.height = fontSize;
  const textCtx = canvas.getContext("2d")!;
  textCtx.font = `${fontSize}px ${fontFamily}`;
  textCtx.textBaseline = "middle";
  textCtx.fillStyle = "black";
  const measured = textCtx.measureText(text);
  canvas.width =
    measured.actualBoundingBoxLeft + measured.actualBoundingBoxRight;

  // re-initialize context2d.
  // https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-set-bitmap-dimensions
  textCtx.font = `${fontSize}px ${fontFamily}`;
  textCtx.textBaseline = "middle";
  textCtx.fillStyle = "black";

  console.log(measured.actualBoundingBoxLeft + measured.actualBoundingBoxRight);
  textCtx.fillText(text, 0, fontSize * 0.5);
  return textCtx.getImageData(0, 0, canvas.width, fontSize);
}

type CubeInfo = Parameters<CubeRenderer["add"]>[1] & {
  id: string;
};

export class CubeText {
  protected target: HTMLElement;

  protected world: World;

  protected cubeRenderer: CubeRenderer;

  protected pendingCubes: VectorMap<number, Array<CubeInfo>>;

  protected isRunning: boolean;

  protected isLoaded: boolean;

  protected centerPos: Coordinate;

  protected prevTime: number;

  threshold: number;

  constructor(element: string | HTMLElement) {
    if (typeof element === "string") {
      const targetElement = document.getElementById(element);
      if (!targetElement) {
        throw new Error(`cannot find element: ${element}`);
      }
      this.target = targetElement;
    } else {
      this.target = element;
    }
    this.world = new World("cube-text");
    this.world.attach(this.target);
    this.world.autoResize = true;
    this.cubeRenderer = new CubeRenderer();
    this.world.addRenderer(this.cubeRenderer);

    this.isRunning = false;
    this.isLoaded = false;
    this.prevTime = 0;
    this.centerPos = [0, 0, 0];
    this.threshold = DEFAULT_THRESHOLD;
    this.pendingCubes = new VectorMap();
    this.render = this.render.bind(this);
    this.makeCubeInfo = this.makeCubeInfo.bind(this);
  }

  loadText(
    text: string,
    fontSize: number,
    fontFamilyOptions?: { name: string; uri: string }
  ) {
    if (text === "") return;
    if (fontFamilyOptions) {
      const f = new FontFace(fontFamilyOptions.name, fontFamilyOptions.uri);
      f.load().then(() => {
        // Ready to use the font in a canvas context
        const data = drawToCanvas(text, fontSize, fontFamilyOptions.name);
        this.makeCubeInfo(data);
        this.isLoaded = true;
      });
    } else {
      const data = drawToCanvas(text, fontSize);
      this.makeCubeInfo(data);
      this.isLoaded = true;
    }
  }

  protected drawText(type: DrawOrder, delta: number) {
    if (type === DrawOrder.static) {
      this.pendingCubes.forEach(({ value: cubes }) => {
        cubes.forEach((cube) => {
          this.cubeRenderer.add(cube.id, cube);
        });
      });
      this.pendingCubes.clear();
    }
  }

  // eslint-disable-next-line
  clearText() {
    // TODO: implement.
  }

  protected makeCubeInfo(data: ImageData) {
    // group cubes with y-level.
    for (let i = data.height - 1; i >= 0; i -= 1) {
      for (let j = data.width - 1; j >= 0; j -= 1) {
        const alpha = data.data[i * data.width * 4 + j * 4 + 3];
        if (alpha > this.threshold) {
          // exceeds threshold.
          const cubeData: CubeInfo = {
            id: `${this.world.getNextId()}`,
            color: [Math.random() > 0.5 ? 1 : 0, 0, 0, alpha / 256],
            position: [j * 2, -i * 2 + data.height * 2, 0],
            size: [1],
            rotation: mat4.fromQuat(
              mat4.create(),
              quat.random(quat.identity(quat.create()))
            ),
          };
          const xLine = this.pendingCubes.get(-i + data.height);
          if (xLine) {
            xLine.push(cubeData);
          } else {
            this.pendingCubes.set(-i + data.height, [cubeData]);
          }
          if (this.centerPos[1] < -i + data.height) {
            this.centerPos[1] = -i + data.height;
          }
        }
      }
    }
    this.centerPos[0] = data.width * 0.5;
  }

  run() {
    this.isRunning = true;
    requestAnimationFrame(this.render);
  }

  render(time: number) {
    if (!this.isRunning) {
      return;
    }
    if (this.isLoaded && this.pendingCubes.size > 0) {
      this.drawText(DrawOrder.static, time - this.prevTime);
    }

    this.world.render();
    this.prevTime = time;
    requestAnimationFrame(this.render);
  }

  stop() {
    this.isRunning = false;
  }
}
