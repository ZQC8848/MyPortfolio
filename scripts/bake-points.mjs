/**
 * Offline point-cloud baker.
 *
 * Reads every .obj in assets-src/models/, samples COUNT points per model
 * (uniform surface sampling for meshes, vertex sampling for face-less point
 * clouds), normalizes to a unit-sized, centered cloud, and writes the raw
 * Float32Array (xyz triplets) to public/points/<name>.bin.
 *
 * The site loads these banks instead of the multi-megabyte OBJs — runtime
 * scales them by PARTICLES.modelSize, so size stays tunable in config.ts
 * without re-baking.
 *
 * Run with: npm run bake   (re-run whenever a model in assets-src changes)
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

const SRC_DIR = "assets-src/models";
const OUT_DIR = "public/points";
/** Slightly above PARTICLES.count so config has headroom without re-baking. */
const COUNT = 16000;

/** Scale a geometry so its largest dimension equals 1, centered at origin. */
function normalizeGeometry(geometry) {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const s = 1 / maxDim;
    geometry.scale(s, s, s);
  }
  geometry.center();
}

function sampleSurface(mesh, count) {
  const sampler = new MeshSurfaceSampler(mesh).build();
  const out = new Float32Array(count * 3);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(tmp);
    out.set([tmp.x, tmp.y, tmp.z], i * 3);
  }
  return out;
}

/** Partial Fisher–Yates pick of `count` vertices (point-cloud OBJs). */
function sampleVertices(position, count) {
  const total = position.count;
  const out = new Float32Array(count * 3);
  if (count <= total) {
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
    for (let i = 0; i < count; i++) {
      const k = i % total;
      out[i * 3] = position.getX(k);
      out[i * 3 + 1] = position.getY(k);
      out[i * 3 + 2] = position.getZ(k);
    }
  }
  return out;
}

function bake(file) {
  const text = readFileSync(path.join(SRC_DIR, file), "utf8");
  const obj = new OBJLoader().parse(text);

  let mesh = null;
  let cloud = null;
  obj.traverse((c) => {
    if (c.isMesh && !mesh) mesh = c;
    else if ((c.isPoints || c.isLineSegments) && !cloud) cloud = c.geometry;
  });

  let points;
  if (mesh) {
    normalizeGeometry(mesh.geometry);
    points = sampleSurface(mesh, COUNT);
  } else if (cloud) {
    normalizeGeometry(cloud);
    points = sampleVertices(cloud.attributes.position, COUNT);
  } else {
    throw new Error(`${file}: no usable geometry (mesh, points, or lines)`);
  }

  const out = path.join(OUT_DIR, file.replace(/\.obj$/i, ".bin"));
  writeFileSync(out, Buffer.from(points.buffer));
  const kb = Math.round(points.byteLength / 1024);
  console.log(`${file} -> ${out} (${COUNT} pts, ${kb}KB)`);
}

mkdirSync(OUT_DIR, { recursive: true });
const files = readdirSync(SRC_DIR).filter((f) => /\.obj$/i.test(f));
if (files.length === 0) {
  console.error(`No .obj files found in ${SRC_DIR}`);
  process.exit(1);
}
files.forEach(bake);
