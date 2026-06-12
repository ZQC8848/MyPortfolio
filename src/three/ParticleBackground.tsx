import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import {
  CAMERA,
  MODELS,
  PARTICLES,
  SHAPE_KEYFRAMES,
  getDprRange,
  getParticleCount,
  prefersReducedMotion,
} from "../config";
import { useScrollProgress } from "../lib/ScrollContext";
import { particleFragmentShader, particleVertexShader } from "./shaders";
import {
  applyKeyframeScale,
  explodePositions,
  keyframeQuaternion,
  shapeFromObj,
} from "./sampling";

const MODEL_KEYS = Object.keys(MODELS) as (keyof typeof MODELS)[];
const MODEL_PATHS = MODEL_KEYS.map((k) => MODELS[k]);

/** Pulls the camera back on narrow/portrait viewports so the model fits. */
function ResponsiveCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useEffect(() => {
    const aspect = size.width / size.height;
    const fovRad = (camera.fov * Math.PI) / 180;
    // Distance needed for the frame to span CAMERA.fitWidth horizontally.
    const fitDist = CAMERA.fitWidth / (2 * Math.tan(fovRad / 2) * aspect);
    const dist = Math.max(CAMERA.distance, fitDist);
    camera.position.set(0, CAMERA.height, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

function Particles() {
  const scroll = useScrollProgress();
  const groupRef = useRef<THREE.Group>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const progress = useRef(0);
  const lastWritten = useRef(-1);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const count = useMemo(() => getParticleCount(), []);

  const loaded = useLoader(OBJLoader, MODEL_PATHS);

  const { geometry, uniforms, shapes, offsets, quaternions } = useMemo(() => {
    const bank: Partial<Record<string, Float32Array>> = {
      explode: explodePositions(count),
    };
    MODEL_KEYS.forEach((key, i) => {
      bank[key] = shapeFromObj(loaded[i], count);
    });
    // Bake per-keyframe scale into the banks; rotation and position offsets
    // are interpolated per-frame at the group level in useFrame, so they stay
    // fixed in screen space while the inner points object idle-spins.
    const seq = SHAPE_KEYFRAMES.map((kf) =>
      applyKeyframeScale(bank[kf.shape]!, kf)
    );
    const offs = SHAPE_KEYFRAMES.map((kf) => kf.offset ?? [0, 0, 0]);
    const quats = SHAPE_KEYFRAMES.map(keyframeQuaternion);

    const randoms = new Float32Array(count);
    for (let i = 0; i < count; i++) randoms[i] = Math.random();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(seq[0]), 3)
    );
    geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    const u = {
      uSize: { value: PARTICLES.size },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColorA: { value: new THREE.Color(PARTICLES.colorA) },
      uColorB: { value: new THREE.Color(PARTICLES.colorB) },
    };
    return {
      geometry: geo,
      uniforms: u,
      shapes: seq,
      offsets: offs,
      quaternions: quats,
    };
  }, [loaded, count]);

  useFrame((_, delta) => {
    // Idle rotation stays cheap and per-frame; skipped for reduced motion.
    if (!reducedMotion) {
      pointsRef.current.rotation.y += delta * PARTICLES.idleRotation;
    }

    // Chase the scroll position (instantly under reduced motion).
    progress.current = reducedMotion
      ? scroll.current
      : THREE.MathUtils.damp(progress.current, scroll.current, PARTICLES.damp, delta);

    // Early-out: don't rewrite/re-upload 27k floats while scroll is idle.
    if (Math.abs(progress.current - lastWritten.current) < 1e-4) return;
    lastWritten.current = progress.current;

    // Find the keyframe segment containing the current progress (the `at`
    // values are ascending), then lerp the two neighbouring banks.
    const f = THREE.MathUtils.clamp(progress.current, 0, 1);
    let i0 = 0;
    for (let i = SHAPE_KEYFRAMES.length - 2; i >= 0; i--) {
      if (f >= SHAPE_KEYFRAMES[i].at) {
        i0 = i;
        break;
      }
    }
    const a0 = SHAPE_KEYFRAMES[i0].at;
    const a1 = SHAPE_KEYFRAMES[i0 + 1].at;
    const t = THREE.MathUtils.smoothstep(
      a1 > a0 ? (f - a0) / (a1 - a0) : 1,
      0,
      1
    );

    // Keyframe offsets live on the outer group (screen space): position is
    // lerped, rotation slerped — the inner points' idle spin can't drag them.
    const o0 = offsets[i0];
    const o1 = offsets[i0 + 1];
    groupRef.current.position.set(
      o0[0] + (o1[0] - o0[0]) * t,
      o0[1] + (o1[1] - o0[1]) * t,
      o0[2] + (o1[2] - o0[2]) * t
    );
    groupRef.current.quaternion.slerpQuaternions(
      quaternions[i0],
      quaternions[i0 + 1],
      t
    );

    const a = shapes[i0];
    const b = shapes[i0 + 1];
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i++) {
      pos[i] = a[i] + (b[i] - a[i]) * t;
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <points
        ref={pointsRef}
        geometry={geometry}
        rotation={[0, PARTICLES.initialRotationY, 0]}
        frustumCulled={false}
      >
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function ParticleBackground() {
  return (
    <div className="bg-canvas">
      <Canvas
        camera={{ fov: CAMERA.fov, position: [0, CAMERA.height, CAMERA.distance] }}
        dpr={getDprRange()}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          // Allow the browser to restore a lost context instead of staying blank.
          gl.domElement.addEventListener("webglcontextlost", (e) =>
            e.preventDefault()
          );
        }}
      >
        <ResponsiveCamera />
        <Particles />
      </Canvas>
    </div>
  );
}
