import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  AMBIENT_PARTICLES,
  CAMERA,
  MODELS,
  PARTICLES,
  POINTER_FX,
  SHAPE_KEYFRAMES,
  getDprRange,
  getParticleCount,
  isHoverPointer,
  isMobileViewport,
  prefersReducedMotion,
} from "../config";
import { useScrollProgress } from "../lib/ScrollContext";
import { particleFragmentShader, particleVertexShader } from "./shaders";
import {
  PointBankLoader,
  applyKeyframeScale,
  bankToShape,
  explodePositions,
  keyframeQuaternion,
} from "./sampling";
import { resolveTimeline, type Timeline } from "./timeline";

const MODEL_KEYS = Object.keys(MODELS) as (keyof typeof MODELS)[];
const MODEL_PATHS = MODEL_KEYS.map((k) => MODELS[k]);

/**
 * Normalized pointer position (-1..1, +y up), tracked on window because the
 * canvas itself is pointer-events: none. Module-level singleton: one
 * listener feeds every consumer (camera sway, repulsion ray). null until
 * the pointer first moves and again whenever it leaves the window, and
 * never activates on touch / reduced-motion — so the effects it drives are
 * simply inert there.
 */
const pointerNDC: { current: THREE.Vector2 | null } = { current: null };
let pointerUsers = 0;

