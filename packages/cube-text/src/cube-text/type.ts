import type { VariableIndex } from "@paosder/gl-variable";
import type { Color, Coordinate, ScreenConfig } from "@paosder/gl-world";
import type { VectorMap } from "@paosder/vector-map";
import { quat } from "gl-matrix";

export interface GradientColor {
  type: "gradient";
  ratio: Array<number>;
}

export interface InterpolationRatio {
  tx: number;
  ty: number;
}

export type GradientColorArgs = GradientColor & InterpolationRatio;

export interface RandomColor {
  type: "random";
  ratio: Array<number>;
}

export type ColorType = GradientColor | RandomColor;

export interface SizeConfig {
  width: number;
  height: number;
}

/**
 * Screen configuration values of CubeText.
 *
 * Note that most attributes are mutable and they will be applied immediately
 * after return true in a callback to refresh feature.
 * however, some attribues which has postfix 'ReadOnly' must not modify
 * or CubeText could potentially mangled in inside.
 * They aren't actually 'immutable'.
 */
export type CubeTextScreenConfig = ScreenConfig & {
  textSizeReadOnly: SizeConfig;
  computedSizeReadOnly: SizeConfig;
  screenSizeReadOnly: SizeConfig;
};

export interface TextOptions {
  size: number;
  style: string;
}
export interface CubeOptions {
  size: number;
  margin: number;
  align: "left" | "center" | "right";
  drawType: "stroke" | "fill";
}

export interface CubeInfo {
  id: number;
  color: Color;
  position: Coordinate;
  rotation: number[] | Float32Array;
  size: [number];
  origin: {
    position: Coordinate;
    rotation: quat;
    size: [number];
    color: Color;
  };
}

export interface LifeCyclePlugin {
  render: (
    origin: VectorMap<number, CubeInfo[]>,
    cubes: VectorMap<string, VariableIndex>,
    screenConfig: CubeTextScreenConfig,
    delta: number,
    time: number
  ) => boolean;
  "render-camera": (
    screenConfig: CubeTextScreenConfig,
    delta: number,
    time: number
  ) => boolean;
  "init-cube": (
    cubeInfo: CubeInfo,
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
      margin: number;
    }
  ) => void;
}
