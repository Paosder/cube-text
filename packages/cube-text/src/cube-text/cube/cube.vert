// surface.
attribute vec3 a_surface;

// instanced data.
attribute vec3 a_position;
attribute vec4 a_color;
attribute mat4 a_rotation;
attribute float a_size;
attribute vec4 a_id;

uniform mat4 u_transform;
uniform bool u_isPicking;

varying vec4 v_color;
varying vec4 v_id;

void main() {
  vec4 rotated = a_rotation * vec4(a_surface * a_size, 1);
  gl_Position = u_transform * vec4(a_position + rotated.xyz, 1);
  v_color = a_color;
  v_id = a_id;
}
