export const particleVertexShader = /* glsl */ `
  uniform float uSize;
  uniform vec2 uSizeRange;
  uniform float uPixelRatio;
  uniform vec3 uRayOrigin;
  uniform vec3 uRayDir;
  uniform float uMouseRadius;
  uniform float uMouseStrength;
  uniform float uTime;
  attribute float aRandom;
  varying float vRandom;

  void main() {
    vRandom = aRandom;
    vec4 world = modelMatrix * vec4(position, 1.0);

    // Pointer repulsion around the camera→cursor ray: each particle is
    // pushed away from its closest point on the ray, so the field is a
    // cylinder cast from the camera through the cursor — whatever the
    // cursor covers on screen reacts, at every depth, perspective-correct.
    // uRayOrigin defaults far away, which disables the whole term.
    vec3 toP = world.xyz - uRayOrigin;
    float along = dot(toP, uRayDir);
    vec3 axisPoint = uRayOrigin + along * uRayDir;
    float dist = distance(world.xyz, axisPoint);
    float falloff = smoothstep(uMouseRadius * (0.8 + aRandom * 0.4), 0.0, dist)
      * step(0.0, along);
    vec3 dir = (world.xyz - axisPoint) / max(dist, 0.0001);
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
