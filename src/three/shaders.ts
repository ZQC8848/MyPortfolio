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

    // Pointer repulsion, in world space so it ignores the cloud's own spin:
    // particles inside uMouseRadius get pushed radially away from the
    // cursor with a smooth falloff; a per-particle shimmer keeps the bulge
    // alive. uMouse defaults far away, which disables the whole term.
    float dist = distance(world.xyz, uMouse);
    float falloff = smoothstep(uMouseRadius * (0.8 + aRandom * 0.4), 0.0, dist);
    vec3 dir = (world.xyz - uMouse) / max(dist, 0.0001);
    world.xyz += dir * falloff * uMouseStrength
      * (0.85 + 0.15 * sin(uTime * 2.0 + aRandom * 6.2832));

    vec4 mv = viewMatrix * world;
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
