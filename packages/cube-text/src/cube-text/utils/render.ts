import { mat4, quat } from "gl-matrix";
import type { LifeCycleCallbacks } from "../type";

export const generateRotateTo = (
  duration: number,
  rotateTo: quat = quat.identity(quat.create())
): LifeCycleCallbacks["render"] => {
  const tempQuat = quat.create();
  let elapsed = 0;

  const rotateToAlign: LifeCycleCallbacks["render"] = (
    origin,
    current,
    _,
    delta
  ) => {
    if (duration < elapsed) {
      return false;
    }
    elapsed = delta + elapsed > duration ? duration : delta + elapsed;
    origin.forEach(({ value: cubes }) => {
      // Because cubes are aligned with the y-axis(based with x coordinate),
      // the origin map may hold the number of height keys.
      cubes.forEach((cube) => {
        const targetCube = current.get(`${cube.id}`);
        if (!targetCube) return;
        quat.slerp(tempQuat, cube.rotationQuat, rotateTo, elapsed / duration);
        mat4.fromQuat(targetCube.rotation.ref, tempQuat);
      });
    });
    return true;
  };
  return rotateToAlign;
};
