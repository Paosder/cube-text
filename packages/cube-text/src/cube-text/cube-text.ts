import { Coordinate, World } from "@paosder/gl-world";
import { VectorMap } from "@paosder/vector-map";
import { mat4, quat } from "gl-matrix";
import { drawToCanvas } from "./common";
import CubeRenderer from "./cube";
import {
  CubeInfo,
  CubeOptions,
  CubeTextScreenConfig,
  LifeCyclePlugin,
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
  margin: 1,
  align: "center",
  drawType: "fill",
};

export class CubeText {
  protected target: HTMLElement;

  world: World;

  cubeRenderer: CubeRenderer;

  protected originCubes: VectorMap<number, Array<CubeInfo>>;

  protected isRunning?: number;

  textCenterPos: Coordinate;

  protected prevTime: number;

  screenConfig: CubeTextScreenConfig;

  protected lifeCyclePlugin: Record<
    keyof LifeCyclePlugin,
    Set<LifeCyclePlugin[keyof LifeCyclePlugin]>
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
      computedSizeReadOnly: {
        width: 0,
        height: 0,
      },
      screenSizeReadOnly: {
        width: this.world.canvas.clientWidth,
        height: this.world.canvas.clientHeight,
      },
    };
    this.lifeCyclePlugin = {
      render: new Set(),
      "render-camera": new Set(),
      "init-cube": new Set(),
    };
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
   * register life cycle plugin function.
   */
  register<K extends keyof LifeCyclePlugin>(
    type: K,
    plugin: LifeCyclePlugin[K]
  ) {
    this.lifeCyclePlugin[type].add(plugin);
  }

  /**
   * unregister life cycle plugin function.
   */
  unregister<K extends keyof LifeCyclePlugin>(
    type: K,
    plugin?: LifeCyclePlugin[K]
  ) {
    if (!plugin) {
      // if plugin is undefined, remove all plugins in type.
      this.lifeCyclePlugin[type].clear();
    } else {
      this.lifeCyclePlugin[type].delete(plugin);
    }
  }

  private executePlugin<K extends keyof LifeCyclePlugin>(
    type: K,
    ...args: Parameters<LifeCyclePlugin[K]>
  ): boolean {
    let result = false;
    this.lifeCyclePlugin[type].forEach((callback) => {
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
    this.stop();
    this.world.canvas.removeEventListener("pointermove", this.pointerMoveEv);
    this.world.clear();
    this.world.removeRenderer();
    this.world.detach();
    this.world.onResize = undefined;
    (Object.keys(this.lifeCyclePlugin) as Array<keyof LifeCyclePlugin>).forEach(
      (key) => {
        this.lifeCyclePlugin[key].clear();
      }
    );
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
      this.world.clear();
      this.drawText(".", defaultTextOptions, {
        size: 0,
      });
    } else {
      this.world.clear();
      this.drawText(".", defaultTextOptions, {
        size: 0,
      });
    }
  }

  protected initCube(data: ImageData, cubeOptions: CubeOptions) {
    // group cubes with y-level.
    const totalWidth =
      data.width * (cubeOptions.size + cubeOptions.margin) - cubeOptions.margin;
    let totalHeight =
      data.height * (cubeOptions.size + cubeOptions.margin) -
      cubeOptions.margin;

    const centerPosX = totalWidth * 0.5;
    const centerPosY = 0;
    let minY = -1;

    for (let i = data.height - 1; i >= 0; i -= 1) {
      for (let j = data.width - 1; j >= 0; j -= 1) {
        const alpha = data.data[i * data.width * 4 + j * 4 + 3];
        if (alpha > this.threshold) {
          // exceeds threshold.
          // default: align-left.
          let x =
            j * (cubeOptions.margin + cubeOptions.size) +
            cubeOptions.size * 0.5;
          if (minY === -1) {
            // minimum coordinate of Y is not always starts with 0.
            // Therefore we should add its start coord.
            minY = -i + data.height;
            totalHeight -=
              minY * (cubeOptions.size + cubeOptions.margin) -
              cubeOptions.margin;
          }
          const y =
            -i * (cubeOptions.margin + cubeOptions.size) +
            cubeOptions.size * 0.5 +
            totalHeight * 0.5;
          if (cubeOptions.align === "center") {
            x -= centerPosX;
          } else if (cubeOptions.align === "right") {
            x -= centerPosX * 2;
          }
          const rotationQuat = quat.identity(quat.create());
          const cubeData: CubeInfo = {
            // for each attributes
            id: this.world.getNextId(),
            color: [0, 0, 0, alpha / 256],
            position: [x, y, 0], // current position.
            size: [cubeOptions.size],
            rotation: mat4.fromQuat(mat4.create(), rotationQuat),
            // end ----
            // for save origin data.
            origin: {
              color: [0, 0, 0, alpha / 256],
              position: [x, y, 0],
              size: [cubeOptions.size],
              rotation: rotationQuat,
            },
          };
          this.executePlugin("init-cube", cubeData, {
            x,
            y,
            width: data.width,
            height: data.height - minY,
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
    this.screenConfig.computedSizeReadOnly.width = totalWidth;
    this.screenConfig.computedSizeReadOnly.height = totalHeight;
  }

  get textWidth() {
    return this.screenConfig.textSizeReadOnly.width;
  }

  get textHeight() {
    return this.screenConfig.textSizeReadOnly.height;
  }

  run() {
    if (this.isRunning !== undefined) return;
    const loop = (time: number) => {
      this.render(time);
      requestAnimationFrame(loop);
    };
    this.isRunning = requestAnimationFrame(loop);
  }

  render(time: number) {
    if (this.world.disabled) {
      return;
    }
    const delta = time - this.prevTime;

    if (this.textWidth === 0 || this.textHeight === 0) {
      /**
       * Text data is not ready, but render is called.
       * Executing render callbacks may cause the wrong camera position via zeroed length,
       * so we have to prevent running it.
       */
      return;
    }
    if (
      this.executePlugin(
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

    if (this.executePlugin("render-camera", this.screenConfig, delta, time)) {
      this.world.refreshCamera();
    }

    this.world.render();
    this.prevTime = time;
  }

  /**
   * rewind plugins.
   */
  rewind() {
    this.executePlugin(
      "render",
      this.originCubes,
      this.cubeRenderer.cubes,
      this.screenConfig,
      0,
      this.prevTime,
      true
    );
    this.executePlugin(
      "render-camera",
      this.screenConfig,
      0,
      this.prevTime,
      true
    );
  }

  stop() {
    if (this.isRunning !== undefined) {
      cancelAnimationFrame(this.isRunning);
      this.isRunning = undefined;
    }
  }
}
