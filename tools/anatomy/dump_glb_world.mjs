#!/usr/bin/env node
/**
 * dump_glb_world.mjs — 把 si_scene_v1.glb 每個 node 的頂點換成世界座標（公尺）與三角形索引，輸出 JSON，
 * 給 tools/anatomy/build_si_centerlines.py 估血管中心線用。只讀 glb，不改任何檔。
 * 用法：node tools/anatomy/dump_glb_world.mjs <in.glb> <out.json> --modules /tmp/gl/node_modules
 *   （--modules 指向裝了 @gltf-transform/core、@gltf-transform/extensions、meshoptimizer 的資料夾；不要裝進 repo）
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
const args = process.argv.slice(2);
const mi = args.indexOf('--modules');
const mods = mi >= 0 ? args[mi + 1] : '/tmp/gl/node_modules';
const [inFile, outFile] = args.filter((a, i) => a !== '--modules' && i !== mi + 1);
const imp = (p) => import(pathToFileURL(path.join(mods, p)).href);
const { NodeIO } = await imp('@gltf-transform/core/dist/index.js');
const { ALL_EXTENSIONS } = await imp('@gltf-transform/extensions/dist/index.js');
const { MeshoptDecoder } = await imp('meshoptimizer/index.js');
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(inFile);
const out = {};
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  const M = node.getWorldMatrix(); const P = [], I = []; let base = 0; const v = [0, 0, 0];
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION'), idx = prim.getIndices();
    for (let i = 0; i < pos.getCount(); i++) {
      pos.getElement(i, v); const [x, y, z] = v;
      P.push(M[0] * x + M[4] * y + M[8] * z + M[12], M[1] * x + M[5] * y + M[9] * z + M[13], M[2] * x + M[6] * y + M[10] * z + M[14]);
    }
    if (idx) for (let i = 0; i < idx.getCount(); i++) I.push(idx.getScalar(i) + base);
    base += pos.getCount();
  }
  out[node.getName()] = { P, I };
}
fs.writeFileSync(outFile, JSON.stringify(out));
console.log('nodes', Object.keys(out).length, '->', outFile);
