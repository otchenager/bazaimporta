// 3D Lamborghini в hero (three.js). Модуль грузится отдельным чанком — import() из CarArt.jsx сразу при монтировании.
// Модель — public/models/huracan.glb (scripts/model-optimize.mjs, meshopt + WebP).
//
// Появление: шторка сверху вниз. Плоскость отсечения проходит через камеру, поэтому её край на экране — ровная
// горизонталь: выше линии машина уже видна, по линии — оранжевый «сканер».
// Дальше — медленное покачивание и параллакс за курсором ≤ 4° (только мышь). Касания не перехватываем: canvas без
// pointer-events, у контейнера touch-action: pan-y.
// Рендер стоит, когда hero вне экрана или вкладка скрыта. dispose() освобождает всё, включая WebGL-контекст.
import {
  ACESFilmicToneMapping, CanvasTexture, Color, DirectionalLight, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  PerspectiveCamera, PlaneGeometry, Plane, PMREMGenerator, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// Камера: азимут/высота в градусах, дистанция в метрах, fov — вертикальный.
// Кадрирование автоматическое: силуэт машины (выборка вершин) центрируется и вписывается в долю кадра fit — по ширине
// или высоте, что упрётся раньше. Так машина по центру и одного размера относительно контейнера на любом экране.
export const RIG = { az: 40, el: 7, dist: 5, fov: 30, targetY: 0.42, fit: { x: 0.96, y: 0.9 } }
const REVEAL_MS = 1800
const ACCENT = 0xff6a00

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function shadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grd.addColorStop(0, 'rgba(0,0,0,0.85)')
  grd.addColorStop(0.55, 'rgba(0,0,0,0.45)')
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 256, 256)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** Материалы: белая краска с чистыми отражениями, стёкла без transmission (лишний проход рендера). */
function tuneMaterials(root, planes) {
  const paint = new MeshPhysicalMaterial({ color: new Color('#d9dcdf'), metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.85 })
  const glass = new MeshPhysicalMaterial({ color: new Color('#0b0e12'), metalness: 0, roughness: 0.04, transparent: true, opacity: 0.72, envMapIntensity: 1.4 })
  root.traverse((o) => {
    if (!o.isMesh) return
    const name = o.material?.name || ''
    if (/CarPaint_Max1$/.test(name)) o.material = paint
    else if (/Glass_Window/.test(name)) o.material = glass
    else if (o.material.transmission > 0) {
      o.material.transmission = 0
      o.material.transparent = true
      o.material.opacity = Math.max(o.material.opacity, 0.35)
    }
    const ms = Array.isArray(o.material) ? o.material : [o.material]
    for (const m of ms) m.clippingPlanes = planes
  })
}

/**
 * Запускает 3D в контейнере el (.art).
 * still (prefers-reduced-motion) — без шторки, покачивания и параллакса: сразу готовый кадр, перерисовка только при ресайзе.
 * Возвращает промис: { dispose } после первого кадра; отклоняется при ошибке/таймауте — тогда CarArt покажет кадр-заглушку.
 */
