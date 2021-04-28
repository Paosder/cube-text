import { mat4, quat } from "gl-matrix";
import type { LifeCycleCallbacks } from "../type";

export const generateRotateTo = (
  duration: number,
  rotateTo: quat = quat.identity(quat.create()),
  start = 0
): LifeCycleCallbacks["render"] => {
  const tempQuat = quat.create();
  let elapsed = 0;

  const rotateToAlign: LifeCycleCallbacks["render"] = (
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

export const generateRewindToOriginPosition = (duration: number, start = 0) => {
  let elapsed = 0;
  let lastRendered = false;
  const rewindToOriginPosition: LifeCycleCallbacks["render"] = (
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
  return rewindToOriginPosition;
};
