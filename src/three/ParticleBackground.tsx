import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

const COUNT = 9000;
const TARGET_SIZE = 22;

/**
 * Order of shapes the cloud morphs through as the page scrolls top -> bottom.
 * "explode" is a procedural random scatter (from the reference project).
 */
const SHAPE_SEQUENCE = ["queen", "pawn", "explode", "queen"] as const;

/** Normalize an OBJ mesh to a uniform size, centered at the origin. */
function normalizeMesh(mesh: THREE.Mesh, targetSize = TARGET_SIZE) {
  mesh.geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  mesh.geometry.boundingBox!.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const s = targetSize / maxDim;
    mesh.geometry.scale(s, s, s);
  }
  mesh.geometry.center();
}

/** Sample `count` points off a mesh surface into a flat xyz array. */
function samplePoints(mesh: THREE.Mesh, count: number): Float32Array {
  const sampler = new MeshSurfaceSampler(mesh).build();
  const out = new Float32Array(count * 3);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(tmp);
    out.set([tmp.x, tmp.y, tmp.z], i * 3);
  }
  return out;
}

/** First mesh found inside a loaded OBJ group. */
function firstMesh(obj: THREE.Object3D): THREE.Mesh {
  let mesh: THREE.Mesh | null = null;
  obj.traverse((c) => {
    if ((c as THREE.Mesh).isMesh && !mesh) mesh = c as THREE.Mesh;
  });
  if (!mesh) throw new Error("No mesh in OBJ");
  return mesh;
}

/** Random scatter shape — the reference project's "explode". */
function explodePositions(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3] = (Math.random() - 0.5) * TARGET_SIZE * 2.2;
    out[i * 3 + 1] = (Math.random() - 0.5) * TARGET_SIZE * 2.2;
    out[i * 3 + 2] = (Math.random() - 0.5) * TARGET_SIZE * 2.2;
  }
  return out;
}

const vertexShader = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aRandom;
  varying float vRandom;
  void main() {
    vRandom = aRandom;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.6 + aRandom * 0.8) * uPixelRatio * (1.0 / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
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

function Particles({ scroll }: { scroll: React.MutableRefObject<number> }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const progress = useRef(0);

  const [queenObj, pawnObj] = useLoader(OBJLoader, [
    "models/Queen.obj",
    "models/Pawn.obj",
  ]);

  const { geometry, uniforms, shapes } = useMemo(() => {
    const queenMesh = firstMesh(queenObj);
    const pawnMesh = firstMesh(pawnObj);
    normalizeMesh(queenMesh);
    normalizeMesh(pawnMesh);

    const bank: Record<string, Float32Array> = {
      queen: samplePoints(queenMesh, COUNT),
      pawn: samplePoints(pawnMesh, COUNT),
      explode: explodePositions(COUNT),
    };
    const seq = SHAPE_SEQUENCE.map((k) => bank[k]);

    // Live buffer starts on the first shape.
    const position = new Float32Array(seq[0]);
    const randoms = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) randoms[i] = Math.random();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    const u = {
      uSize: { value: 26 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColorA: { value: new THREE.Color("#6ea8fe") },
      uColorB: { value: new THREE.Color("#c084fc") },
    };
    return { geometry: geo, uniforms: u, shapes: seq };
  }, [queenObj, pawnObj]);

  useFrame((_, delta) => {
    // Ease the live progress toward the scroll target for a fluid scrub.
    progress.current = THREE.MathUtils.damp(
      progress.current,
      scroll.current,
      4,
      delta
    );

    // Map 0..1 across the shape sequence and lerp the two neighbours.
    const span = shapes.length - 1;
    const f = progress.current * span;
    const i0 = Math.min(Math.floor(f), span - 1);
    const i1 = i0 + 1;
    const t = THREE.MathUtils.smoothstep(f - i0, 0, 1);

    const a = shapes[i0];
    const b = shapes[i1];
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i++) {
      pos[i] = a[i] + (b[i] - a[i]) * t;
    }
    geometry.attributes.position.needsUpdate = true;

    pointsRef.current.rotation.y += delta * 0.06;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
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

export default function ParticleBackground() {
  const scroll = useRef(0);

  // Track normalized scroll progress (0 at top, 1 at bottom). Works alongside
  // Lenis, which drives the real native scroll position.
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scroll.current = max > 0 ? window.scrollY / max : 0;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="bg-canvas">
      <Canvas
        camera={{ position: [0, 4, 60], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Particles scroll={scroll} />
      </Canvas>
    </div>
  );
}
