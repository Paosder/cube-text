import { mat4, vec3 } from "gl-matrix";

export interface CameraInfo {
  eye: vec3;
  lookAt: vec3;
  up: vec3;
}

export type ProjectionType = "perspective" | "orthogonal";

export interface Perspective {
  type: "perspective";
  fov: number;
  near: number;
  far: number;
}

// TODO: implement.
export interface Orthogonal {
  type: "orthogonal";
}

export type ProjectionInfo = Perspective | Orthogonal;

export interface MatrixInfo {
  isDirty: boolean;
  mat: mat4;
}

export interface WorldInfo {
  camera: MatrixInfo;
  projection: MatrixInfo;
  transformation: MatrixInfo;
}

export abstract class Renderer {
  gl!: WebGLRenderingContext;

  world!: WorldInfo;

  abstract get id(): string;

  abstract init(
    gl: WebGLRenderingContext,
    world: WorldInfo,
    getNextId: () => number
  ): void;

  abstract getId(id: number): string | undefined;

  abstract picked(id: string): void;

  abstract clear(): void;

  abstract render(lastRendered: string, isPicking?: boolean): string;
}
