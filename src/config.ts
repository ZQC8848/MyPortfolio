/**
 * Every tunable knob for the particle background lives here.
 * Tweak values in this file only — components read, never define, them.
 */

/**
 * Pre-baked point banks available as morph targets (served from /public).
 * Each .bin is a raw Float32Array of xyz triplets sampled offline from the
 * source OBJ in assets-src/models/ — run `npm run bake` after changing a
 * model there. Paths must be absolute — relative paths break on nested
 * routes like /project/:slug.
 */
export const MODELS = {
  quest3: "/points/meta_quest_3.bin",
  david: "/points/David.bin",
  fightOn: "/points/FightOn.bin",
  rocket: "/points/rocket.bin",
} as const;

export type ShapeName = keyof typeof MODELS | "explode";

/** One stop along the scroll-driven morph. */
export interface ShapeKeyframe {
  shape: ShapeName;
  /**
   * CSS selector of the section this shape syncs to (e.g. "#about"). The
   * actual progress is measured from the element's real position and
   * re-measured on resize, so it stays correct on any viewport. On pages
   * missing any anchored element (e.g. /project/:slug), the background
   * falls back to a static "explode" scatter instead of the morph timeline.
   * Keyframes without an anchor are spaced automatically: first at the page
   * top, last at the bottom, middles evenly between their neighbours.
   */
  anchor?: string;
  /**
   * Where the anchored element's top edge sits (as a fraction of viewport
   * height, 0 = top) at the moment the shape is fully formed. Default 0.1 —
   * "section heading just arrived at the top of the screen".
   */
  anchorViewport?: number;
  /**
   * How long the fully-formed shape lingers before morphing on, as a
   * fraction of total page scroll (0.1 = stays converged for 10% of the
   * scroll). Anchored shapes hold from their anchor point onward; the
   * first/last keyframes hold at the page top/bottom. Default 0.
   */
  hold?: number;
  /**
   * Rotation offset: axis (auto-normalized) + angle in radians. Applied in
   * screen space on top of the idle spin, so e.g. a Z-axis tilt stays a
   * constant on-screen lean while the shape keeps spinning underneath.
   */
  rotateAxis?: readonly [number, number, number];
  rotateAngle?: number;
  /**
   * World-space position offset (+x right, +y up). Applied at the object
   * level, so the idle spin never swings it around.
   */
  offset?: readonly [number, number, number];
  /** Overrides `offset` below MOBILE_BREAKPOINT. */
  offsetMobile?: readonly [number, number, number];
  /**
   * Size multiplier on top of PARTICLES.modelSize (1 = unchanged). Like
   * `offset`, it's interpolated per-frame at the object level, so resizing
   * across the breakpoint takes effect instantly.
   */
  scale?: number;
  /** Overrides `scale` below MOBILE_BREAKPOINT. */
  scaleMobile?: number;
}

/**
 * Shapes the cloud morphs through, top of page → bottom.
 * Offsets are baked per keyframe, so the same model can appear twice with
 * different orientation/position/size.
 */
export const SHAPE_KEYFRAMES: readonly ShapeKeyframe[] = [
  { shape: "david", hold: 0.04 ,scale:0.9,scaleMobile:1.5},
  { shape: "explode" },
  { shape: "quest3", anchor: "#about", hold: 0.12, offset: [4.5, 4, 0] , scale:0.6 ,offsetMobile: [0,0,0] ,scaleMobile:1.2},
  { shape: "explode", hold:0.12 },
  {
    shape: "rocket",
    hold: 0.08,
    offset: [9, 0, 0],
    rotateAxis: [0, 0, 1],
    rotateAngle: -0.32,
    scaleMobile: 1.5
  },
];

