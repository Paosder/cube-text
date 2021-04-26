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
