import { Coordinate, World } from "@paosder/gl-world";
import { VectorMap } from "@paosder/vector-map";
import { mat4, quat } from "gl-matrix";
import { drawToCanvas } from "./common";
import CubeRenderer from "./cube";
import {
  CubeInfo,
  CubeOptions,
  CubeTextScreenConfig,
  LifeCycleCallbacks,
  TextOptions,
} from "./type";

const DEFAULT_THRESHOLD = 10;

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export const defaultTextOptions: TextOptions = {
  size: 16,
  style: "",
};

export const defaultCubeOptions: CubeOptions = {
  size: 1,
  margin: 2,
  align: "center",
  drawType: "fill",
};

export class CubeText {
  protected target: HTMLElement;

  world: World;

  cubeRenderer: CubeRenderer;

  protected originCubes: VectorMap<number, Array<CubeInfo>>;

  protected isRunning: boolean;

  textCenterPos: Coordinate;

  protected prevTime: number;

  screenConfig: CubeTextScreenConfig;

  protected lifeCycleCallback: Record<
    keyof LifeCycleCallbacks,
    Set<LifeCycleCallbacks[keyof LifeCycleCallbacks]>
  >;

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
    this.world.onResize = (width, height) => {
      this.screenConfig.screenSizeReadOnly.width = width;
      this.screenConfig.screenSizeReadOnly.height = height;
    };

