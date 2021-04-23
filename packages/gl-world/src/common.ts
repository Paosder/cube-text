export type Color = [r: number, g: number, b: number, a: number];
export type Coordinate = [x: number, y: number, z: number];
export type Quaternion = [q1: number, q2: number, q3: number, q4: number];

export function getGLExtension<T>(
  gl: WebGLRenderingContext,
  extensionName: string
): T {
  const ext = gl.getExtension(extensionName);
  if (!ext) {
    throw new Error(`No extension found: '${extensionName}'.`);
  }
  return ext as T;
}

/**
 * Create and compile shader.
 * @param gl webGL context.
 * @param type Shader type. `vertex_shader | fragment_shader`
 * @param source GLSL code.
 */
export function createShader(
  gl: WebGLRenderingContext,
  shaderType: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(shaderType);
  if (!shader) {
    throw new Error("cannot create shader.");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (success) {
    // shader compile success.
    return shader;
  }

  // failed to compile.
  const infoLog = gl.getShaderInfoLog(shader);
  gl.deleteShader(shader);
  throw new Error(`shader compile failed,
  info: ${infoLog}`);
}

/**
 * Create and link program.
 * @param gl webGL context.
 * @param vertexShader vertex shader.
 * @param fragmentShader fragment shader.
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) {
    throw new Error("cannot create program.");
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  const infoLog = gl.getProgramInfoLog(program);
  gl.deleteProgram(program);
  throw new Error(`program link failed,
  info: ${infoLog}`);
}

export class Queue<T> {
  static SPLIT_LENGTH = 5000;

  queue: Array<T>;

  head: number;

  constructor() {
    this.queue = [];
    this.head = 0;
  }

  enqueue(...data: Array<T>) {
    this.queue.push(...data);
  }

  dequeue(): T {
    const data = this.queue[this.head];
    this.head += 1;
    if (Queue.SPLIT_LENGTH < this.head) {
      this.queue = this.queue.slice(this.head);
      this.head = 0;
    }
    return data;
  }

  *[Symbol.iterator]() {
    for (let i = this.head, n = this.queue.length; i < n; i += 1) {
      yield this.queue[i];
    }
  }

  get length() {
    return this.queue.length - this.head;
  }
}
