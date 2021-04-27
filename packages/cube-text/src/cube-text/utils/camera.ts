import type { LifeCycleCallbacks } from "../type";

export const generateFullscreen = (
  scale = 1
): LifeCycleCallbacks["renderCamera"] => {
  const fullScreen: LifeCycleCallbacks["renderCamera"] = (config) => {
    if (config.projection.type === "perspective") {
      const fovy = config.projection.fov * 0.5;
      const zPos = Math.max(
        config.textSizeReadOnly.height / Math.tan(fovy),
        config.textSizeReadOnly.width /
          Math.tan(fovy) /
          (config.screenSizeReadOnly.width / config.screenSizeReadOnly.height)
      );
      const norm = Math.sqrt(
        config.camera.eye[0] ** 2 + config.camera.eye[2] ** 2
      );
      config.camera.eye[0] *= (zPos * scale) / norm;
      config.camera.eye[2] *= (zPos * scale) / norm;
      return true;
    }
    return false;
  };
  return fullScreen;
};

export const generateZoom = (
  duration: number,
  targetRatio: number,
  zoomDirection = 1
): LifeCycleCallbacks["renderCamera"] => {
  let elapsed = 0;
  const zoom: LifeCycleCallbacks["renderCamera"] = (config, delta) => {
    if (elapsed > duration) {
      return false;
    }
    elapsed += delta;
    if (config.projection.type === "perspective") {
      const fovy = config.projection.fov * 0.5;
      const zPos = Math.max(
        config.textSizeReadOnly.height / Math.tan(fovy),
        config.textSizeReadOnly.width /
          Math.tan(fovy) /
          (config.screenSizeReadOnly.width / config.screenSizeReadOnly.height)
      );
      const norm = Math.sqrt(
        config.camera.eye[0] ** 2 + config.camera.eye[2] ** 2
      );
      config.camera.eye[0] *= zPos / norm;
      config.camera.eye[2] *= zPos / norm;
    }
    if (zoomDirection > 0) {
      // zoom out
      config.camera.eye[0] *= targetRatio * (elapsed / duration);
      config.camera.eye[2] *= targetRatio * (elapsed / duration);
    } else {
      // zoom in
      config.camera.eye[0] =
        config.camera.eye[0] * ((duration - elapsed) / duration) +
        config.camera.eye[0] * targetRatio * (elapsed / duration);
      config.camera.eye[2] =
        config.camera.eye[2] * ((duration - elapsed) / duration) +
        config.camera.eye[2] * targetRatio * (elapsed / duration);
    }
    return true;
  };
  return zoom;
};

export const generateRotateZAxis = (
  duration: number,
  loop?: boolean,
  zDistance?: number
): LifeCycleCallbacks["renderCamera"] => {
  let elapsed = 0;
  const rotateCircular: LifeCycleCallbacks["renderCamera"] = (
    config,
    delta
  ) => {
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
): LifeCycleCallbacks["renderCamera"] => {
  let elapsed = 0;
  const rotateCircular: LifeCycleCallbacks["renderCamera"] = (
    config,
    delta
  ) => {
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
