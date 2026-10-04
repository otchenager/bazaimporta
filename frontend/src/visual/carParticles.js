// Суперкар из частиц на чистом WebGL1. Силуэт — из carShape.js, глубина — двумя бортами (±z),
// крыша и капот «натягиваются» по ширине. Без зависимостей.
import { CAR_BODY, CAR_INTAKE, CAR_LINES, CAR_SPOKES, CAR_WHEELS, CAR_WINDOW } from './carShape.js'

const VS = `
attribute vec3 a_target; attribute vec3 a_start; attribute vec2 a_meta; // meta: kind, seed
uniform vec2 u_res; uniform vec2 u_mouse; uniform float u_time; uniform float u_progress;
uniform float u_yaw; uniform float u_pitch; uniform float u_k; uniform float u_dpr;
varying float v_kind; varying float v_alpha;
float easeOutExpo(float t){ return t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t); }
void main(){
  float kind = a_meta.x, seed = a_meta.y;
  float delay = (1.0 - (a_target.x + 500.0) / 1000.0) * 0.45 + seed * 0.15;
  float t = easeOutExpo(clamp((u_progress - delay) / 0.9, 0.0, 1.0));
  vec3 p = mix(a_start, a_target, t);
  p.y += sin(u_time * 1.3 + seed * 40.0) * 0.9 * t;
  float cy = cos(u_yaw), sy = sin(u_yaw), cp = cos(u_pitch), sp = sin(u_pitch);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  p = vec3(p.x, cp * p.y - sp * p.z, sp * p.y + cp * p.z);
  float depth = 1500.0 - p.z;
  float s = 1500.0 / depth;
  vec2 px = u_res * 0.5 + vec2(p.x, -p.y) * s * u_k;
  vec2 d = px - u_mouse;
  float dl = length(d);
  float R = 110.0 * u_dpr;
  if (u_mouse.x > -9000.0 && dl < R) px += d / max(dl, 0.001) * (R - dl) * 0.55;
  vec2 clip = px / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  float base = kind < 0.5 ? 2.3 : kind < 1.5 ? 1.6 : kind < 2.5 ? 2.6 : 1.4;
  gl_PointSize = base * s * u_dpr;
  float flicker = 0.85 + 0.15 * sin(u_time * 2.0 + seed * 60.0);
  v_alpha = (kind < 0.5 ? 0.95 : kind < 1.5 ? 0.38 : kind < 2.5 ? 1.0 : 0.22) * flicker * (0.35 + 0.65 * t);
  v_kind = kind;
}`

const FS = `
precision mediump float;
varying float v_kind; varying float v_alpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.15, length(c)) * v_alpha;
  vec3 light = vec3(0.925, 0.925, 0.937);
  vec3 accent = vec3(1.0, 0.416, 0.0);
  vec3 col = v_kind > 1.5 && v_kind < 2.5 ? accent : light;
  gl_FragColor = vec4(col * a, a);
}`

// kind: 0 — ближний борт, 1 — дальний борт, 2 — акцент (колёса, воздухозаборник, фара), 3 — поверхность/земля
function sampleCar(count) {
  const W = 1000, H = 300
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const body = new Path2D(CAR_BODY)

  const strokeSet = (paths, width) => {
    ctx.clearRect(0, 0, W, H)
    ctx.lineWidth = width
    ctx.strokeStyle = '#fff'
    for (const p of paths) ctx.stroke(p)
    const data = ctx.getImageData(0, 0, W, H).data
    const pts = []
    for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) if (data[(y * W + x) * 4 + 3] > 120) pts.push([x, y])
    return pts
  }
  const wheelPaths = CAR_WHEELS.flatMap(({ cx, cy, r }) => {
    const tire = new Path2D(), rim = new Path2D()
    tire.arc(cx, cy, r, 0, Math.PI * 2)
    rim.arc(cx, cy, r * 0.68, 0, Math.PI * 2)
    return [tire, rim]
  })
  const outline = strokeSet([body, new Path2D(CAR_WINDOW), ...CAR_LINES.slice(0, 2).map((d) => new Path2D(d)), ...CAR_LINES.slice(4).map((d) => new Path2D(d))], 1.6)
  const accent = strokeSet([...wheelPaths, ...CAR_SPOKES.map((d) => new Path2D(d)), new Path2D(CAR_INTAKE), new Path2D(CAR_LINES[2]), new Path2D(CAR_LINES[3])], 1.6)

  const halfWidth = (y) => 190 * (y < 150 ? 0.62 + 0.38 * Math.max(0, (y - 60) / 90) : 1)
  const pick = (arr, n) => Array.from({ length: n }, () => arr[(Math.random() * arr.length) | 0])

  const out = []
  const add = (x, y, z, kind) => out.push(x - 500, -(y - 175), z, kind)
  const nOutline = Math.round(count * 0.42)
  const nAccent = Math.round(count * 0.22)
  const nRoof = Math.round(count * 0.2)
  const nGround = count - nOutline - nAccent - nRoof

  for (const [x, y] of pick(outline, nOutline)) {
    const near = Math.random() < 0.62
    add(x, y, (near ? 1 : -1) * halfWidth(y), near ? 0 : 1)
  }
  for (const [x, y] of pick(accent, nAccent)) {
    const near = Math.random() < 0.66
    add(x, y, (near ? 1 : -1) * (halfWidth(y) - 18), near ? 2 : 1)
  }
  // верхний контур (крыша, капот, крышка мотора) растягивается по ширине — так появляется объём
  ctx.clearRect(0, 0, W, H)
  const top = outline.filter(([x, y]) => y < 200 && !ctx.isPointInPath(body, x, y - 5) && ctx.isPointInPath(body, x, y + 5))
  for (const [x, y] of pick(top, nRoof)) add(x, y, (Math.random() * 2 - 1) * halfWidth(y), 3)
  for (let i = 0; i < nGround; i++) {
    const x = -40 + Math.random() * 1080
    add(x, 292, (Math.random() * 2 - 1) * 260, 3)
  }
  return out
}

