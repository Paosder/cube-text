import { Color, ScreenConfig } from "@paosder/gl-world";

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

export enum RenderOrder {
  static = "static",
  incremental = "incremental",
  line = "line",
}

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
  screenSizeReadOnly: SizeConfig;
};

export interface TextOptions {
  size: number;
  margin: number;
  colors: Array<Color>;
  colorType: ColorType;
  overrideAlpha: boolean;
  renderOrder: RenderOrder;
  align: "left" | "center" | "right";
  rotate: boolean;
  drawType: "stroke" | "fill";
}
