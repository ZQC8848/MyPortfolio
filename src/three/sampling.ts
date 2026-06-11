import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { PARTICLES } from "../config";

/** First mesh found inside a loaded OBJ group. Throws if none exists. */
export function firstMesh(obj: THREE.Object3D): THREE.Mesh {
  let mesh: THREE.Mesh | null = null;
  obj.traverse((c) => {
    if ((c as THREE.Mesh).isMesh && !mesh) mesh = c as THREE.Mesh;
  });
  if (!mesh) throw new Error("No mesh found in OBJ");
  return mesh;
}

/** Scale a mesh so its largest dimension equals `targetSize`, centered at origin. */
export function normalizeMesh(
  mesh: THREE.Mesh,
  targetSize: number = PARTICLES.modelSize
): void {
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
export function samplePoints(mesh: THREE.Mesh, count: number): Float32Array {
  const sampler = new MeshSurfaceSampler(mesh).build();
  const out = new Float32Array(count * 3);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(tmp);
    out.set([tmp.x, tmp.y, tmp.z], i * 3);
  }
  return out;
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
