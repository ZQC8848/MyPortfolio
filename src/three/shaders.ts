export const particleVertexShader = /* glsl */ `
  uniform float uSize;
  uniform vec2 uSizeRange;
  uniform float uPixelRatio;
  uniform vec3 uMouse;
  uniform float uMouseRadius;
  uniform float uMouseStrength;
  uniform float uTime;
  attribute float aRandom;
  varying float vRandom;

  void main() {
    vRandom = aRandom;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * world;

    // Pointer repulsion as a screen-aligned cylinder: distance is measured
    // only across the view plane (xy), so every particle under the cursor
    // reacts no matter how deep it sits — front and back of the cloud open
    // together. Push happens in the same plane, with smoothstep falloff and
    // a per-particle shimmer. uMouse defaults far away (term disabled).
    vec2 mouseView = (viewMatrix * vec4(uMouse, 1.0)).xy;
    float dist = distance(mv.xy, mouseView);
    float falloff = smoothstep(uMouseRadius * (0.8 + aRandom * 0.4), 0.0, dist);
    vec2 dir = (mv.xy - mouseView) / max(dist, 0.0001);
    mv.xy += dir * falloff * uMouseStrength
      * (0.85 + 0.15 * sin(uTime * 2.0 + aRandom * 6.2832));

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
