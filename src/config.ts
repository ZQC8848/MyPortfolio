/**
 * Every tunable knob for the particle background lives here.
 * Tweak values in this file only — components read, never define, them.
 */

/** OBJ models available as morph targets (served from /public).
 *  Paths must be absolute — relative paths break on nested routes
 *  like /project/:slug. */
export const MODELS = {
  queen: "/models/Queen.obj",
  pawn: "/models/Pawn.obj",
} as const;

export type ShapeName = keyof typeof MODELS | "explode";

/** Shapes the cloud morphs through, top of page → bottom. */
export const SHAPE_SEQUENCE: readonly ShapeName[] = [
  "queen",
  "pawn",
  "explode",
  "queen",
];

export const PARTICLES = {
  /** Point count on desktop / small screens. */
  count: 9000,
  countMobile: 4500,
  /** Base point size (scaled by depth + pixel ratio in the vertex shader). */
  size: 26,
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
} as const;

export const CAMERA = {
  fov: 45,
  height: 4,
  /** Default camera distance (landscape). */
  distance: 60,
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
