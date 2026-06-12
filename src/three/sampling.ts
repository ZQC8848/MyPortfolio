import * as THREE from "three";
import { PARTICLES, type ShapeKeyframe } from "../config";

/**
 * Loads a pre-baked point bank: a raw Float32Array of xyz triplets,
 * unit-sized and centered, produced offline by scripts/bake-points.mjs.
 * Sampling the multi-megabyte OBJs happens at bake time, not in the
 * browser — the .bin files are ~200KB each.
 */
export class PointBankLoader extends THREE.Loader<Float32Array> {
  load(
    url: string,
    onLoad: (bank: Float32Array) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (err: unknown) => void
  ): void {
    const loader = new THREE.FileLoader(this.manager);
    loader.setResponseType("arraybuffer");
    loader.setPath(this.path);
    loader.load(
      url,
      (buffer) => onLoad(new Float32Array(buffer as ArrayBuffer)),
      onProgress,
      onError
    );
  }
}

/**
 * Expand a unit-sized bank to `count` particle positions at world scale.
 * Banks are stored in random order, so taking the first `count` points is a
 * uniform subsample; if `count` exceeds the bank, points repeat (stacked
 * points are invisible under additive blending at this density).
 */
export function bankToShape(
  src: Float32Array,
  count: number,
  size: number = PARTICLES.modelSize
): Float32Array {
  const total = Math.floor(src.length / 3);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const k = (i % total) * 3;
    out[i * 3] = src[k] * size;
    out[i * 3 + 1] = src[k + 1] * size;
    out[i * 3 + 2] = src[k + 2] * size;
  }
  return out;
}

/**
 * Bake a keyframe's scale into a copy of the shape bank. Rotation and
 * position offsets are NOT baked — they're applied per-frame at the object
 * level (interpolated between keyframes), so they stay fixed in screen space
 * instead of being swung around by the idle Y-spin. Returns the original
 * array untouched when scale is 1, so plain keyframes share memory.
 */
export function applyKeyframeScale(
  src: Float32Array,
  kf: ShapeKeyframe
): Float32Array {
  const scale = kf.scale ?? 1;
  if (scale === 1) return src;
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) out[i] = src[i] * scale;
  return out;
}

/** Keyframe rotation offset as a quaternion (identity when unset). */
export function keyframeQuaternion(kf: ShapeKeyframe): THREE.Quaternion {
  const q = new THREE.Quaternion();
  if (kf.rotateAxis && kf.rotateAngle) {
    q.setFromAxisAngle(
      new THREE.Vector3(...kf.rotateAxis).normalize(),
      kf.rotateAngle
    );
  }
  return q;
}

/** Procedural random scatter — the "explode" morph target. */
export function explodePositions(
  count: number,
  spreadMultiplier: number = PARTICLES.explodeSpread
): Float32Array {
  const spread = PARTICLES.modelSize * spreadMultiplier;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3] = (Math.random() - 0.5) * spread;
    out[i * 3 + 1] = (Math.random() - 0.5) * spread;
    out[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  return out;
}
