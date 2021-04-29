import { mat4, quat } from "gl-matrix";
import type { LifeCyclePlugin } from "../type";

export const generateRotateTo = (
  duration: number,
  rotateTo: quat = quat.identity(quat.create()),
  start: number = 0
): LifeCyclePlugin["render"] => {
  const tempQuat = quat.create();
  let elapsed = 0;

  const rotateToAlign: LifeCyclePlugin["render"] = (
    origin,
    current,
    _,
    delta
  ) => {
    if (elapsed > duration + start) {
      return false;
    }
    elapsed = delta + elapsed > duration ? duration : delta + elapsed;
    if (elapsed < start) {
      return false;
    }
    origin.forEach(({ value: cubes }) => {
      // Because cubes are aligned with the y-axis(based with x coordinate),
      // the origin map may hold the number of height keys.
      cubes.forEach((cube) => {
        const targetCube = current.get(`${cube.id}`);
        if (!targetCube) return;
        quat.slerp(
          tempQuat,
          cube.origin.rotation,
          rotateTo,
          elapsed / duration
        );
        mat4.fromQuat(targetCube.rotation.ref, tempQuat);
      });
    });
    return true;
  };
  return rotateToAlign;
};

export const generateRewindToOrigin = (duration: number, start: number = 0) => {
  let elapsed = 0;
  let lastRendered = false;
  const rewindToOrigin: LifeCyclePlugin["render"] = (
    origin,
    current,
    _,
    delta
  ) => {
    let ratio = 1;
    if (elapsed > duration + start) {
      if (lastRendered) {
        // final step to restore original position.
        // to reduce error, we need to fix ratio to 1.
        return false;
      }
      lastRendered = true;
    } else {
      elapsed += delta;
      if (elapsed < start) {
        return false;
      }
      ratio = (elapsed - start) / duration;
    }
    origin.forEach(({ value: cubes }) => {
      // Because cubes are aligned with the y-axis(based with x coordinate),
      // the origin map may hold the number of height keys.
      cubes.forEach((cube) => {
        const targetCube = current.get(`${cube.id}`);
        if (!targetCube) return;
        for (let i = 0; i < 3; i += 1) {
          targetCube.position.ref[i] =
            cube.origin.position[i] * ratio + cube.position[i] * (1 - ratio);
        }
      });
    });
    return true;
  };
  return rewindToOrigin;
};

export const generateNoisy = (ratio: number = 1) => {
  const noisyPosition: LifeCyclePlugin["render"] = (origin, current) => {
    origin.forEach(({ value: cubes }) => {
      // Because cubes are aligned with the y-axis(based with x coordinate),
      // the origin map may hold the number of height keys.
      cubes.forEach((cube) => {
        const targetCube = current.get(`${cube.id}`);
        if (!targetCube) return;
        for (let i = 0; i < 3; i += 1) {
          targetCube.position.ref[i] =
            cube.origin.position[i] +
            Math.random() * targetCube.size.ref[0] * ratio;
        }
      });
    });
    return true;
  };
  return noisyPosition;
};

export const generateRotateCube = (
  radius: number,
  duration: number = 1000,
  individual: boolean = false,
  loop: boolean = false,
  start: number = 0
) => {
  let elapsed = 0;
  const rotateCube: LifeCyclePlugin["render"] = (origin, current, _, delta) => {
    if (!loop && elapsed > duration + start) {
      return false;
    }
    elapsed += delta;
    if (elapsed < start) {
      return false;
    }
    const ratio = (elapsed - start) / duration;
    origin.forEach(({ value: cubes }) => {
      // Because cubes are aligned with the y-axis(based with x coordinate),
      // the origin map may hold the number of height keys.
      cubes.forEach((cube) => {
        const targetCube = current.get(`${cube.id}`);
        if (!targetCube) return;
        targetCube.position.ref[0] =
          cube.origin.position[0] +
          Math.cos(Math.PI * (ratio + (individual ? cube.id * 0.1 : 0)) * 2) *
            radius;
        targetCube.position.ref[1] =
          cube.origin.position[1] +
          Math.sin(Math.PI * (ratio + (individual ? cube.id * 0.1 : 0)) * 2) *
            radius;
      });
    });
    return true;
  };
  return rotateCube;
};
