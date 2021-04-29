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

export const generateFullscreen = (
  scale: number = 1,
  start: number = 0
): LifeCyclePlugin["render-camera"] => {
  let elapsed = 0;
  const fullScreen: LifeCyclePlugin["render-camera"] = (config, delta) => {
    if (elapsed < start) {
      elapsed += delta;
      return false;
    }
    if (config.projection.type === "perspective") {
      const zDistance = computeZDistance(config);
      const norm = Math.sqrt(
        config.camera.eye[0] ** 2 + config.camera.eye[2] ** 2
      );
      config.camera.eye[0] *= (zDistance * scale) / norm;
      config.camera.eye[2] *= (zDistance * scale) / norm;
      return true;
    }
    return false;
  };
  return fullScreen;
};

export const generateZoom = (
  duration: number,
  targetRatio: number,
  zoomDirection: number = 1,
  start: number = 0
): LifeCyclePlugin["render-camera"] => {
  let elapsed = 0;
  const zoom: LifeCyclePlugin["render-camera"] = (config, delta) => {
    if (elapsed > duration + start) {
      return false;
    }
    elapsed += delta;
    if (elapsed < start) {
      return false;
    }
    const elapsedAfterStart = elapsed - start;
    if (config.projection.type === "perspective") {
      const zDistance = computeZDistance(config);
      const norm = Math.sqrt(
        config.camera.eye[0] ** 2 + config.camera.eye[2] ** 2
      );
      config.camera.eye[0] *= zDistance / norm;
      config.camera.eye[2] *= zDistance / norm;
    }
    if (zoomDirection > 0) {
      // zoom out
      config.camera.eye[0] *= targetRatio * (elapsedAfterStart / duration);
      config.camera.eye[2] *= targetRatio * (elapsedAfterStart / duration);
    } else {
      // zoom in
      config.camera.eye[0] =
        config.camera.eye[0] * ((duration - elapsedAfterStart) / duration) +
        config.camera.eye[0] * targetRatio * (elapsedAfterStart / duration);
      config.camera.eye[2] =
        config.camera.eye[2] * ((duration - elapsedAfterStart) / duration) +
        config.camera.eye[2] * targetRatio * (elapsedAfterStart / duration);
    }
    return true;
  };
  return zoom;
};

export const generateRotateY = (
  duration: number,
  loop?: boolean,
  zDistance?: number
): LifeCyclePlugin["render-camera"] => {
  let elapsed = 0;
  const rotateCircular: LifeCyclePlugin["render-camera"] = (config, delta) => {
    if (!loop && elapsed > duration) {
      return false;
    }
    elapsed += delta;

    if (zDistance !== undefined) {
      config.camera.eye[0] =
        config.camera.lookAt[0] +
        zDistance * Math.sin(Math.PI * (elapsed / duration));
      config.camera.eye[2] =
        config.camera.lookAt[2] +
        zDistance * Math.cos(Math.PI * (elapsed / duration));
    } else {
      const l2Distance = Math.sqrt(
        (config.camera.eye[0] - config.camera.lookAt[0]) ** 2 +
          (config.camera.eye[2] - config.camera.lookAt[2]) ** 2
      );
      config.camera.eye[0] =
        config.camera.lookAt[0] +
        l2Distance * Math.sin(Math.PI * (elapsed / duration) * 2);
      config.camera.eye[2] =
        config.camera.lookAt[2] +
        l2Distance * Math.cos(Math.PI * (elapsed / duration) * 2);
    }
    return true;
  };
  return rotateCircular;
};

export const generateRotateCameraUp = (
  duration: number,
  direction: number,
  loop?: boolean
): LifeCyclePlugin["render-camera"] => {
  let elapsed = 0;
  const rotateCircular: LifeCyclePlugin["render-camera"] = (config, delta) => {
    if (!loop && elapsed > duration) {
      return false;
    }
    elapsed += delta;
    config.camera.up[0] =
      Math.sin((Math.PI * elapsed * 2) / duration) * direction;
    config.camera.up[1] = Math.cos((Math.PI * elapsed * 2) / duration);
    return true;
  };
  return rotateCircular;
};
