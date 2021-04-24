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

  protected pendingCubes: VectorMap<number, Array<CubeInfo>>;

  protected isRunning: boolean;

  protected isLoaded: boolean;

  textCenterPos: Coordinate;

  #textWidth: number;

  #textHeight: number;

  protected prevTime: number;

  protected renderOrder: RenderOrder;

  cameraOptions: CameraOptions;

  onRenderCamera?: (
    delta: number,
    cameraOptions: CameraOptions,
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
    this.makeCubeInfo = this.makeCubeInfo.bind(this);
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
    this.isLoaded = false;
    this.prevTime = 0;
    this.textCenterPos = [0, 0, 0];
    this.#textWidth = 0;
    this.#textHeight = 0;
    this.threshold = DEFAULT_THRESHOLD;
    this.renderOrder = RenderOrder.static;
    this.pendingCubes = new VectorMap();
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
        this.makeCubeInfo(data, opt);
        this.isLoaded = true;
      });
    } else {
      const data = drawToCanvas(text, fontSize, opt.drawType);
      this.makeCubeInfo(data, opt);
      this.isLoaded = true;
    }
  }

  clearText() {
    // due to Safari's unknown behavior, we have to clear Safari via special ways.
    if (isSafari) {
      this.drawText("_", 1, {
        ...defaultTextOptions,
        size: 0,
      });
    } else {
      this.world.clear();
    }
  }

  protected makeCubeInfo(data: ImageData, textOptions: TextOptions) {
    // group cubes with y-level.
    const centerPosX = data.width * 0.5 * textOptions.margin;
    const centerPosY = data.height * 0.5 * textOptions.margin;

    for (let i = data.height - 1; i >= 0; i -= 1) {
      for (let j = data.width - 1; j >= 0; j -= 1) {
        const alpha = data.data[i * data.width * 4 + j * 4 + 3];
        if (alpha > this.threshold) {
          // exceeds threshold.
          // default: align-left.
          let x = j * textOptions.margin;
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
            position: [x, y, 0],
            size: [textOptions.size],
            rotation: mat4.fromQuat(
              mat4.create(),
              textOptions.rotate
                ? quat.random(quat.identity(quat.create()))
                : quat.identity(quat.create())
            ),
          };
          const xLine = this.pendingCubes.get(-i + data.height);
          if (xLine) {
            xLine.push(cubeData);
          } else {
            this.pendingCubes.set(-i + data.height, [cubeData]);
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
    this.#textHeight = data.height;
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

  protected renderText(type: RenderOrder, delta: number) {
    if (type === RenderOrder.static) {
      this.pendingCubes.forEach(({ value: cubes }) => {
        cubes.forEach((cube) => {
          this.cubeRenderer.add(cube.id, cube);
        });
      });
      this.pendingCubes.clear();
      this.isLoaded = false;
    }
  }

  render(time: number) {
    if (!this.isRunning) {
      return;
    }
    if (this.isLoaded && this.pendingCubes.size > 0) {
      this.renderText(this.renderOrder, time - this.prevTime);
    }

    if (
      this.onRenderCamera &&
      this.onRenderCamera(time - this.prevTime, this.cameraOptions, time)
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
