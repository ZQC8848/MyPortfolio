import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import gsap from "gsap";

const COUNT = 12000;

/** Samples COUNT points off the surface of a geometry into a flat xyz array. */
function sampleSurface(geometry: THREE.BufferGeometry, count: number): Float32Array {
  const mesh = new THREE.Mesh(geometry);
  const sampler = new MeshSurfaceSampler(mesh).build();
  const positions = new Float32Array(count * 3);
  const temp = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(temp);
    positions.set([temp.x, temp.y, temp.z], i * 3);
  }
  return positions;
}

const vertexShader = /* glsl */ `
  uniform float uProgress;
  uniform float uSize;
  uniform float uTime;
  uniform float uPixelRatio;

  attribute vec3 aTarget;
  attribute float aScale;

  varying float vMix;

  void main() {
    // Eased morph between the two sampled shapes.
    float p = smoothstep(0.0, 1.0, uProgress);
    vec3 morphed = mix(position, aTarget, p);

    // Subtle living turbulence so the cloud never feels frozen.
    morphed.x += sin(uTime * 0.5 + position.y * 2.0) * 0.04;
    morphed.y += cos(uTime * 0.4 + position.z * 2.0) * 0.04;

    vMix = aScale;

    vec4 mvPosition = modelViewMatrix * vec4(morphed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mvPosition.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vMix;

  void main() {
    // Soft round point.
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, d);
    vec3 color = mix(uColorA, uColorB, vMix);
    gl_FragColor = vec4(color, alpha);
  }
`;

function Particles() {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const pointer = useRef({ x: 0, y: 0 });

  const { geometry, uniforms } = useMemo(() => {
    const shapeA = new THREE.IcosahedronGeometry(1.4, 20);
    const shapeB = new THREE.TorusKnotGeometry(1.0, 0.34, 220, 32);

    const posA = sampleSurface(shapeA, COUNT);
    const posB = sampleSurface(shapeB, COUNT);
    const scales = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) scales[i] = Math.random() * 0.6 + 0.4;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posA, 3));
    geo.setAttribute("aTarget", new THREE.BufferAttribute(posB, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

    shapeA.dispose();
    shapeB.dispose();

    const u = {
      uProgress: { value: 0 },
      uSize: { value: 18 },
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColorA: { value: new THREE.Color("#6ea8fe") },
      uColorB: { value: new THREE.Color("#c084fc") },
    };
    return { geometry: geo, uniforms: u };
  }, []);

  // Loop the morph back and forth.
  useMemo(() => {
    const tween = gsap.to(uniforms.uProgress, {
      value: 1,
      duration: 4,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      repeatDelay: 0.6,
    });
    return () => tween.kill();
  }, [uniforms]);

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;
    // Pointer parallax — gentle drift toward the cursor.
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;
    const g = pointsRef.current;
    g.rotation.y += delta * 0.08;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.current.y * 0.25, 0.05);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -pointer.current.x * 0.15, 0.05);
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleMorph() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Particles />
    </Canvas>
  );
}
