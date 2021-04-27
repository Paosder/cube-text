import {
  addObject,
  createGLVariable,
  createUniform,
  deleteObject,
  getAttribArray,
  GLVariable,
  modifyObject,
  updateVariable,
  clearObject,
} from "@paosder/gl-variable";
import {
  Color,
  Coordinate,
  createProgram,
  createShader,
  getGLExtension,
  Renderer,
  WorldInfo,
} from "@paosder/gl-world";
import vert from "./cube.vert";
import frag from "./cube.frag";

class CubeRenderer extends Renderer {
  static id = "cube";

  static DEFAULT_CUBE_LENGTH = 100000;

  protected program!: WebGLProgram;

  protected vaoExt!: OES_vertex_array_object;

  protected vao!: WebGLVertexArrayObjectOES;

  protected instanced!: ANGLE_instanced_arrays;

  #cubes!: GLVariable;

  protected cubeIds!: Map<number, string>;

  protected getNextId!: () => number;

  protected transform!: WebGLUniformLocation;

  protected picking!: WebGLUniformLocation;

  initialized: boolean;

  onselect?: (id: string) => void;

  constructor() {
    super();
    this.initialized = false;
  }

  init(gl: WebGLRenderingContext, world: WorldInfo, getNextId: () => number) {
    this.gl = gl;
    this.world = world;
    this.vaoExt = getGLExtension(gl, "OES_vertex_array_object");
    this.instanced = getGLExtension(gl, "ANGLE_instanced_arrays");

    const vao = this.vaoExt.createVertexArrayOES();
    if (!vao) {
      throw new Error("cannot create VAO!");
    }
    this.vao = vao;
    this.vaoExt.bindVertexArrayOES(this.vao);

    this.program = createProgram(
      gl,
      createShader(gl, gl.VERTEX_SHADER, vert),
      createShader(gl, gl.FRAGMENT_SHADER, frag)
    );

    this.transform = createUniform(gl, this.program, "u_transform");
    this.picking = createUniform(gl, this.program, "u_isPicking");

    // ///////////////////////////////
    // define cube with index buffer.

    // prettier-ignore
    const points = new Float32Array([
      //   4----5
      //  /|   /|
      // 0----3 |
      // | 6  | 7
      // 1----2
      // define points.
      -0.5, 0.5, 0.5, // 0
      -0.5, -0.5, 0.5, // 1
      0.5, -0.5, 0.5, // 2
      0.5, 0.5, 0.5, // 3
      -0.5, 0.5, -0.5, // 4
      0.5, 0.5, -0.5, // 5
      -0.5, -0.5, -0.5, // 6
      0.5, -0.5, -0.5, // 7
    ]);

    // set index buffer.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // prettier-ignore
    const indexArray = new Uint16Array([
      // front
      0, 1, 2,
      0, 2, 3,
      // top
      4, 0, 3,
      4, 3, 5,
      // left
      4, 6, 1,
      4, 1, 0,
      // right
      3, 2, 7,
      3, 7, 5,
      // back
      5, 7, 6,
      5, 6, 4,
      // bottom
      1, 6, 7,
      1, 7, 2,
    ]);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);

    // ///////////////////////////////

    this.#cubes = createGLVariable(gl, this.program, {
      surface: {
        name: "a_surface",
        type: "attribute",
        size: 3,
        length: 24,
        usage: gl.STATIC_DRAW,
        defaultData: points,
        fixed: true,
      },
      id: {
        name: "a_id",
        type: "attribute",
        size: 4,
        usage: gl.STATIC_DRAW,
        length: CubeRenderer.DEFAULT_CUBE_LENGTH,
        instanced: 1,
      },
      color: {
        name: "a_color",
        type: "attribute",
        size: 4,
        usage: gl.DYNAMIC_DRAW,
        length: CubeRenderer.DEFAULT_CUBE_LENGTH,
        instanced: 1,
      },
      position: {
        name: "a_position",
        type: "attribute",
        size: 3,
        usage: gl.DYNAMIC_DRAW,
        length: CubeRenderer.DEFAULT_CUBE_LENGTH,
        instanced: 1,
      },
      rotation: {
        name: "a_rotation",
        type: "attribute",
        size: 4,
        matrix: true,
        usage: gl.DYNAMIC_DRAW,
        length: CubeRenderer.DEFAULT_CUBE_LENGTH,
        instanced: 1,
      },
      size: {
        name: "a_size",
        type: "attribute",
        size: 1,
        usage: gl.DYNAMIC_DRAW,
        length: CubeRenderer.DEFAULT_CUBE_LENGTH,
        instanced: 1,
      },
    });
    this.getNextId = getNextId;
    this.cubeIds = new Map();
    // initialize step finished.
    this.vaoExt.bindVertexArrayOES(null);
    this.initialized = true;
  }

  // eslint-disable-next-line class-methods-use-this
  get id() {
    return CubeRenderer.id;
  }

  get length() {
    return this.#cubes.indices.size;
  }

  add(
    id: string,
    options: {
      color: Color;
      position: Coordinate;
      rotation: number[] | Float32Array;
      size: [number];
    }
  ) {
    const newId = this.getNextId();
    this.cubeIds.set(newId, id);
    addObject(this.#cubes, id, {
      ...options,
      id: [
        // id is immutable.
        ((newId >> 0) & 0xff) / 0xff,
        ((newId >> 8) & 0xff) / 0xff,
        ((newId >> 16) & 0xff) / 0xff,
        ((newId >> 24) & 0xff) / 0xff,
      ],
    });
  }

  getId(id: number) {
    return this.cubeIds.get(id);
  }

  picked(id: string) {
    if (this.onselect) {
      this.onselect(id);
    }
  }

  getCubeAttr(
    id: string,
    key: string,
    callback: (attr: Float32Array) => boolean
  ) {
    getAttribArray(this.#cubes, id, key, callback);
  }

  get cubes() {
    return this.#cubes.indices;
  }

  modify(
    id: string,
    options: Partial<{
      color: Color;
      position: Coordinate;
      rotation: number[];
      size: [number];
    }>
  ) {
    modifyObject(this.#cubes, id, options as Record<string, number[]>);
  }

  delete(id: string) {
    // execute swap & delete.
    getAttribArray(this.#cubes, id, "id", (data) => {
      const uuid = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
      deleteObject(this.#cubes, id);
      this.cubeIds.delete(uuid);
    });
  }

  clear() {
    clearObject(this.#cubes);
    this.cubeIds.clear();
  }

  updateBuffer(forced?: boolean) {
    updateVariable(this.gl, this.program, this.#cubes, forced);
  }

  render(lastRendered: string, isPicking?: boolean) {
    if (lastRendered !== CubeRenderer.id) {
      this.gl.useProgram(this.program);
    }
    if (isPicking) {
      this.gl.uniform1i(this.picking, 1);
    } else {
      this.gl.uniform1i(this.picking, 0);
    }

    this.vaoExt.bindVertexArrayOES(this.vao);

    this.updateBuffer();
    if (this.world.transformation.isDirty) {
      this.gl.uniformMatrix4fv(
        this.transform,
        false,
        this.world.transformation.mat
      );
    }

    if (this.#cubes.indices.size > 0) {
      this.instanced.drawElementsInstancedANGLE(
        this.gl.TRIANGLES,
        36,
        this.gl.UNSIGNED_SHORT,
        0,
        this.#cubes.indices.size
      );
    }
    this.vaoExt.bindVertexArrayOES(null);
    return CubeRenderer.id;
  }
}

export default CubeRenderer;