/**
 * Запускает сцену на canvas. Возвращает функцию остановки.
 * onReady — после первого кадра; onLost — если WebGL недоступен или контекст потерян.
 */
export function startCar(canvas, { count = 6000, interactive = true, onReady, onLost } = {}) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'low-power' })
  if (!gl) {
    onLost?.()
    return () => {}
  }
  const compile = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
    return s
  }
  let program
  try {
    program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VS))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link')
  } catch {
    onLost?.()
    return () => {}
  }
  gl.useProgram(program)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE)

  const pts = sampleCar(count)
  const n = pts.length / 4
  const target = new Float32Array(n * 3), start = new Float32Array(n * 3), meta = new Float32Array(n * 2)
  for (let i = 0; i < n; i++) {
    const [x, y, z, kind] = pts.slice(i * 4, i * 4 + 4)
    target.set([x, y, z], i * 3)
    // частицы влетают справа налево — «машина приезжает»
    start.set([x + 900 + Math.random() * 900, y + (Math.random() - 0.5) * 160, z * 0.3], i * 3)
    meta.set([kind, Math.random()], i * 2)
  }
  const bind = (name, data, size) => {
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, name)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
  }
  bind('a_target', target, 3)
  bind('a_start', start, 3)
  bind('a_meta', meta, 2)

  const u = (name) => gl.getUniformLocation(program, name)
  const U = { res: u('u_res'), mouse: u('u_mouse'), time: u('u_time'), progress: u('u_progress'), yaw: u('u_yaw'), pitch: u('u_pitch'), k: u('u_k'), dpr: u('u_dpr') }

  const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
  let w = 0, h = 0
  const fit = () => {
    w = canvas.clientWidth
    h = canvas.clientHeight
    const pw = Math.max(1, Math.round(w * dpr)), ph = Math.max(1, Math.round(h * dpr))
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw
      canvas.height = ph
      gl.viewport(0, 0, pw, ph)
    }
  }

  const mouse = { x: -1e4, y: -1e4, nx: 0, ny: 0 }
  const BASE_YAW = -0.34
  const look = { yaw: BASE_YAW, pitch: 0.16 }
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect()
    mouse.x = (e.clientX - r.left) * dpr
    mouse.y = (e.clientY - r.top) * dpr
    mouse.nx = (e.clientX / window.innerWidth) * 2 - 1
    mouse.ny = (e.clientY / window.innerHeight) * 2 - 1
  }
  const onLeave = () => {
    mouse.x = mouse.y = -1e4
  }
  if (interactive) {
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
  }

  let raf = 0, running = false, visible = false, readyFired = false, lost = false
  const t0 = performance.now()
  const frame = () => {
    raf = requestAnimationFrame(frame)
    fit()
    const t = (performance.now() - t0) / 1000
    const scrollK = Math.min(1, window.scrollY / Math.max(1, h))
    const wantYaw = BASE_YAW + mouse.nx * 0.32 + scrollK * 0.55 + Math.sin(t * 0.35) * 0.06
    const wantPitch = 0.16 + mouse.ny * 0.08 + scrollK * 0.1
    look.yaw += (wantYaw - look.yaw) * 0.06
    look.pitch += (wantPitch - look.pitch) * 0.06
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(U.res, canvas.width, canvas.height)
    gl.uniform2f(U.mouse, mouse.x, mouse.y)
    gl.uniform1f(U.time, t)
    gl.uniform1f(U.progress, Math.min(t / 1.9, 1.6))
    gl.uniform1f(U.yaw, look.yaw)
    gl.uniform1f(U.pitch, look.pitch)
    gl.uniform1f(U.k, (Math.min(w, h * 2.4) / 1280) * dpr)
    gl.uniform1f(U.dpr, dpr)
    gl.drawArrays(gl.POINTS, 0, n)
    if (!readyFired) {
      readyFired = true
      onReady?.()
    }
  }
  const sync = () => {
    const should = visible && !document.hidden && !lost
    if (should && !running) {
      running = true
      raf = requestAnimationFrame(frame)
    } else if (!should && running) {
      running = false
      cancelAnimationFrame(raf)
    }
  }
  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting
    sync()
  })
  io.observe(canvas)
  document.addEventListener('visibilitychange', sync)
  const onContextLost = (e) => {
    e.preventDefault()
    lost = true
    sync()
    onLost?.()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  return () => {
    io.disconnect()
    document.removeEventListener('visibilitychange', sync)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    window.removeEventListener('pointermove', onMove)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    cancelAnimationFrame(raf)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
