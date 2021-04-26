import { VectorMap } from "@paosder/vector-map";

export interface Attribute {
  loc: number;
  buffer: WebGLBuffer;
  arr: Float32Array;
  size: number;
  isDirty: boolean;
  isResized: boolean;
  usage: number;
  fixed?: boolean;
}

export interface AttrOptions {
  name: string;
  size: number;
  length: number;
  defaultData?: Float32Array;
  usage?: number;
  matrix?: boolean;
  fixed?: boolean;
}

export interface BufferIndex {
  index: number;
  length: number;
  ref: Float32Array;
}

export interface VariableIndex {
  [k: string]: BufferIndex;
}

export interface GLVariable {
  indices: VectorMap<string, VariableIndex>;
  attrs: Record<string, Attribute>;
  uniforms: Record<keyof VariableIndex, WebGLUniformLocation>;
}

interface AttributeOption {
  name: string;
  type: "attribute";
  size: number;
  usage: number;
  length: number;
  defaultData?: Float32Array;
  matrix?: boolean;
  instanced?: number;
  fixed?: boolean;
}

interface UniformOption {
  name: string;
  type: "uniform";
}

type VariableOption = AttributeOption | UniformOption;

export function createAttribute(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  opt: AttrOptions
): Attribute {
  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error("Cannot create buffer!");
  }
  const usage = opt.usage ?? gl.STATIC_DRAW;
  const arr =
    opt.defaultData ??
    new Float32Array(opt.length * opt.size * (opt.matrix ? opt.size : 1));
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, arr, usage);

  const loc = gl.getAttribLocation(program, opt.name);
  let { size } = opt;
  if (opt.matrix) {
    // ex. mat4 = 1 float x 4 columns x 4 rows x 4 bytes = 64.
    size *= size;
    const stride = opt.size ** 2 * 4;
    const offset = opt.size * 4;
    for (let i = 0; i < opt.size; i += 1) {
      gl.enableVertexAttribArray(loc + i);
      gl.vertexAttribPointer(
        loc + i,
        opt.size,
        gl.FLOAT,
        false,
        stride,
        offset * i
      );
    }
  } else {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, opt.size, gl.FLOAT, false, 0, 0);
  }

  return {
    loc,
    buffer,
    arr,
    size,
    isDirty: false,
    isResized: false,
    usage,
    fixed: opt.fixed,
  };
}

export function updateAttribute(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  attr: Attribute
) {
  if (attr.isDirty) {
    gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
    if (attr.isResized) {
      gl.bufferData(gl.ARRAY_BUFFER, attr.arr, attr.usage);
      attr.isResized = false;
    } else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, attr.arr);
    }
    attr.isDirty = false;
  }
}

export function createUniform(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string
): WebGLUniformLocation {
  const uniformLoc = gl.getUniformLocation(program, name);
  if (!uniformLoc) {
    throw new Error(`cannot find uniform location: '${name}'.`);
  }
  return uniformLoc;
}

export function addObject(
  objectInfo: GLVariable,
  id: string,
  data: Record<string, Array<number> | Float32Array>
) {
  const objectIndex: Record<string, BufferIndex> = {};
  Object.keys(objectInfo.attrs).forEach((key) => {
    if (objectInfo.attrs[key].fixed) {
      // ignore if this is fixed attribute.
      return;
    }
    const targetAttribute = objectInfo.attrs[key];
    const length = targetAttribute.size;
    const index = objectInfo.indices.size * length;

    if (targetAttribute.arr.length <= index + length) {
      // length exceeded. We need to re-aollocate array.
      // new array has double length.
      const newArr = new Float32Array(targetAttribute.arr.length * 2);
      // copy data to new array.
      newArr.set(targetAttribute.arr);
      // then replace it.
      targetAttribute.arr = newArr;
      targetAttribute.isResized = true;

      // because of re-allocation, we need to refresh all refs.
      // ! This step may produce frame drop.
      objectInfo.indices.forEach((obj) => {
        obj.value[key].ref = newArr.subarray(
          obj.value[key].index,
          obj.value[key].index + obj.value[key].length
        );
      });
    }
    // set new data.
    targetAttribute.arr.set(data[key], index);
    targetAttribute.isDirty = true;

    objectIndex[key] = {
      index,
      length,
      ref: targetAttribute.arr.subarray(index, index + length),
    };
  });

  objectInfo.indices.set(id, objectIndex);
}

