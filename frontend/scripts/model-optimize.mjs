// 3D-модель для hero: src/assets/media/2017_lamborghini_huracan_lp580-2 (2).glb → public/models/huracan.glb.
// Запуск: node scripts/model-optimize.mjs
//
// - убираем то, чего не видно с ракурса 3/4 спереди: двигатель, днище, выхлоп (салон оставляем — виден сквозь стекло);
// - нормализуем: длина 4.5 (метры), колёса на y = 0, центр по x/z в начале координат, перёд — в +Z, верх — +Y;
// - имена материалов сохраняем (палитры не склеиваем): краску, стёкла и фары настраивает src/visual/car3d.js;
// - сварка, дедупликация, мягкое упрощение (колёса и салон — сильнее: в hero они мелкие), текстуры → WebP ≤ 512,
//   геометрия → meshopt (level high: квантование + фильтры нормалей).
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, getBounds, meshopt, prune, resample, simplifyPrimitive, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SRC = path.join(root, 'src/assets/media/2017_lamborghini_huracan_lp580-2 (2).glb')
const OUT = path.join(root, 'public/models/huracan.glb')
const LENGTH = 4.5
// невидимое с выбранного ракурса
const HIDDEN = /Engine5_|Chassis_Mesh|BumperChassis|FendersChassis|Exhausts6/

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read(SRC)
const stat = (label) => {
  let tris = 0
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3
  console.log(`${label}: ${Math.round(tris)} треугольников, ${doc.getRoot().listMeshes().length} мешей, ${doc.getRoot().listTextures().length} текстур`)
}
stat('исходник')

for (const n of doc.getRoot().listNodes()) if (n.getMesh() && HIDDEN.test(n.getName())) n.dispose()

// нормализация: оборачиваем сцену в узел с масштабом и сдвигом
const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]
const b = getBounds(scene)
const k = LENGTH / (b.max[2] - b.min[2])
const wrap = doc.createNode('huracan')
  .setScale([k, k, k])
  .setTranslation([-(b.min[0] + b.max[0]) / 2 * k, -b.min[1] * k, -(b.min[2] + b.max[2]) / 2 * k])
for (const c of scene.listChildren()) { scene.removeChild(c); wrap.addChild(c) }
scene.addChild(wrap)

await doc.transform(prune(), dedup(), resample(), weld())

// колёса и салон: с ракурса hero это мелкие детали — упрощаем сильнее, остальное мягко
const SMALL = /Tire_Calipers|Interior_Mesh|SteeringWheel/
for (const mesh of doc.getRoot().listMeshes()) {
  const strong = SMALL.test(mesh.getName())
  for (const prim of mesh.listPrimitives()) {
    simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: strong ? 0.35 : 0.75, error: strong ? 0.002 : 0.0005 })
  }
}

await doc.transform(
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 78 }),
  meshopt({ encoder: MeshoptEncoder, level: 'high' }),
)
stat('результат')
const nb = getBounds(scene)
console.log('габариты (м):', nb.min.map((v) => v.toFixed(2)).join(' '), '→', nb.max.map((v) => v.toFixed(2)).join(' '))
await io.write(OUT, doc)
const fs = await import('node:fs')
console.log(`${path.relative(root, OUT)}: ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} МБ (исходник ${(fs.statSync(SRC).size / 1024 / 1024).toFixed(2)} МБ)`)
