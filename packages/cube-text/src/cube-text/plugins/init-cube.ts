import { Color, Coordinate } from "@paosder/gl-world";
import { mat4, quat } from "gl-matrix";
import type { CubeInfo, LifeCyclePlugin } from "../type";

export type ColorInfo = Array<{ color: Color; ratio: number }>;

export const generateRandomColor = (
  colorInfo: ColorInfo,
  overrideAlpha?: boolean
) => {
  const randomColor: LifeCyclePlugin["init-cube"] = (cubeInfo: CubeInfo) => {
    const sum = colorInfo.reduce<number>((acc, el) => acc + el.ratio, 0);
    let random = Math.random() * sum;
    for (let i = 0, n = colorInfo.length; i < n; i += 1) {
      if (random > colorInfo[i].ratio) {
        random -= colorInfo[i].ratio;
      } else {
        if (overrideAlpha) {
          // override all.
          cubeInfo.color = [...colorInfo[i].color];
        } else {
          // preserve previous alpha value.
          const alpha = cubeInfo.color[3];
          cubeInfo.color = [...colorInfo[i].color];
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

export const generateRandomPosition = (
  min: Coordinate,
  max: Coordinate,
  basis: boolean = false
) => {
  const length = min.map((el, i) => {
    return (max[i] - el) / 2;
  });
  const randomPosition: LifeCyclePlugin["init-cube"] = (cubeInfo: CubeInfo) => {
    for (let i = 0; i < 3; i += 1) {
      cubeInfo.position[i] =
        (basis
          ? cubeInfo.position[i] + Math.random() * length[i] - length[i] * 0.5
          : (max[i] + min[i]) * 0.5) +
        Math.random() * length[i] * 0.5;
    }
  };
  return randomPosition;
};

export const generateGradientColor = (
  color1: Color,
  color2: Color,
  overrideAlpha?: boolean
) => {
  const gradientColor: LifeCyclePlugin["init-cube"] = (cubeInfo, position) => {
    const xRatio =
      (position.x / (position.margin + 1) + position.width * 0.5) /
      position.width;
    if (overrideAlpha) {
      // override all.
      cubeInfo.color = color1.map(
        (value, index) => value * (1 - xRatio) + color2[index] * xRatio
      ) as Color;
    } else {
      // preserve previous alpha value.
      const alpha = cubeInfo.color[3];
      cubeInfo.color = color1.map(
        (value, index) => value * (1 - xRatio) + color2[index] * xRatio
      ) as Color;
      cubeInfo.color[3] = alpha;
    }
  };
  return gradientColor;
};