    this.screenConfig = {
      ...this.world.screenConfig,
      textSizeReadOnly: {
        width: 0,
        height: 0,
      },
      screenSizeReadOnly: {
        width: this.world.canvas.clientWidth,
        height: this.world.canvas.clientHeight,
      },
    };
    this.lifeCycleCallback = {
      render: new Set(),
      renderCamera: new Set(),
      initCube: new Set(),
    };
    this.isRunning = false;
    this.prevTime = 0;
    this.textCenterPos = [0, 0, 0];
    this.threshold = DEFAULT_THRESHOLD;
    this.originCubes = new VectorMap();
  }

  pointerMoveEv(e: PointerEvent) {
    this.world.mouseX = e.offsetX;
    this.world.mouseY = e.offsetY;
  }

  /**
   * register life cycle callback function.
   */
  register<K extends keyof LifeCycleCallbacks>(
    type: K,
    callback: LifeCycleCallbacks[K]
  ) {
    this.lifeCycleCallback[type].add(callback);
  }

  /**
   * unregister life cycle callback function.
   */
  unregister<K extends keyof LifeCycleCallbacks>(
    type: K,
    callback?: LifeCycleCallbacks[K]
  ) {
    if (!callback) {
      // if callback is undefined, remove all callbacks in type.
      this.lifeCycleCallback[type].clear();
    } else {
      this.lifeCycleCallback[type].delete(callback);
    }
  }

  private executeCallback<K extends keyof LifeCycleCallbacks>(
    type: K,
    ...args: Parameters<LifeCycleCallbacks[K]>
  ): boolean {
    let result = false;
    this.lifeCycleCallback[type].forEach((callback) => {
      // typescript issue.
      // TODO: better way to define this behavior.
      // https://github.com/Microsoft/TypeScript/issues/4130#issuecomment-303486552
      // https://www.reddit.com/r/typescript/comments/labup9/generic_types_for_record_values/
      // eslint-disable-next-line
      // @ts-ignore
      if (callback(...args)) {
        result = true;
      }
    });
    return result;
  }

  destroy() {
    this.isRunning = false;
    this.world.canvas.removeEventListener("pointermove", this.pointerMoveEv);
    this.world.clear();
    this.world.removeRenderer();
    this.world.detach();
    this.world.onResize = undefined;
    (Object.keys(this.lifeCycleCallback) as Array<
      keyof LifeCycleCallbacks
    >).forEach((key) => {
      this.lifeCycleCallback[key].clear();
    });
    this.world.disabled = true;
  }

  drawText(
    text: string,
    textOptions: Partial<TextOptions> = defaultTextOptions,
    cubeOptions: Partial<CubeOptions> = defaultCubeOptions,
    fontFamilyOptions?: { name: string; uri: string }
  ) {
    const textOpt: TextOptions = {
      ...defaultTextOptions,
      ...textOptions,
    };
    const cubeOpt: CubeOptions = {
      ...defaultCubeOptions,
      ...cubeOptions,
    };
    if (text === "") {
      throw new Error("text cannot be zero-length.");
    }
    if (textOpt.size === 0) {
      throw new Error("fontSize cannot be zero.");
    }
    this.cubeRenderer.clear();
    if (fontFamilyOptions) {
      const f = new FontFace(fontFamilyOptions.name, fontFamilyOptions.uri);
      f.load().then(() => {
        // Ready to use the font in a canvas context
        const data = drawToCanvas(
          text,
          textOpt.size,
          textOpt.style,
          cubeOpt.drawType,
          fontFamilyOptions.name
        );
        this.initCube(data, cubeOpt);
      });
    } else {
      const data = drawToCanvas(
        text,
        textOpt.size,
        textOpt.style,
        cubeOpt.drawType
      );
      this.initCube(data, cubeOpt);
    }
  }

  clearText() {
    // due to Safari's unknown behavior, we have to clear Safari via special ways.
    if (isSafari) {
      this.drawText(".", defaultTextOptions, {
        size: 0,
      });
    } else {
      this.world.clear();
    }
  }

  protected initCube(data: ImageData, cubeOptions: CubeOptions) {
    // group cubes with y-level.
    const centerPosX = data.width * 0.5 * cubeOptions.margin;
    let centerPosY = data.height * 0.5 * cubeOptions.margin;
    let minY = -1;

    for (let i = data.height - 1; i >= 0; i -= 1) {
      for (let j = data.width - 1; j >= 0; j -= 1) {
        const alpha = data.data[i * data.width * 4 + j * 4 + 3];
        if (alpha > this.threshold) {
          // exceeds threshold.
          // default: align-left.
          let x = j * cubeOptions.margin;
          if (minY === -1) {
            // minimum coordinate of Y is not always starts with 0.
            // Therefore we should add its start coord.
            minY = -i + data.height;
            centerPosY += minY;
          }
          const y = (-i + data.height) * cubeOptions.margin - centerPosY;
          if (cubeOptions.align === "center") {
            x -= centerPosX;
          } else if (cubeOptions.align === "right") {
            x -= centerPosX * 2;
          }
          const rotationQuat = quat.identity(quat.create());
          const cubeData: CubeInfo = {
            id: this.world.getNextId(),
            color: [0, 0, 0, alpha / 256],
            position: [x, y, 0], // current position.
            size: [cubeOptions.size],
            rotationQuat,
            rotation: mat4.fromQuat(mat4.create(), rotationQuat),
          };
          this.executeCallback("initCube", cubeData, {
            x,
            y,
            width: data.width,
            height: data.height,
            margin: cubeOptions.margin,
          });
          this.cubeRenderer.add(`${cubeData.id}`, cubeData);
          const xLine = this.originCubes.get(-i + data.height);
          if (xLine) {
            xLine.push(cubeData);
          } else {
            this.originCubes.set(-i + data.height, [cubeData]);
          }
        }
      }
    }
    if (cubeOptions.align === "center") {
      this.textCenterPos[0] = 0;
      this.textCenterPos[1] = 0;
    } else if (cubeOptions.align === "right") {
      this.textCenterPos[0] = -centerPosX;
      this.textCenterPos[1] = centerPosY;
    } else {
      this.textCenterPos[0] = centerPosX;
      this.textCenterPos[1] = centerPosY;
    }
    this.screenConfig.textSizeReadOnly.width = data.width;
    this.screenConfig.textSizeReadOnly.height = data.height - minY;
  }

  get textWidth() {
    return this.screenConfig.textSizeReadOnly.width;
  }

  get textHeight() {
    return this.screenConfig.textSizeReadOnly.height;
  }

  run() {
    if (this.isRunning) return;
    this.isRunning = true;
    requestAnimationFrame(this.render);
  }

  render(time: number) {
    if (!this.isRunning) {
      return;
    }
    const delta = time - this.prevTime;

    if (
      this.executeCallback(
        "render",
        this.originCubes,
        this.cubeRenderer.cubes,
        this.screenConfig,
        delta,
        time
      )
    ) {
      this.cubeRenderer.updateBuffer(true);
    }

    if (this.executeCallback("renderCamera", this.screenConfig, delta, time)) {
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
