import { VariableIndex } from "@paosder/gl-variable";
import { Coordinate, World } from "@paosder/gl-world";
import { VectorMap } from "@paosder/vector-map";
import { mat4, quat, vec3 } from "gl-matrix";
import { determineColor, drawToCanvas } from "./common";
import CubeRenderer from "./cube";
import { RenderOrder, TextOptions } from "./type";

const DEFAULT_THRESHOLD = 10;

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
export const defaultTextOptions: TextOptions = {
  size: 1,
  margin: 2,
  colors: [
    [1, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  colorType: {
    type: "random",
    ratio: [0.5, 0.5],
  },
  overrideAlpha: false,
  renderOrder: RenderOrder.static,
  align: "center",
  rotate: true,
  drawType: "fill",
};

type CubeInfo = Parameters<CubeRenderer["add"]>[1] & {
  id: string;
  originPos: Coordinate;
};

interface CameraOptions {
  eye: vec3;
  lookAt: vec3;
  up: vec3;
}

export class CubeText {
  protected target: HTMLElement;

  world: World;

  cubeRenderer: CubeRenderer;

  protected originCubes: VectorMap<number, Array<CubeInfo>>;

  protected isRunning: boolean;

  textCenterPos: Coordinate;

  #textWidth: number;

  #textHeight: number;

  protected prevTime: number;

  protected renderOrder: RenderOrder;

  cameraOptions: CameraOptions;

  onCubeInit?: (cubeInfo: CubeInfo) => void;

  onRender?: (
    origin: VectorMap<number, CubeInfo[]>,
    cubes: VectorMap<string, VariableIndex>
  ) => boolean;

  onRenderCamera?: (
    cameraOptions: CameraOptions,
    delta: number,
    time: number
  ) => boolean;

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
    this.render = this.render.bind(this);
    this.initCube = this.initCube.bind(this);
    this.pointerMoveEv = this.pointerMoveEv.bind(this);

    this.world = new World("cube-text");
    this.world.attach(this.target);
    this.world.autoResize = true;
    this.cubeRenderer = new CubeRenderer();
    this.world.addRenderer(this.cubeRenderer);
    this.world.canvas.addEventListener("pointermove", this.pointerMoveEv);
    this.cameraOptions = {
      eye: this.world.eye,
      lookAt: this.world.lookAt,
      up: this.world.up,
    };

    this.isRunning = false;
    this.prevTime = 0;
    this.textCenterPos = [0, 0, 0];
    this.#textWidth = 0;
    this.#textHeight = 0;
    this.threshold = DEFAULT_THRESHOLD;
    this.renderOrder = RenderOrder.static;
    this.originCubes = new VectorMap();
  }

  pointerMoveEv(e: PointerEvent) {
    this.world.mouseX = e.offsetX;
    this.world.mouseY = e.offsetY;
  }

  destroy() {
    this.isRunning = false;
    this.world.canvas.removeEventListener("pointermove", this.pointerMoveEv);
    this.world.clear();
    this.world.removeRenderer();
    this.world.detach();
    this.world.disabled = true;
  }

  drawText(
    text: string,
    fontSize: number,
    textOptions: Partial<TextOptions> = defaultTextOptions,
    fontFamilyOptions?: { name: string; uri: string }
  ) {
    const opt: TextOptions = {
      ...defaultTextOptions,
      ...textOptions,
    };
    if (text === "") {
      throw new Error("text cannot be zero-length.");
    }
    if (fontSize === 0) {
      throw new Error("fontSize cannot be zero.");
    }
    this.cubeRenderer.clear();
    this.renderOrder = opt.renderOrder;
    if (fontFamilyOptions) {
      const f = new FontFace(fontFamilyOptions.name, fontFamilyOptions.uri);
      f.load().then(() => {
        // Ready to use the font in a canvas context
        const data = drawToCanvas(
          text,
          fontSize,
          opt.drawType,
          fontFamilyOptions.name
        );
        this.initCube(data, opt);
      });
    } else {
      const data = drawToCanvas(text, fontSize, opt.drawType);
      this.initCube(data, opt);
    }
  }

  clearText() {
    // due to Safari's unknown behavior, we have to clear Safari via special ways.
    if (isSafari) {
      this.drawText(".", 8, {
        ...defaultTextOptions,
        size: 0,
      });
    } else {
      this.world.clear();
    }
  }

  protected initCube(data: ImageData, textOptions: TextOptions) {
    // group cubes with y-level.
    const centerPosX = data.width * 0.5 * textOptions.margin;
    let centerPosY = data.height * 0.5 * textOptions.margin;
    let minY = -1;

    for (let i = data.height - 1; i >= 0; i -= 1) {
      for (let j = data.width - 1; j >= 0; j -= 1) {
        const alpha = data.data[i * data.width * 4 + j * 4 + 3];
        if (alpha > this.threshold) {
          // exceeds threshold.
          // default: align-left.
          let x = j * textOptions.margin;
          if (minY === -1) {
            // minimum coordinate of Y is not always starts with 0.
            // Therefore we should add its start coord.
            minY = -i + data.height;
            centerPosY += minY;
          }
          const y = (-i + data.height) * textOptions.margin - centerPosY;
          if (textOptions.align === "center") {
            x -= centerPosX;
          } else if (textOptions.align === "right") {
            x -= centerPosX * 2;
          }
          const cubeData: CubeInfo = {
            id: `${this.world.getNextId()}`,
            color: determineColor(
              textOptions.colors,
              textOptions.colorType.type === "gradient"
                ? {
                    ...textOptions.colorType,
                    tx: 0,
                    ty: 0,
                  }
                : textOptions.colorType,
              !textOptions.overrideAlpha ? alpha / 256 : undefined
            ),
            position: [x, y, 0], // current position.
            originPos: [x, y, 0], // origin position.
            size: [textOptions.size],
            rotation: mat4.fromQuat(
              mat4.create(),
              textOptions.rotate
                ? quat.random(quat.identity(quat.create()))
                : quat.identity(quat.create())
            ),
          };
          if (this.onCubeInit) {
            this.onCubeInit(cubeData);
          }
          this.cubeRenderer.add(cubeData.id, cubeData);
          const xLine = this.originCubes.get(-i + data.height);
          if (xLine) {
            xLine.push(cubeData);
          } else {
            this.originCubes.set(-i + data.height, [cubeData]);
          }
        }
      }
    }
    if (textOptions.align === "center") {
      this.textCenterPos[0] = 0;
      this.textCenterPos[1] = 0;
    } else if (textOptions.align === "right") {
      this.textCenterPos[0] = -centerPosX;
      this.textCenterPos[1] = centerPosY;
    } else {
      this.textCenterPos[0] = centerPosX;
      this.textCenterPos[1] = centerPosY;
    }
    this.#textWidth = data.width;
    this.#textHeight = data.height - minY;
  }

  get textWidth() {
    return this.#textWidth;
  }

  get textHeight() {
    return this.#textHeight;
  }

  run() {
    this.isRunning = true;
    requestAnimationFrame(this.render);
  }

  render(time: number) {
    if (!this.isRunning) {
      return;
    }

    if (
      this.onRender &&
      this.onRender(this.originCubes, this.cubeRenderer.cubes)
    ) {
      this.cubeRenderer.updateBuffer(true);
    }

    if (
      this.onRenderCamera &&
      this.onRenderCamera(this.cameraOptions, time - this.prevTime, time)
    ) {
      this.world.refreshCamera();
    }

    this.world.render();
    this.prevTime = time;
    requestAnimationFrame(this.render);
  }

  stop() {
    this.isRunning = false;
  }
}