export const PARTICLES = {
  /** Point count on desktop / small screens. */
  count: 15000,
  countMobile: 7000,
  /** Base point size (scaled by depth + pixel ratio in the vertex shader). */
  size: 42,
  /**
   * Per-particle random size interval, as multipliers of `size`: each
   * particle gets a random factor in [min, max]. [1, 1] = uniform points;
   * widen the interval for a more organic, dusty look.
   */
  sizeRange: [1.2, 2.4],
  /** Models are normalized so their largest dimension equals this. */
  modelSize: 22,
  /** Random-scatter radius multiplier for the "explode" shape. */
  explodeSpread: 2.2,
  colorA: "#6ea8fe",
  colorB: "#c084fc",
  /** How quickly the morph chases the scroll position (higher = snappier). */
  damp: 4,
  /**
   * Idle motion: instead of spinning full circles, the cloud rocks back and
   * forth around its base orientation. The swing follows a sine curve, so
   * angular speed is eased — slowest at the two extremes, fastest through
   * the middle. Amplitude is radians to EACH side of initialRotationY.
   */
  swingAmplitude: 0.4,
  /** Seconds for one full back-and-forth swing cycle. */
  swingPeriod: 24,
  /**
   * The "explode" scatter ignores the swing and keeps a continuous spin
   * instead (radians/second). The two motions cross-fade during morphs,
   * and leftover spin unwinds invisibly (mod 2π) as a model re-forms.
   */
  explodeRotation: 0.06,
  /**
   * Base Y rotation (radians), the centre of the swing. A 3/4 view reads
   * much better than a head-on one for shapes like the headset, whose
   * front-on silhouette is a low-density blob.
   */
  initialRotationY: 0.5,
} as const;

/**
 * A second, sparser always-on explode scatter rendered behind the morphing
 * cloud on the home page — a cheap depth/starfield layer. It never morphs.
 */
export const AMBIENT_PARTICLES = {
  count: 1200,
  countMobile: 600,
  /** Base point size (same depth/pixel-ratio scaling as the main cloud). */
  size: 120,
  /** Scatter radius multiplier of modelSize — wider than the main explode. */
  spread: 3.6,
  /** Slow counter-rotation, radians/second. */
  rotation: 0.02,
  /** Extra rotation driven by scrolling, radians over the full page scroll. */
  scrollRotation: 1.4,
  /** Tilt of the spin axis away from vertical, radians (0 = pure Y spin). */
  axisTilt: 0.45,
  /** How fast the tilted axis precesses around vertical, radians/second. */
  axisPrecession: 0.05,
} as const;

/**
 * Pointer interaction — only active on hover-capable fine pointers (i.e.
 * desktop mice, not touch) and disabled under prefers-reduced-motion.
 * Both effects are near-free: repulsion runs in the vertex shader, sway is
 * a couple of damped floats per frame.
 */
export const POINTER_FX = {
  /**
   * Radius of the repulsion field, in world units around the camera→cursor
   * ray. The field is a cylinder cast from the camera through the cursor:
   * whatever the cursor covers reacts at every depth (perspective-correct),
   * in both the main cloud and the ambient backdrop.
   */
  repelRadius: 10,
  /** How far (world units) particles get pushed at the cursor centre. */
  repelStrength: 0.5,
  /** Camera sway amplitude in world units: [horizontal, vertical]. */
  sway: [1.6, 1.0],
  /** How quickly the camera chases the pointer (damp lambda). */
  swayDamp: 2.5,
} as const;

/** True for devices with a mouse-like pointer (hover + precision). */
export function isHoverPointer(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export const CAMERA = {
  fov: 45,
  height: 4,
  /** Default camera distance (landscape). */
  distance: 30,
  /**
   * Minimum world-units of horizontal width the camera must frame; on
   * narrow/portrait screens the camera pulls back so the model still fits.
   */
  fitWidth: 38,
} as const;

/** Breakpoint below which mobile particle settings apply. */
export const MOBILE_BREAKPOINT = 768;

export function isMobileViewport(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function getParticleCount(): number {
  return isMobileViewport() ? PARTICLES.countMobile : PARTICLES.count;
}

/** Cap device pixel ratio harder on mobile GPUs. */
export function getDprRange(): [number, number] {
  return [1, isMobileViewport() ? 1.5 : 2];
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
