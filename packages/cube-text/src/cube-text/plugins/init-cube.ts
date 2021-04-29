import { Color, Coordinate } from "@paosder/gl-world";
import { mat4, quat } from "gl-matrix";
import type { CubeInfo, LifeCyclePlugin } from "../type";

export type ColorInfo = Array<{ color: Color; ratio: number }>;

interface RandomColorConfig {
  colorInfo: Array<{ color: Color; ratio: number }>;
  overrideAlpha: boolean;
}

export const generateRandomColor = (
  pluginConfig?: Partial<RandomColorConfig>
) => {
  const defaultConfig: RandomColorConfig = {
    colorInfo: [
      {
        color: [1, 0, 0, 1],
        ratio: 0.25,
      },
      {
        color: [0, 0, 0, 1],
        ratio: 0.75,
      },
    ],
    overrideAlpha: false,
  };
  const c = {
    ...defaultConfig,
    ...pluginConfig,
  };
  const randomColor: LifeCyclePlugin["init-cube"] = (cubeInfo: CubeInfo) => {
    const sum = c.colorInfo.reduce<number>((acc, el) => acc + el.ratio, 0);
    let random = Math.random() * sum;
    for (let i = 0, n = c.colorInfo.length; i < n; i += 1) {
      if (random > c.colorInfo[i].ratio) {
        random -= c.colorInfo[i].ratio;
      } else {
        if (c.overrideAlpha) {
          // override all.
          cubeInfo.color = [...c.colorInfo[i].color];
        } else {
          // preserve previous alpha value.
          const alpha = cubeInfo.color[3];
          cubeInfo.color = [...c.colorInfo[i].color];
          cubeInfo.color[3] = alpha;
        }
        break;
      }
    }
  };
  return randomColor;
};

export const randomRotate: LifeCyclePlugin["init-cube"] = (
  cubeInfo: CubeInfo
) => {
  quat.random(cubeInfo.origin.rotation);
  mat4.fromQuat(cubeInfo.rotation as mat4, cubeInfo.origin.rotation);
};

interface RandomPositionConfig {
  min: Coordinate;
  max: Coordinate;
  basis: boolean;
}

export const generateRandomPosition = (
  pluginConfig?: Partial<RandomPositionConfig>
) => {
  const defaultConfig: RandomPositionConfig = {
    min: [-1, -1, -1],
    max: [1, 1, 1],
    basis: true,
  };
  const c = {
    ...defaultConfig,
    ...pluginConfig,
  };
  const length = c.min.map((el, i) => {
    return (c.max[i] - el) / 2;
  });
  const randomPosition: LifeCyclePlugin["init-cube"] = (cubeInfo: CubeInfo) => {
    for (let i = 0; i < 3; i += 1) {
      cubeInfo.position[i] =
        (c.basis
          ? cubeInfo.position[i] + Math.random() * length[i] - length[i] * 0.5
          : (c.max[i] + c.min[i]) * 0.5) +
        Math.random() * length[i] * 0.5;
    }
  };
  return randomPosition;
};

interface GradientColorConfig {
  color1: Color;
  color2: Color;
  overrideAlpha: boolean;
}

export const generateGradientColor = (
  pluginConfig?: Partial<GradientColorConfig>
) => {
  const defaultConfig: GradientColorConfig = {
    color1: [1, 0, 0, 1],
    color2: [1, 0, 1, 1],
    overrideAlpha: false,
  };
  const c = {
    ...defaultConfig,
    ...pluginConfig,
  };
  const gradientColor: LifeCyclePlugin["init-cube"] = (cubeInfo, position) => {
    const xRatio =
      (position.x / (position.margin + 1) + position.width * 0.5) /
      position.width;
    if (c.overrideAlpha) {
      // override all.
      cubeInfo.color = c.color1.map(
        (value, index) => value * (1 - xRatio) + c.color2[index] * xRatio
      ) as Color;
    } else {
      // preserve previous alpha value.
      const alpha = cubeInfo.color[3];
      cubeInfo.color = c.color1.map(
        (value, index) => value * (1 - xRatio) + c.color2[index] * xRatio
      ) as Color;
      cubeInfo.color[3] = alpha;
    }
  };
  return gradientColor;
};
