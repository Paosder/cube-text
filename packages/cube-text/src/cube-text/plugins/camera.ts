import type { CubeTextScreenConfig, LifeCyclePlugin } from "../type";

export const computeZDistance = (config: CubeTextScreenConfig) => {
  if (config.projection.type === "perspective") {
    const fovy = config.projection.fov * 0.5;
    const f =
      config.screenSizeReadOnly.width / config.screenSizeReadOnly.height;
    const zDistance = Math.max(
      (config.computedSizeReadOnly.height / Math.tan(fovy)) * 0.5,
      (config.computedSizeReadOnly.width / (Math.tan(fovy) * f)) * 0.5
    );
    return zDistance;
  }
  // TODO: orthogonal view.
  return 0;
};

interface FullscreenConfig {
  scale: number;
  start: number;
}

export const generateFullscreen = (
  pluginConfig?: Partial<FullscreenConfig>
): LifeCyclePlugin["render-camera"] => {
  const defaultConfig: FullscreenConfig = {
    scale: 1,
    start: 0,
  };
  const c = {
    ...defaultConfig,
    ...pluginConfig,
    elapsed: 0,
  };
  const fullScreen: LifeCyclePlugin["render-camera"] = (
    config,
    delta,
    _,
    rewind
  ) => {
    if (rewind) {
      c.elapsed = 0;
    }
    if (c.elapsed < c.start) {
      c.elapsed += delta;
      return false;
    }
    if (config.projection.type === "perspective") {
      const zDistance = computeZDistance(config);
      const norm = Math.sqrt(
        config.camera.eye[0] ** 2 + config.camera.eye[2] ** 2
      );
      config.camera.eye[0] *= (zDistance * c.scale) / norm;
      config.camera.eye[2] *= (zDistance * c.scale) / norm;
      return true;
    }
    return false;
  };
  return fullScreen;
};

interface ZoomConfig {
  duration: number;
  targetRatio: number;
  init: number;
  start: number;
}

export const generateZoom = (
  pluginConfig?: Partial<ZoomConfig>
): LifeCyclePlugin["render-camera"] => {
  const defaultConfig: ZoomConfig = {
    duration: 1000,
    targetRatio: 1,
    init: 0,
    start: 0,
  };
  const c = {
    ...defaultConfig,
    ...pluginConfig,
    elapsed: 0,
  };
  const zoom: LifeCyclePlugin["render-camera"] = (config, delta, _, rewind) => {
    if (rewind) {
      c.elapsed = 0;
    }
    if (c.elapsed > c.duration + c.start) {
      return false;
    }
    c.elapsed += delta;
    if (c.elapsed < c.start) {
      return false;
    }
    const elapsed = c.elapsed - c.start;
    if (config.projection.type === "perspective") {
      const zDistance = computeZDistance(config);
      const norm = Math.sqrt(
        config.camera.eye[0] ** 2 + config.camera.eye[2] ** 2
      );
      config.camera.eye[0] *= zDistance / norm;
      config.camera.eye[2] *= zDistance / norm;
    }
    config.camera.eye[0] =
      config.camera.eye[0] * c.init * (1 - elapsed / c.duration) +
      config.camera.eye[0] * c.targetRatio * (elapsed / c.duration);
    config.camera.eye[2] =
      config.camera.eye[2] * c.init * (1 - elapsed / c.duration) +
      config.camera.eye[2] * c.targetRatio * (elapsed / c.duration);
    return true;
  };
  return zoom;
};

interface RotateYConfig {
  duration: number;
  loop: boolean;
  start: number;
  cycle: number;
  zDistance?: number;
}

export const generateRotateY = (
  pluginConfig?: Partial<RotateYConfig>
): LifeCyclePlugin["render-camera"] => {
  const defaultConfig: RotateYConfig = {
    duration: 1000,
    loop: true,
    start: 0,
    cycle: 1,
  };
  const c = {
    ...defaultConfig,
    ...pluginConfig,
    elapsed: 0,
    lastTuned: false,
  };
  const rotateCircular: LifeCyclePlugin["render-camera"] = (
    config,
    delta,
    _,
    rewind
  ) => {
    if (rewind) {
      c.elapsed = 0;
      c.lastTuned = false;
    }
    if (!c.loop && c.elapsed >= c.duration * c.cycle + c.start) {
      if (c.lastTuned) {
        return false;
      }
      c.lastTuned = true;
      c.elapsed = c.duration * c.cycle - delta;
    }
    c.elapsed += delta;
    if (c.elapsed < c.start) {
      return false;
    }
    const elapsed = c.elapsed - c.start;
    if (c.zDistance !== undefined) {
      config.camera.eye[0] =
        config.camera.lookAt[0] +
        c.zDistance * Math.sin(Math.PI * (elapsed / c.duration));
      config.camera.eye[2] =
        config.camera.lookAt[2] +
        c.zDistance * Math.cos(Math.PI * (elapsed / c.duration));
    } else {
      const l2Distance = Math.sqrt(
        (config.camera.eye[0] - config.camera.lookAt[0]) ** 2 +
          (config.camera.eye[2] - config.camera.lookAt[2]) ** 2
      );
      config.camera.eye[0] =
        config.camera.lookAt[0] +
        l2Distance * Math.sin(Math.PI * (elapsed / c.duration) * 2);
      config.camera.eye[2] =
        config.camera.lookAt[2] +
        l2Distance * Math.cos(Math.PI * (elapsed / c.duration) * 2);
    }
    return true;
  };
  return rotateCircular;
};

interface RotateCameraUpConfig {
  duration: number;
  direction: number;
  loop: boolean;
  start: number;
  cycle: number;
}

export const generateRotateCameraUp = (
  pluginConfig?: Partial<RotateCameraUpConfig>
): LifeCyclePlugin["render-camera"] => {
  const defaultConfig: RotateCameraUpConfig = {
    duration: 1000,
    direction: 1,
    loop: true,
    start: 0,
    cycle: 1,
  };
  const c = {
    ...defaultConfig,
    ...pluginConfig,
    elapsed: 0,
    lastTuned: false,
  };
  const rotateCircular: LifeCyclePlugin["render-camera"] = (
    config,
    delta,
    _,
    rewind
  ) => {
    if (rewind) {
      c.elapsed = 0;
      c.lastTuned = false;
    }
    if (!c.loop && c.elapsed >= c.duration * c.cycle + c.start) {
      if (c.lastTuned) {
        return false;
      }
      c.lastTuned = true;
      c.elapsed = c.duration * c.cycle - delta;
    }
    c.elapsed += delta;
    if (c.elapsed < c.start) {
      return false;
    }
    const elapsed = c.elapsed - c.start;
    config.camera.up[0] =
      Math.sin((Math.PI * elapsed * 2) / c.duration) * c.direction;
    config.camera.up[1] = Math.cos((Math.PI * elapsed * 2) / c.duration);
    return true;
  };
  return rotateCircular;
};
