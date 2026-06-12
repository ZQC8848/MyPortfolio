export const particleVertexShader = /* glsl */ `
  uniform float uSize;
  uniform vec2 uSizeRange;
  uniform float uPixelRatio;
  attribute float aRandom;
  varying float vRandom;

  void main() {
    vRandom = aRandom;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * mix(uSizeRange.x, uSizeRange.y, aRandom)
      * uPixelRatio * (1.0 / -mv.z);
  }
`;

export const particleFragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vRandom;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(mix(uColorA, uColorB, vRandom), alpha * 0.85);
  }
`;
