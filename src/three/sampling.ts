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
      (buffer) => {
        // Guard against silent garbage: an SPA fallback serves index.html
        // with HTTP 200 for a missing .bin, and HTML bytes would "parse"
        // into a Float32Array just fine. Banks are unit-sized (|coord| ≲
        // 0.5), so real data is cheap to verify.
        const buf = buffer as ArrayBuffer;
        let valid = buf.byteLength > 0 && buf.byteLength % 12 === 0;
        if (valid) {
          const arr = new Float32Array(buf);
          for (let i = 0; i < arr.length; i++) {
            if (!Number.isFinite(arr[i]) || Math.abs(arr[i]) > 4) {
              valid = false;
              break;
            }
          }
          if (valid) {
            onLoad(arr);
            return;
          }
        }
        onError?.(
          new Error(
            `PointBankLoader: "${url}" is not a point bank (${buf.byteLength} bytes) — ` +
              `missing file served as HTML by an SPA fallback? Check the path in MODELS and re-run \`npm run bake\`.`
          )
        );
      },
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

/** Keyframe rotation offset as a quaternion (identity when unset). */
export function keyframeQuaternion(kf: ShapeKeyframe): THREE.Quaternion {
  const q = new THREE.Quaternion();
  const hasAxis = kf.rotateAxis !== undefined;
  const hasAngle = kf.rotateAngle !== undefined;
  // config.ts is a hand-edited DSL — half a rotation is a typo, not intent.
  if (hasAxis !== hasAngle) {
    console.warn(
      `[particles] keyframe "${kf.shape}": rotateAxis and rotateAngle must be set together — rotation ignored`
    );
    return q;
  }
  if (hasAxis && hasAngle) {
    q.setFromAxisAngle(
      new THREE.Vector3(...kf.rotateAxis!).normalize(),
      kf.rotateAngle!
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