export function modifyObject(
  objectInfo: GLVariable,
  id: string,
  data: Record<string, Array<number> | Float32Array>
): boolean {
  const target = objectInfo.indices.get(id);
  if (!target) {
    return false;
  }
  Object.entries(data).forEach(([key, _data]) => {
    const targetAttribute = objectInfo.attrs[key];
    targetAttribute.arr.set(_data, target[key].index);
    targetAttribute.isDirty = true;
  });
  return true;
}

export function getAttribArray(
  objectInfo: GLVariable,
  id: string,
  key: string,
  callback: (subArr: Float32Array) => any
) {
  const target = objectInfo.indices.get(id);
  if (!target) {
    return;
  }
  if (callback(target[key].ref)) {
    objectInfo.attrs[key].isDirty = true;
  }
}

export function forEachAttribArray(
  objectInfo: GLVariable,
  id: string,
  callback: (key: string, subArr: Float32Array) => any
) {
  const target = objectInfo.indices.get(id);
  if (!target) {
    return;
  }
  Object.entries(target).forEach(([key]) => {
    if (callback(key, target[key].ref)) {
      objectInfo.attrs[key].isDirty = true;
    }
  });
}

export function deleteObject(objectInfo: GLVariable, id: string): boolean {
  return objectInfo.indices.delete(id, (swapped, deleted) => {
    Object.keys(deleted.value).forEach((key) => {
      const targetAttribute = objectInfo.attrs[key];
      for (let i = 0; i < deleted.value[key].length; i += 1) {
        deleted.value[key].ref[i] = swapped.value[key].ref[i];
        // targetAttribute.arr[deleted.value[key].index + i] = targetAttribute.arr[swapped.value[key].index + i];
      }
      swapped.value[key].index = deleted.value[key].index;
      swapped.value[key].ref = deleted.value[key].ref;
      targetAttribute.isDirty = true;
    });
  });
}

export function clearObject(objectInfo: GLVariable) {
  objectInfo.indices.clear();
  Object.keys(objectInfo.attrs).forEach((key) => {
    objectInfo.attrs[key].isDirty = true;
  });
}

export function createGLVariable(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  variables: Record<string, VariableOption>
): GLVariable {
  const attrs: Record<string, Attribute> = {};
  const uniforms: Record<string, WebGLUniformLocation> = {};
  Object.entries(variables).forEach(([key, info]) => {
    if (info.type === "attribute") {
      const newAttr = createAttribute(gl, program, info);
      attrs[key as keyof Partial<Record<string, Attribute>>] = newAttr;
      if (info.instanced) {
        const instanceArrExt = gl.getExtension("ANGLE_instanced_arrays");
        if (!instanceArrExt) {
          throw new Error("cannot use instanced Array Extension!");
        }
        if (info.matrix) {
          for (let i = 0; i < info.size; i += 1) {
            instanceArrExt.vertexAttribDivisorANGLE(
              newAttr.loc + i,
              info.instanced
            );
          }
        } else {
          instanceArrExt.vertexAttribDivisorANGLE(newAttr.loc, info.instanced);
        }
      }
    } else if (info.type === "uniform") {
      uniforms[
        key as keyof Record<string, WebGLUniformLocation>
      ] = createUniform(gl, program, info.name);
    }
  });
  const newVariable: GLVariable = {
    indices: new VectorMap(),
    attrs,
    uniforms,
  };
  return newVariable;
}

export function updateVariable(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  variable: GLVariable,
  forced?: boolean
) {
  Object.keys(variable.attrs).forEach((k) => {
    if (variable.attrs[k].isDirty || forced) {
      variable.attrs[k].isDirty = true;
      updateAttribute(gl, program, variable.attrs[k]);
    }
  });
}
