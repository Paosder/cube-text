import { mat4, quat } from "gl-matrix";
import type { LifeCyclePlugin } from "../type";

interface RotateCubeToConfig {
  duration: number;
  to: quat;
  start: number;
}

export const generateRotateCubeTo = (
  pluginConfig?: Partial<RotateCubeToConfig>
): LifeCyclePlugin["render"] => {
  const defaultConfig: RotateCubeToConfig = {
    duration: 1000,
    to: quat.identity(quat.create()),
    start: 0,
  };

  const c = {
    ...defaultConfig,
    ...pluginConfig,
    lastTuned: false,
    elapsed: 0,
  };
  const tempQuat = quat.create();

  const rotateToAlign: LifeCyclePlugin["render"] = (
    origin,
    current,
    _,
    delta
  ) => {
    if (c.elapsed > c.duration + c.start) {
      if (c.lastTuned) {
        return false;
      }
      c.lastTuned = true;
      c.elapsed = c.duration - delta;
    }
    c.elapsed += delta;
    if (c.elapsed < c.start) {
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
          c.to,
          c.elapsed / c.duration
        );
        mat4.fromQuat(targetCube.rotation.ref, tempQuat);
      });
    });
    return true;
  };
  return rotateToAlign;
};

interface RewindToOriginConfig {
  duration: number;
  start: number;
}

export const generateRewindToOrigin = (
  pluginConfig?: Partial<RewindToOriginConfig>
) => {
  const defaultConfig: RewindToOriginConfig = {
    duration: 1000,
    start: 0,
  };
  const c = {
    ...defaultConfig,
    ...pluginConfig,
    elapsed: 0,
    lastTuned: false,
  };
  const rewindToOrigin: LifeCyclePlugin["render"] = (
    origin,
    current,
    _,
    delta
  ) => {
    let ratio = 1;
    if (c.elapsed > c.duration + c.start) {
      if (c.lastTuned) {
        // final step to restore original position.
        // to reduce error, we need to fix ratio to 1.
        return false;
      }
      c.lastTuned = true;
    } else {
      c.elapsed += delta;
      if (c.elapsed < c.start) {
        return false;
      }
      ratio = (c.elapsed - c.start) / c.duration;
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

interface NoisyConfig {
  ratio: number;
}

export const generateNoisy = (pluginConfig?: Partial<NoisyConfig>) => {
  const defaultConfig: NoisyConfig = {
    ratio: 1,
  };
  const c = {
    ...defaultConfig,
    ...pluginConfig,
  };
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
            Math.random() * targetCube.size.ref[0] * c.ratio;
        }
      });
    });
    return true;
  };
  return noisyPosition;
};

interface RotateCubeConfig {
  radius: number;
  duration: number;
  individual: boolean;
  loop: boolean;
  start: number;
  cycle: number;
}

export const generateRotateCube = (
  pluginConfig?: Partial<RotateCubeConfig>
) => {
  const defaultConfig: RotateCubeConfig = {
    radius: 1,
    duration: 1000,
    individual: true,
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
  const rotateCube: LifeCyclePlugin["render"] = (origin, current, _, delta) => {
    if (!c.loop && c.elapsed > c.duration * c.cycle + c.start) {
      if (c.lastTuned) {
        return false;
      }
      c.lastTuned = true;
      c.elapsed = c.duration * c.cycle + c.start - delta;
    }
    c.elapsed += delta;
    if (c.elapsed < c.start) {
      return false;
    }
    const ratio = (c.elapsed - c.start) / c.duration;
    origin.forEach(({ value: cubes }) => {
      // Because cubes are aligned with the y-axis(based with x coordinate),
      // the origin map may hold the number of height keys.
      cubes.forEach((cube) => {
        const targetCube = current.get(`${cube.id}`);
        if (!targetCube) return;
        targetCube.position.ref[0] =
          cube.origin.position[0] +
          Math.cos(Math.PI * (ratio + (c.individual ? cube.id * 0.1 : 0)) * 2) *
            c.radius;
        targetCube.position.ref[1] =
          cube.origin.position[1] +
          Math.sin(Math.PI * (ratio + (c.individual ? cube.id * 0.1 : 0)) * 2) *
            c.radius;
      });
    });
    return true;
  };
  return rotateCube;
};
