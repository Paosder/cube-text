precision mediump float;

uniform bool u_isPicking;

varying vec4 v_id;
varying vec4 v_color;

void main() {
  if (u_isPicking == true) {
    gl_FragColor = v_id;
  } else {
    gl_FragColor = v_color;
  }
}
