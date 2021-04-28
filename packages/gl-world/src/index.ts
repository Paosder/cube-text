import { ResizeObserver } from "@juggle/resize-observer";
import { VectorMap } from "@paosder/vector-map";
import { mat4, glMatrix, vec3 } from "gl-matrix";
import type { Renderer, ScreenConfig, WorldInfo } from "./type";

glMatrix.setMatrixArrayType(Array);
export * from "./common";
export * from "./type";

export class World {
  canvas: HTMLCanvasElement;

  protected renderers: VectorMap<string, Renderer>;

  protected bAutoResize: boolean;

  protected attached: boolean;

  protected gl: WebGLRenderingContext;

  protected lastRendered: string;

  screenConfig: ScreenConfig;

  protected world: WorldInfo;

  protected targetTexture: WebGLTexture;

  protected depthBuffer: WebGLRenderbuffer;

  protected frameBuffer: WebGLFramebuffer;

  protected idCount: number;

  protected resizeObserver?: ResizeObserver;

  protected isResizing: boolean;

  mouseX: number;

  mouseY: number;

  disabled?: boolean;

  onResize?: (width: number, height: number) => void;

  constructor(
    className: string,
    initializer?: (gl: WebGLRenderingContext) => void
  ) {
    // create canvas and get gl context.
    this.bAutoResize = false;
    this.isResizing = false;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", {
      // preserveDrawingBuffer: true,
      antialias: true,
    })!;

    if (!gl) {
      throw new Error("Cannot create webgl context!");
    }
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.backgroundColor = "transparent";
    canvas.style.touchAction = "none";
    canvas.classList.add(className);

    this.canvas = canvas;
    this.gl = gl;
    this.attached = false;
    this.idCount = 0;
    this.mouseX = -1;
    this.mouseY = -1;

    this.resize = this.resize.bind(this);
    this.getNextId = this.getNextId.bind(this);

    if (initializer) {
      initializer(gl);
    } else {
      // enable gl extension & depth test.
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFuncSeparate(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );
    }
    this.renderers = new VectorMap();
    this.lastRendered = "";

    this.screenConfig = {
      camera: {
        eye: vec3.fromValues(0, 0, 1),
        lookAt: vec3.fromValues(0, 0, 0),
        up: vec3.fromValues(0, 1, 0),
      },
      projection: {
        type: "perspective",
        fov: Math.PI / 4,
        near: 0.01,
        far: Infinity,
      },
    };

    this.world = {
      camera: {
        mat: mat4.identity(mat4.create()),
        isDirty: true,
      },
      projection: {
        mat: mat4.identity(mat4.create()),
        isDirty: true,
      },
      transformation: {
        mat: mat4.identity(mat4.create()),
        isDirty: true,
      },
    };
    this.refreshProjection();
    this.refreshCamera();

    // init
    const targetTexture = gl.createTexture();
    if (!targetTexture) {
      throw new Error("cannot create new texture!");
    }
    this.targetTexture = targetTexture;
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // create depth renderBuffer
    const depthBuffer = gl.createRenderbuffer();
    if (!depthBuffer) {
      throw new Error("cannot create new render buffer!");
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    this.depthBuffer = depthBuffer;

    // create and bind the frame buffer.
    const frameBuffer = gl.createFramebuffer();
    if (!frameBuffer) {
      throw new Error("cannot create new frame buffer!");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    this.frameBuffer = frameBuffer;

    // attach texture as the first color attachment.
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    const level = 0;
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      attachmentPoint,
      gl.TEXTURE_2D,
      targetTexture,
      level
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      depthBuffer
    );
  }

  setFrameBufferAttachSizes() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.targetTexture);
    const level = 0;
    const internalFormat = this.gl.RGBA;
    const border = 0;
    const format = this.gl.RGBA;
    const type = this.gl.UNSIGNED_BYTE;
    const data = null;
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      level,
      internalFormat,
      this.gl.canvas.width,
      this.gl.canvas.height,
      border,
      format,
      type,
      data
    );
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER,
      this.gl.DEPTH_COMPONENT16,
      this.gl.canvas.width,
      this.gl.canvas.height
    );
  }

  attach(which: HTMLElement) {
    which.appendChild(this.canvas);
    this.attached = true;
  }

  getNextId() {
    this.idCount += 1;
    return this.idCount;
  }

  addRenderer(renderer: Renderer) {
    renderer.init(this.gl, this.world, this.getNextId);
    this.renderers.set(renderer.id, renderer);
  }

  removeRenderer(id?: string) {
    if (id) {
      this.renderers.delete(id);
    } else {
      this.renderers.clear();
    }
  }

  detach() {
    if (this.attached) {
      this.autoResize = false;
      this.canvas.parentElement?.removeChild(this.canvas);
      this.attached = false;
    }
  }

  clear() {
    this.idCount = 0;
    this.renderers.forEach(({ value: renderer }) => {
      renderer.clear();
    });
  }

  get autoResize() {
    return this.bAutoResize;
  }

  set autoResize(active: boolean) {
    if (!this.attached) {
      // We cannot call before attached.
      throw new Error(`World didn't attached yet.
      'autoResize' should assign after its attached.`);
    }

    if (active && !this.resizeObserver) {
      // active resize observer.
      this.resizeObserver = new ResizeObserver(this.resize);
      this.resizeObserver.observe(this.canvas.parentElement!);
    } else if (!active && this.resizeObserver) {
      // deactive resize observer.
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    this.bAutoResize = active;
  }

  private resize(entries: any[]) {
    // https://github.com/WICG/resize-observer/issues/38
    if (this.isResizing) {
      return;
    }
    this.isResizing = true;
    const sizeMap: Map<any, [w: number, h: number, dpr: number]> = new Map();
    entries.forEach((entry) => {
      let width;
      let height;
      const dpr = window.devicePixelRatio;

      if (entry.devicePixelContentBoxSize) {
        // NOTE: Only this path gives the correct answer
        // The other paths are imperfect fallbacks
        // for browsers that don't provide anyway to do this
        width = entry.devicePixelContentBoxSize[0].inlineSize;
        height = entry.devicePixelContentBoxSize[0].blockSize;
      } else if (entry.contentBoxSize) {
        if (entry.contentBoxSize[0]) {
          width = entry.contentBoxSize[0].inlineSize;
          height = entry.contentBoxSize[0].blockSize;
        } else {
          width = entry.contentBoxSize.inlineSize;
          height = entry.contentBoxSize.blockSize;
        }
      } else {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
      }
      const displayWidth = Math.round(width);
      const displayHeight = Math.round(height);
      sizeMap.set(entry.target, [displayWidth, displayHeight, dpr]);
    });
    const [width, height, dpr] = sizeMap.get(this.canvas.parentElement!)!;

    this.gl.canvas.width = width / dpr;
    this.gl.canvas.height = height / dpr;
    if (this.onResize) {
      this.onResize(this.gl.canvas.width, this.gl.canvas.height);
    }
    this.setFrameBufferAttachSizes();
    this.refreshProjection();
    this.isResizing = false;
  }

  refreshCamera() {
    mat4.lookAt(
      this.world.camera.mat,
      this.screenConfig.camera.eye,
      this.screenConfig.camera.lookAt,
      this.screenConfig.camera.up
    );
    this.world.camera.isDirty = true;
  }

  refreshProjection() {
    if (this.screenConfig.projection.type === "perspective") {
      mat4.perspective(
        this.world.projection.mat,
        this.screenConfig.projection.fov,
        this.canvas.clientWidth / this.canvas.clientHeight,
        this.screenConfig.projection.near,
        this.screenConfig.projection.far
      );
    } else {
      // TODO: implement.
    }
    this.world.projection.isDirty = true;
  }

  refreshTransform() {
    mat4.multiply(
      this.world.transformation.mat,
      this.world.projection.mat,
      this.world.camera.mat
    );
    this.world.transformation.isDirty = true;
  }

  render() {
    if (
      this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) ===
      this.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT
    ) {
      return;
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);

    this.gl.disable(this.gl.BLEND);

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    if (this.world.camera.isDirty || this.world.projection.isDirty) {
      this.refreshTransform();
    }

    // render to frame buffer (picking)
    this.renderers.forEach((renderer) => {
      this.lastRendered = renderer.value.render(this.lastRendered, true);
    });

    const pixelX =
      (this.mouseX * this.gl.canvas.width) /
      (this.gl.canvas as HTMLCanvasElement).clientWidth;
    const pixelY =
      this.gl.canvas.height -
      (this.mouseY * this.gl.canvas.height) /
        (this.gl.canvas as HTMLCanvasElement).clientHeight -
      1;
    const data = new Uint8Array(4);
    this.gl.readPixels(
      pixelX,
      pixelY,
      1,
      1,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data
    );
    const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
    if (id > 0) {
      this.renderers.forEach((renderer) => {
        const target = renderer.value.getId(id);
        if (target) {
          // found.
          renderer.value.picked(target);
        }
      });
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    // remove frame buffer and draw real parts.
    this.gl.enable(this.gl.BLEND);

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    this.renderers.forEach((renderer) => {
      this.lastRendered = renderer.value.render(this.lastRendered);
    });

    this.world.camera.isDirty = false;
    this.world.projection.isDirty = false;
    this.world.transformation.isDirty = false;
  }
}
