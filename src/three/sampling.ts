import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { PARTICLES } from "../config";

/** Scale a geometry so its largest dimension equals `targetSize`, centered at origin. */
export function normalizeGeometry(
  geometry: THREE.BufferGeometry,
  targetSize: number = PARTICLES.modelSize
): void {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox!.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const s = targetSize / maxDim;
    geometry.scale(s, s, s);
  }
  geometry.center();
}

/** Sample `count` points uniformly off a mesh surface. */
function sampleSurface(mesh: THREE.Mesh, count: number): Float32Array {
  const sampler = new MeshSurfaceSampler(mesh).build();
  const out = new Float32Array(count * 3);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(tmp);
    out.set([tmp.x, tmp.y, tmp.z], i * 3);
  }
  return out;
}

/** Pick `count` vertices from a position attribute (point-cloud OBJs have no faces). */
function sampleVertices(
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  count: number
): Float32Array {
  const total = position.count;
  const out = new Float32Array(count * 3);
  if (count <= total) {
    // Partial Fisher–Yates: even coverage without duplicate points.
    const idx = new Uint32Array(total);
    for (let i = 0; i < total; i++) idx[i] = i;
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(Math.random() * (total - i));
      const t = idx[i];
      idx[i] = idx[j];
      idx[j] = t;
      const k = idx[i];
      out[i * 3] = position.getX(k);
      out[i * 3 + 1] = position.getY(k);
      out[i * 3 + 2] = position.getZ(k);
    }
  } else {
    // Fewer vertices than particles: reuse vertices (stacked points are invisible
    // under additive blending at this density).
    for (let i = 0; i < count; i++) {
      const k = i % total;
      out[i * 3] = position.getX(k);
      out[i * 3 + 1] = position.getY(k);
      out[i * 3 + 2] = position.getZ(k);
    }
  }
  return out;
}

/**
 * Turn a loaded OBJ into `count` normalized particle positions.
 * Meshes (OBJs with faces) get uniform surface sampling; face-less OBJs load
 * as THREE.Points / THREE.LineSegments and have their vertices sampled directly.
 */
export function shapeFromObj(obj: THREE.Object3D, count: number): Float32Array {
  let mesh: THREE.Mesh | null = null;
  let cloud: THREE.BufferGeometry | null = null;
  obj.traverse((c) => {
    if ((c as THREE.Mesh).isMesh && !mesh) {
      mesh = c as THREE.Mesh;
    } else if (
      ((c as THREE.Points).isPoints || (c as THREE.LineSegments).isLineSegments) &&
      !cloud
    ) {
      cloud = (c as THREE.Points).geometry;
    }
  });

  if (mesh) {
    const m = mesh as THREE.Mesh;
    normalizeGeometry(m.geometry);
    return sampleSurface(m, count);
  }
  if (cloud) {
    const geo = cloud as THREE.BufferGeometry;
    normalizeGeometry(geo);
    return sampleVertices(geo.attributes.position, count);
  }
  throw new Error("OBJ contains no usable geometry (no mesh, points, or lines)");
}

/** Procedural random scatter — the "explode" morph target. */
export function explodePositions(count: number): Float32Array {
  const spread = PARTICLES.modelSize * PARTICLES.explodeSpread;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3] = (Math.random() - 0.5) * spread;
    out[i * 3 + 1] = (Math.random() - 0.5) * spread;
    out[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  return out;
}
