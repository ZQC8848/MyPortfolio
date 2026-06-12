import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
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
  isMobileViewport,
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

type Vec3 = readonly [number, number, number];

/** One point on the resolved timeline: progress `at` shows keyframe `kf`. */
interface TimelineStop {
  at: number;
  kf: number;
}
interface Timeline {
  stops: TimelineStop[];
  offsets: Vec3[];
}

/**
 * Resolve the morph timeline for the CURRENT layout. Each keyframe becomes
 * an [enter, exit] pair — the shape is fully formed at `enter` and starts
 * dissolving at `exit = enter + hold`. Anchored keyframes measure `enter`
 * from their element's real document position (correct on any viewport
 * width); unanchored ones are spaced into the surrounding gaps. If any
 * anchored element is missing (e.g. on /project/:slug), the page doesn't
 * have the sections this timeline is choreographed around, so the
 * background falls back to a static explode scatter.
 */
function resolveTimeline(): Timeline {
  const kfs = SHAPE_KEYFRAMES;
  const n = kfs.length;
  const mobile = isMobileViewport();
  const offsets = kfs.map<Vec3>(
    (kf) => (mobile ? kf.offsetMobile ?? kf.offset : kf.offset) ?? [0, 0, 0]
  );
  const hold = (i: number) => kfs[i].hold ?? 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  const enter: (number | null)[] = new Array(n).fill(null);
  const exit: (number | null)[] = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const sel = kfs[i].anchor;
    if (!sel) continue;
    const el = document.querySelector(sel);
    if (!el || maxScroll <= 0) {
      const e = Math.max(kfs.findIndex((k) => k.shape === "explode"), 0);
      return {
        stops: [
          { at: 0, kf: e },
          { at: 1, kf: e },
        ],
        offsets,
      };
    }
    const top = el.getBoundingClientRect().top + window.scrollY;
    const target = top - (kfs[i].anchorViewport ?? 0.1) * window.innerHeight;
    enter[i] = THREE.MathUtils.clamp(target / maxScroll, 0, 1);
    exit[i] = enter[i]! + hold(i);
  }

  // Unanchored endpoints hold at the page edges.
  if (enter[0] === null) {
    enter[0] = 0;
    exit[0] = hold(0);
  }
  if (enter[n - 1] === null) {
    exit[n - 1] = 1;
    enter[n - 1] = 1 - hold(n - 1);
  }
  // Unanchored middles: split the gap between the surrounding resolved
  // keyframes into equal morph transitions, reserving room for holds.
  for (let i = 1; i < n - 1; i++) {
    if (enter[i] !== null) continue;
    let j = i + 1;
    while (enter[j] === null) j++;
    let holdSum = 0;
    for (let k = i; k < j; k++) holdSum += hold(k);
    const gap = enter[j]! - exit[i - 1]!;
    const morph = Math.max(gap - holdSum, 0) / (j - i + 1);
    let cursor = exit[i - 1]!;
    for (let k = i; k < j; k++) {
      enter[k] = cursor + morph;
      exit[k] = enter[k]! + hold(k);
      cursor = exit[k]!;
    }
  }

  // Flatten to a non-decreasing stop list (anchors can land out of order).
  const stops: TimelineStop[] = [];
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const e0 = Math.max(enter[i]!, prev);
    const e1 = Math.max(exit[i]!, e0);
    stops.push({ at: e0, kf: i }, { at: e1, kf: i });
    prev = e1;
  }
  return { stops, offsets };
}

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

function Particles({ routeKey }: { routeKey: string }) {
  const scroll = useScrollProgress();
  const groupRef = useRef<THREE.Group>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const progress = useRef(0);
  const lastWritten = useRef(-1);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const count = useMemo(() => getParticleCount(), []);
  const timeline = useRef<Timeline | null>(null);

  const loaded = useLoader(OBJLoader, MODEL_PATHS);

  // Measure anchored keyframes against the live layout, and re-measure when
  // the route, the viewport, or the document height changes (resize, images
  // loading) — this is what keeps the sync correct on mobile widths and
  // switches project pages to the explode-only fallback.
  useEffect(() => {
    const update = () => {
      timeline.current = resolveTimeline();
      lastWritten.current = -1; // force a rewrite with the new timing
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(document.body);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [routeKey]);

  const { geometry, uniforms, shapes, quaternions } = useMemo(() => {
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
      uSizeRange: {
        value: new THREE.Vector2(...PARTICLES.sizeRange),
      },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColorA: { value: new THREE.Color(PARTICLES.colorA) },
      uColorB: { value: new THREE.Color(PARTICLES.colorB) },
    };
    return { geometry: geo, uniforms: u, shapes: seq, quaternions: quats };
  }, [loaded, count]);

  useFrame((_, delta) => {
    if (!timeline.current) return;
    const { stops, offsets } = timeline.current;

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

    // Find the stop segment containing the current progress (the resolved
    // stops are ascending). Between a keyframe's enter/exit stops both ends
    // are the same shape — that's the hold.
    const f = THREE.MathUtils.clamp(progress.current, 0, 1);
    let s = 0;
    for (let i = stops.length - 2; i >= 0; i--) {
      if (f >= stops[i].at) {
        s = i;
        break;
      }
    }
    const a0 = stops[s].at;
    const a1 = stops[s + 1].at;
    const t = THREE.MathUtils.smoothstep(
      a1 > a0 ? (f - a0) / (a1 - a0) : 1,
      0,
      1
    );
    const k0 = stops[s].kf;
    const k1 = stops[s + 1].kf;

    // Keyframe offsets live on the outer group (screen space): position is
    // lerped, rotation slerped — the inner points' idle spin can't drag them.
    const o0 = offsets[k0];
    const o1 = offsets[k1];
    groupRef.current.position.set(
      o0[0] + (o1[0] - o0[0]) * t,
      o0[1] + (o1[1] - o0[1]) * t,
      o0[2] + (o1[2] - o0[2]) * t
    );
    groupRef.current.quaternion.slerpQuaternions(
      quaternions[k0],
      quaternions[k1],
      t
    );

    const a = shapes[k0];
    const b = shapes[k1];
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
  // Re-resolve the timeline when the route changes — project pages don't
  // have the anchored sections and fall back to the explode scatter.
  const { pathname } = useLocation();
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
        <Particles routeKey={pathname} />
      </Canvas>
    </div>
  );
}
