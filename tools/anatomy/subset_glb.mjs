#!/usr/bin/env node
/**
 * subset_glb.mjs
 * 從既有的 glb 裡只留下名字符合的結構，另存成新的 glb（和 parts json）。不重新簡化、不改座標，所以和原模型完全對得上。
 * 用途：總覽場景只要腦的外形（腦葉、小腦、腦幹、頭頸表面），不要再載入 brain_scene_v1.glb 裡那些和 si_scene 重複的心臟與血管。
 *
 * 需要的 npm 套件（不要裝進 repo，裝在暫存資料夾，例如 /tmp/gl）：
 *   npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
 *
 * 用法：
 *   node tools/anatomy/subset_glb.mjs --in <a.glb> --out <b.glb> --keep '^(brain\.|regions\.head_neck_surface)' \
 *        [--parts-in <a_parts.json> --parts-out <b_parts.json>] [--modules /tmp/gl/node_modules]
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
if (!opt('--in') || !opt('--out') || !opt('--keep')) { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]); process.exit(1); }
const MODULES = opt('--modules');
const ENTRY = {
  '@gltf-transform/core': '@gltf-transform/core/dist/index.js',
  '@gltf-transform/extensions': '@gltf-transform/extensions/dist/index.js',
  '@gltf-transform/functions': '@gltf-transform/functions/dist/index.js',
  'meshoptimizer/decoder': 'meshoptimizer/meshopt_decoder.mjs',
  'meshoptimizer/encoder': 'meshoptimizer/meshopt_encoder.js'
};
const dep = (s) => MODULES ? import(pathToFileURL(path.resolve(MODULES, ENTRY[s])).href) : import(s);
const {NodeIO} = await dep('@gltf-transform/core');
const {ALL_EXTENSIONS, EXTMeshoptCompression, KHRMeshQuantization} = await dep('@gltf-transform/extensions');
const {meshopt, prune} = await dep('@gltf-transform/functions');
const {MeshoptDecoder} = await dep('meshoptimizer/decoder');
const {MeshoptEncoder} = await dep('meshoptimizer/encoder');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const ioRead = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder': MeshoptDecoder});
const ioWrite = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});
const keep = new RegExp(opt('--keep'));
const doc = await ioRead.read(opt('--in'));
let kept = 0, dropped = 0;
for (const n of doc.getRoot().listNodes()) {
  if (!n.getMesh()) continue;
  if (keep.test(n.getName())) kept++; else { n.dispose(); dropped++; }
}
await doc.transform(prune(), meshopt({encoder: MeshoptEncoder, level: 'medium'}));
fs.writeFileSync(opt('--out'), Buffer.from(await ioWrite.writeBinary(doc)));
console.log(`kept ${kept} dropped ${dropped} -> ${opt('--out')} ${(fs.statSync(opt('--out')).size / 1e6).toFixed(2)} MB`);
if (opt('--parts-in') && opt('--parts-out')) {
  const parts = JSON.parse(fs.readFileSync(opt('--parts-in'), 'utf8')).filter((p) => keep.test(p.id));
  fs.writeFileSync(opt('--parts-out'), JSON.stringify(parts));
  console.log(`parts ${parts.length} -> ${opt('--parts-out')}`);
}