export async function startCar3D(el, { url, mobile, timeout = 6000, rig = RIG, staticFrame = false, still = false } = {}) {
  const canvas = document.createElement('canvas')
  canvas.className = 'art-3d'
  canvas.setAttribute('aria-hidden', 'true')
  const scan = document.createElement('span')
  scan.className = 'art-3d-scan'
  scan.setAttribute('aria-hidden', 'true')

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9
  renderer.localClippingEnabled = true
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = env
  pmrem.dispose()

  const rim = new DirectionalLight(ACCENT, 2.2) // контровой свет в цвет акцента
  rim.position.set(4, 3, -6)
  const key = new DirectionalLight(0xffffff, 0.6)
  key.position.set(-3, 6, 4)
  scene.add(rim, key)

  const camera = new PerspectiveCamera(rig.fov, 536 / 212, 0.1, 100)
  const clip = new Plane(new Vector3(0, -1, 0), 0)
  const planes = [clip]

  // загрузка с таймаутом: не уложились — заглушка
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  let timer
  const gltf = await Promise.race([
    loader.loadAsync(url),
    new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('car3d: timeout')), timeout) }),
  ]).finally(() => clearTimeout(timer)).catch((e) => {
    renderer.dispose()
    renderer.forceContextLoss()
    env.dispose()
    throw e
  })

  const car = gltf.scene
  tuneMaterials(car, planes)
  const pivot = new Group()
  pivot.add(car)
  const shadowTex = shadowTexture()
  const shadow = new Mesh(new PlaneGeometry(3.1, 5.6), new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, clippingPlanes: planes }))
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.005
  pivot.add(shadow)
  scene.add(pivot)

  // выборка вершин машины (≈ 6 тыс. точек) для кадрирования
  const silhouette = []
  car.updateMatrixWorld(true)
  car.traverse((o) => {
    const pos = o.isMesh && o.geometry.attributes.position
    if (!pos) return
    const step = Math.max(1, Math.floor(pos.count / 60))
    for (let i = 0; i < pos.count; i += step) silhouette.push(new Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld))
  })
  const _p = new Vector3()

  const target = new Vector3(0, rig.targetY, 0)
  function placeCamera() {
    const az = (rig.az * Math.PI) / 180, elv = (rig.el * Math.PI) / 180
    camera.fov = rig.fov
    camera.position.set(Math.sin(az) * Math.cos(elv) * rig.dist, rig.targetY + Math.sin(elv) * rig.dist, Math.cos(az) * Math.cos(elv) * rig.dist)
    camera.lookAt(target)
    camera.clearViewOffset()
    camera.updateMatrixWorld()
    // габариты силуэта на экране (NDC) при текущем ракурсе
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    for (const v of silhouette) {
      _p.copy(v).project(camera)
      if (_p.x < x0) x0 = _p.x
      if (_p.x > x1) x1 = _p.x
      if (_p.y < y0) y0 = _p.y
      if (_p.y > y1) y1 = _p.y
    }
    // увеличение и сдвиг без смены перспективы: вырезаем из «большого» кадра окно вокруг силуэта
    const k = Math.min((2 * rig.fit.x) / (x1 - x0), (2 * rig.fit.y) / (y1 - y0))
    const W = 1000 * camera.aspect, H = 1000
    const cx = ((x0 + x1) / 2 + 1) / 2, cy = (1 - (y0 + y1) / 2) / 2
    camera.setViewOffset(W * k, H * k, cx * W * k - W / 2, cy * H * k - H / 2, W, H)
  }

  // плоскость через камеру и горизонталь экрана на высоте ndcY: оставляем то, что выше линии
  const _d = new Vector3(), _r = new Vector3(), _n = new Vector3()
  function setCut(ndcY) {
    _d.set(0, ndcY, 0.5).unproject(camera).sub(camera.position).normalize()
    _r.set(1, 0, 0).applyQuaternion(camera.quaternion)
    _n.crossVectors(_r, _d).normalize()
    // точка заметно выше линии должна быть на «видимой» стороне
    const probe = new Vector3(0, Math.min(ndcY + 0.5, 1.5), 0.5).unproject(camera)
    clip.setFromNormalAndCoplanarPoint(_n, camera.position)
    if (clip.distanceToPoint(probe) < 0) clip.negate()
  }

  function resize() {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return
    renderer.setSize(r.width, r.height, false)
    camera.aspect = r.width / r.height
    placeCamera()
  }

  el.appendChild(canvas)
  el.appendChild(scan)
  resize()
  setCut(1.01) // до начала шторки ничего не видно
  if (staticFrame) {
    setCut(-1.01)
    renderer.render(scene, camera)
    canvas.style.opacity = '1'
    return { renderer, scene, camera, car, rig, placeCamera, setCut, render: () => renderer.render(scene, camera), dispose }
  }

  // ——— цикл ———
  let raf = 0, visible = true, alive = true, t0 = 0
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
  function frame(now) {
    raf = 0
    if (!alive) return
    if (!t0) t0 = now
    const p = still ? 1 : Math.min((now - t0) / REVEAL_MS, 1)
    const y = 1.01 - ease(p) * 2.02 // NDC: сверху вниз
    setCut(y)
    const top = ((1 - y) / 2) * 100
    scan.style.transform = `translateY(${top.toFixed(2)}%)`
    scan.style.opacity = p < 1 ? '1' : '0'
    // покачивание: медленный поворот ±3° и едва заметное «дыхание»
    const s = still ? 0 : (now - t0) / 1000
    tilt.x += (tilt.tx - tilt.x) * 0.06
    tilt.y += (tilt.ty - tilt.y) * 0.06
    pivot.rotation.y = Math.sin(s * 0.45) * 0.05 + tilt.y
    pivot.rotation.x = tilt.x
    pivot.position.y = Math.sin(s * 0.9) * 0.008
    renderer.render(scene, camera)
    if (!still && visible && !document.hidden) raf = requestAnimationFrame(frame)
  }
  const kick = () => { if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame) }

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick() })
  io.observe(el)
  const onVis = () => kick()
  document.addEventListener('visibilitychange', onVis)
  const ro = new ResizeObserver(() => { resize(); kick() })
  ro.observe(el)
  const onMove = (e) => {
    const r = el.getBoundingClientRect()
    const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) - 0.5
    const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1) - 0.5
    tilt.ty = x * ((4 * Math.PI) / 180) // ≤ 4°
    tilt.tx = y * ((2 * Math.PI) / 180)
    kick()
  }
  if (finePointer && !still) window.addEventListener('pointermove', onMove, { passive: true })

  // первый кадр отрисован (шторка ещё вверху) — проявляем canvas
  renderer.render(scene, camera)
  canvas.style.opacity = '1'
  kick()

  function dispose() {
    alive = false
    cancelAnimationFrame(raf)
    io.disconnect()
    ro.disconnect()
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('pointermove', onMove)
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []
      for (const m of ms) {
        for (const v of Object.values(m)) if (v && v.isTexture) v.dispose()
        m.dispose()
      }
    })
    shadowTex.dispose()
    env.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    canvas.remove()
    scan.remove()
  }
  return { dispose }
}
