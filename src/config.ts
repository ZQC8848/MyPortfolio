/**
 * Every tunable knob for the particle background lives here.
 * Tweak values in this file only — components read, never define, them.
 */

/** OBJ models available as morph targets (served from /public).
 *  Paths must be absolute — relative paths break on nested routes
 *  like /project/:slug. */
export const MODELS = {
  quest3: "/models/meta_quest_3.obj",
  david: "/models/David.obj",
  fightOn: "/models/FightOn.obj",
  rocket: "/models/rocket.obj",
} as const;

export type ShapeName = keyof typeof MODELS | "explode";

/** One stop along the scroll-driven morph. */
export interface ShapeKeyframe {
  shape: ShapeName;
  /**
   * Scroll progress (0–1) at which the cloud has fully contracted into this
   * shape. Prefer `anchor` for shapes that must sync with a page section —
   * fixed fractions only hold for one layout, and section positions shift
   * with viewport width. Omit entirely (e.g. on "explode" fillers) to get
   * the midpoint between the neighbouring keyframes.
   */
  at?: number;
  /**
   * CSS selector of the section this shape syncs to (e.g. "#about"). The
   * actual progress is measured from the element's real position and
   * re-measured on resize, so it stays correct on any viewport. When the
   * element is missing (other routes), `at` is used as fallback.
   */
  anchor?: string;
  /**
   * Where the anchored element's top edge sits (as a fraction of viewport
   * height, 0 = top) at the moment the shape is fully formed. Default 0.1 —
   * "section heading just arrived at the top of the screen".
   */
  anchorViewport?: number;
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
  /** Size multiplier on top of PARTICLES.modelSize (1 = unchanged). */
  scale?: number;
}

/**
 * Shapes the cloud morphs through, top of page → bottom.
 * Offsets are baked per keyframe, so the same model can appear twice with
 * different orientation/position/size.
 */
export const SHAPE_KEYFRAMES: readonly ShapeKeyframe[] = [
  { shape: "david", at: 0 },
  { shape: "explode" },
  { shape: "quest3", anchor: "#about", at: 0.4, offset: [2, 0, 0] },
  { shape: "explode" },
  {
    shape: "rocket",
    at: 1,
    offset: [9, 0, 0],
    rotateAxis: [0, 0, 1],
    rotateAngle: -0.32,
  },
];

export const PARTICLES = {
  /** Point count on desktop / small screens. */
  count: 15000,
  countMobile: 7000,
  /** Base point size (scaled by depth + pixel ratio in the vertex shader). */
  size: 42,
  /** Models are normalized so their largest dimension equals this. */
  modelSize: 22,
  /** Random-scatter radius multiplier for the "explode" shape. */
  explodeSpread: 2.2,
  colorA: "#6ea8fe",
  colorB: "#c084fc",
  /** How quickly the morph chases the scroll position (higher = snappier). */
  damp: 4,
  /** Idle rotation speed, radians/second. */
  idleRotation: 0.06,
  /**
   * Starting Y rotation (radians). A 3/4 view reads much better than a
   * head-on one for shapes like the headset, whose front-on silhouette
   * is a low-density blob.
   */
  initialRotationY: 0.7,
} as const;

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