const onPointerMove = (e: PointerEvent) => {
  (pointerNDC.current ??= new THREE.Vector2()).set(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
};
const onPointerGone = () => {
  pointerNDC.current = null;
};

function useWindowPointer() {
  useEffect(() => {
    if (!isHoverPointer() || prefersReducedMotion()) return;
    if (pointerUsers++ === 0) {
      window.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerleave", onPointerGone);
      window.addEventListener("blur", onPointerGone);
    }
    return () => {
      if (--pointerUsers === 0) {
        window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerleave", onPointerGone);
        window.removeEventListener("blur", onPointerGone);
      }
    };
  }, []);
  return pointerNDC;
}

/**
 * Pulls the camera back on narrow/portrait viewports so the model fits,
 * and sways it gently toward the pointer (damped) for a parallax feel.
 */
function ResponsiveCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const pointer = useWindowPointer();

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

  useFrame((_, delta) => {
    const p = pointer.current;
    if (!p) return;
    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      p.x * POINTER_FX.sway[0],
      POINTER_FX.swayDamp,
      delta
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      CAMERA.height + p.y * POINTER_FX.sway[1],
      POINTER_FX.swayDamp,
      delta
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/** Far-away default so the repulsion term is zero until the pointer moves. */
const MOUSE_PARKED = new THREE.Vector3(1e6, 1e6, 1e6);

/**
 * Repulsion-ray uniform values, shared by reference: every particle
 * material points its uRayOrigin/uRayDir at these vectors, so PointerRay's
 * single raycast per frame drives any number of clouds.
 */
const sharedRay = {
  origin: MOUSE_PARKED.clone(),
  dir: new THREE.Vector3(0, 0, -1),
};

/** Casts the camera→cursor ray; parks the field when the pointer leaves. */
function PointerRay() {
  const pointer = useWindowPointer();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  useFrame((state) => {
    if (pointer.current) {
      raycaster.setFromCamera(pointer.current, state.camera);
      sharedRay.origin.copy(raycaster.ray.origin);
      sharedRay.dir.copy(raycaster.ray.direction);
    } else {
      sharedRay.origin.copy(MOUSE_PARKED);
    }
  });
  return null;
}

/**
 * Sparse, never-morphing explode scatter behind the main cloud — a cheap
 * depth layer for the home page. Same shader, fewer/wider/smaller points.
 * It spins from both time and scroll, around an axis that slowly precesses
 * about vertical, so the starfield drifts instead of turning like a disc.
 */
function AmbientScatter() {
  const scroll = useScrollProgress();
  const pointsRef = useRef<THREE.Points>(null!);
  const spin = useRef(0);
  const precession = useRef(0);
  const axis = useRef(new THREE.Vector3(0, 1, 0));
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const count = useMemo(
    () =>
      isMobileViewport()
        ? AMBIENT_PARTICLES.countMobile
        : AMBIENT_PARTICLES.count,
    []
  );

  const { geometry, uniforms } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        explodePositions(count, AMBIENT_PARTICLES.spread),
        3
      )
    );
    const randoms = new Float32Array(count);
    for (let i = 0; i < count; i++) randoms[i] = Math.random();
    geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    const u = {
      uSize: { value: AMBIENT_PARTICLES.size },
      uSizeRange: { value: new THREE.Vector2(...PARTICLES.sizeRange) },
      uPixelRatio: { value: 1 }, // synced per-frame to the real renderer DPR
      uColorA: { value: new THREE.Color(PARTICLES.colorA) },
      uColorB: { value: new THREE.Color(PARTICLES.colorB) },
      uRayOrigin: { value: sharedRay.origin },
      uRayDir: { value: sharedRay.dir },
      uMouseRadius: { value: POINTER_FX.repelRadius },
      uMouseStrength: { value: POINTER_FX.repelStrength },
      uTime: { value: 0 },
    };
    return { geometry: geo, uniforms: u };
  }, [count]);

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uPixelRatio.value = state.viewport.dpr;

    if (reducedMotion) return;
    // Idle counter-spin plus a scroll-coupled term; the spin axis itself
    // precesses around vertical at its own slow rate.
    spin.current -= delta * AMBIENT_PARTICLES.rotation;
    precession.current += delta * AMBIENT_PARTICLES.axisPrecession;
    const angle =
      spin.current + scroll.current * AMBIENT_PARTICLES.scrollRotation;
    const tilt = AMBIENT_PARTICLES.axisTilt;
    axis.current
      .set(
        Math.sin(precession.current) * tilt,
        1,
        Math.cos(precession.current) * tilt
      )
      .normalize();
    pointsRef.current.quaternion.setFromAxisAngle(axis.current, angle);
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Particles({ routeKey }: { routeKey: string }) {
  const scroll = useScrollProgress();
  const groupRef = useRef<THREE.Group>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const swingTime = useRef(0);
  const spin = useRef(0);
  const progress = useRef(0);
  const lastWritten = useRef(-1);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const count = useMemo(() => getParticleCount(), []);
  const timeline = useRef<Timeline | null>(null);

  const loaded = useLoader(PointBankLoader, MODEL_PATHS);

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
      bank[key] = bankToShape(loaded[i], count);
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
    const posAttr = new THREE.BufferAttribute(new Float32Array(seq[0]), 3);
    // Rewritten on every morph frame — tell the driver up front.
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", posAttr);
    geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    const u = {
      uSize: { value: PARTICLES.size },
      uSizeRange: {
        value: new THREE.Vector2(...PARTICLES.sizeRange),
      },
      uPixelRatio: { value: 1 }, // synced per-frame to the real renderer DPR
      uColorA: { value: new THREE.Color(PARTICLES.colorA) },
      uColorB: { value: new THREE.Color(PARTICLES.colorB) },
      uRayOrigin: { value: sharedRay.origin },
      uRayDir: { value: sharedRay.dir },
      uMouseRadius: { value: POINTER_FX.repelRadius },
      uMouseStrength: { value: POINTER_FX.repelStrength },
      uTime: { value: 0 },
    };
    return { geometry: geo, uniforms: u, shapes: seq, quaternions: quats };
  }, [loaded, count]);

  useFrame((state, delta) => {
    if (!timeline.current) return;
    const { stops, offsets } = timeline.current;

    // Per-frame uniforms, before the scroll early-out (hovering and DPR
    // changes must apply while the page is still). The repulsion ray
    // vectors are shared by reference — PointerRay already updated them.
    uniforms.uTime.value += delta;
    uniforms.uPixelRatio.value = state.viewport.dpr;

    // Chase the scroll position (instantly under reduced motion).
    progress.current = reducedMotion
      ? scroll.current
      : THREE.MathUtils.damp(progress.current, scroll.current, PARTICLES.damp, delta);

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

    // Idle motion. Models rock back and forth (eased sine swing, bounded
    // angle); the explode scatter keeps a continuous spin instead. The two
    // cross-fade by the segment's explode weight `e`, and leftover spin
    // unwinds via the shortest path (±2π is the same orientation) so a
    // model always re-forms at its designed angle. Skipped under reduced
    // motion.
    if (!reducedMotion) {
      const e0 = SHAPE_KEYFRAMES[k0].shape === "explode" ? 1 : 0;
      const e1 = SHAPE_KEYFRAMES[k1].shape === "explode" ? 1 : 0;
      const e = e0 + (e1 - e0) * t;
      swingTime.current += delta;
      if (e > 0) spin.current += delta * PARTICLES.explodeRotation * e;
      if (e < 1) {
        spin.current -= Math.round(spin.current / (2 * Math.PI)) * 2 * Math.PI;
        spin.current = THREE.MathUtils.damp(spin.current, 0, 4 * (1 - e), delta);
      }
      pointsRef.current.rotation.y =
        PARTICLES.initialRotationY +
        spin.current +
        Math.sin((swingTime.current * Math.PI * 2) / PARTICLES.swingPeriod) *
          PARTICLES.swingAmplitude *
          (1 - e);
    }

    // Early-out: don't rewrite/re-upload 45k floats while scroll is idle.
    if (Math.abs(progress.current - lastWritten.current) < 1e-4) return;
    lastWritten.current = progress.current;

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
        <PointerRay />
        <Particles routeKey={pathname} />
        {pathname === "/" && <AmbientScatter />}
      </Canvas>
    </div>
  );
}
