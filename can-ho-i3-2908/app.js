import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from './vendor/jsm/renderers/CSS2DRenderer.js';
import { UNIT, SCENES, PLAN, GALLERY_ORDER } from './data.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const V3 = THREE.Vector3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DEG = Math.PI / 180;
const SC = Object.fromEntries(SCENES.map((s) => [s.id, s]));

// ------------------------------------------------------------------ Icon
const ICONS = {
  play: '<path d="M7 5l12 7-12 7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  dot: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
  wall: '<path d="M3 20h18M5 20V9h14v11M5 14h14M9 9v5M15 14v6"/>',
  top: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M12 13v8"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;
$$('[data-icon]').forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
$$('[data-bind]').forEach((el) => (el.textContent = UNIT[el.dataset.bind]));
const setProgress = (p) => ($('#loader-progress').style.width = p + '%');

// ------------------------------------------------------------------ Renderer chung
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('#stage').appendChild(renderer.domElement);
const canvas = renderer.domElement;

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
Object.assign(labelRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
$('#stage').appendChild(labelRenderer.domElement);

const state = { mode: 'tour', playing: false, spots: true, wallsLow: true };
let lastInteract = performance.now();

// ================================================================== TOUR
const D = 10;
const tourScene = new THREE.Scene();
const tourCam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
tourCam.rotation.order = 'YXZ';
const tour = { sc: null, mesh: null, pano: false, w: 1, h: 1, halfW: 0, halfH: 0, maxFov: 60, minFov: 30,
  yaw: 0, pitch: 0, fov: 60, tYaw: 0, tPitch: 0, tFov: 60, free: false, busy: false, driftDir: 1, playT: 0 };
const texCache = {};
const texLoader = new THREE.TextureLoader();
function loadTex(src) {
  if (!texCache[src]) texCache[src] = new Promise((res, rej) => texLoader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, rej));
  return texCache[src];
}

function setupScene(sc, tex) {
  if (tour.mesh) { tourScene.remove(tour.mesh); tour.mesh.geometry.dispose(); tour.mesh.material.dispose(); }
  tour.pano = !!sc.pano;
  if (tour.pano) {
    const geo = new THREE.SphereGeometry(D, 64, 32); geo.scale(-1, 1, 1);
    tour.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex }));
  } else {
    const aspect = tex.image.width / tex.image.height;
    tour.w = 2 * D * Math.tan((sc.hfov * DEG) / 2); tour.h = tour.w / aspect;
    tour.halfW = (sc.hfov * DEG) / 2; tour.halfH = Math.atan(tour.h / 2 / D);
    tour.mesh = new THREE.Mesh(new THREE.PlaneGeometry(tour.w, tour.h), new THREE.MeshBasicMaterial({ map: tex }));
    tour.mesh.position.z = -D;
  }
  tourScene.add(tour.mesh);
  tour.sc = sc;
  $('#backdrop').style.backgroundImage = `url("${sc.pano || sc.img}")`;
  computeLimits();
  buildSpots(sc);
}
function computeLimits() {
  const a = innerWidth / innerHeight;
  if (tour.pano) { tour.maxFov = 90; tour.minFov = 30; }
  else {
    // hiện trọn chiều cao ảnh; ảnh hẹp hơn màn hình thì hai bên là nền mờ
    tour.maxFov = (2 * tour.halfH) / DEG;
    const px = tour.mesh.material.map.image.height || 800;
    tour.minFov = tour.maxFov / THREE.MathUtils.clamp((px * 1.8) / innerHeight, 1.4, 2.6);
  }
}
function clampView(o) {
  o.fov = THREE.MathUtils.clamp(o.fov, tour.minFov, tour.maxFov);
  if (tour.pano) { o.pitch = THREE.MathUtils.clamp(o.pitch, -1.35, 1.35); return; }
  const a = innerWidth / innerHeight, hv = (o.fov * DEG) / 2, hh = Math.atan(Math.tan(hv) * a);
  const yl = Math.max(0, tour.halfW - hh) * 0.98, pl = Math.max(0, tour.halfH - hv) * 0.98;
  o.yaw = THREE.MathUtils.clamp(o.yaw, -yl, yl); o.pitch = THREE.MathUtils.clamp(o.pitch, -pl, pl);
  return yl;
}
const yawLimit = () => { const o = { yaw: 99, pitch: 0, fov: tour.fov }; clampView(o); return tour.pano ? Math.PI : o.yaw; };

function spotPoint(s) {
  if (tour.pano) {
    const y = (s.yaw || 0) * DEG, p = (s.pitch || 0) * DEG;
    return new V3(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)).multiplyScalar(D * 0.9);
  }
  return new V3((s.x / 100 - 0.5) * tour.w, (0.5 - s.y / 100) * tour.h, -D);
}
function spotAngles(s) {
  const p = spotPoint(s);
  return { yaw: Math.atan2(p.x, -p.z), pitch: Math.atan2(p.y, Math.hypot(p.x, p.z)) };
}

// Điểm bấm
const spotsEl = $('#spots');
let spotEls = [], popSpot = null;
function buildSpots(sc) {
  spotsEl.innerHTML = ''; spotEls = [];
  sc.spots.forEach((s) => {
    const el = document.createElement('button');
    el.className = 'spot ' + s.type;
    el.innerHTML = s.type === 'go'
      ? `<span class="ring">${icon('arrow')}</span><span class="lbl">${s.label || SC[s.to].name}</span>`
      : `<span class="ring">+</span><span class="lbl">${s.title}</span>`;
    el.onclick = (e) => {
      e.stopPropagation(); stopPlay();
      if (s.type === 'go') goScene(s.to, { spot: s });
      else openPop(s, el);
    };
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    spotsEl.appendChild(el); spotEls.push({ s, el, p: spotPoint(s) });
  });
}
const tmp = new V3();
function updateSpots() {
  const W = innerWidth, H = innerHeight;
  for (const o of spotEls) {
    tmp.copy(o.p).project(tourCam);
    const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.15 && Math.abs(tmp.y) < 1.15;
    o.el.style.display = vis ? '' : 'none';
    if (!vis) continue;
    o.sx = (tmp.x + 1) / 2 * W; o.sy = (1 - tmp.y) / 2 * H;
    o.el.style.transform = `translate(${o.sx}px,${o.sy}px)`;
  }
  if (popSpot) {
    const o = spotEls.find((x) => x.s === popSpot);
    if (!o || o.el.style.display === 'none') return closePop();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = o.sx + 24, y = o.sy - ph / 2;
    if (x + pw > W - 12) x = o.sx - pw - 24;
    pop.style.left = THREE.MathUtils.clamp(x, 12, W - pw - 12) + 'px';
    pop.style.top = THREE.MathUtils.clamp(y, 70, H - ph - 120) + 'px';
  }
}
const pop = $('#pop');
function openPop(s) { popSpot = s; $('#pop-title').textContent = s.title; $('#pop-text').textContent = s.text; pop.hidden = false; }
function closePop() { popSpot = null; pop.hidden = true; }
$('.pop-x').onclick = closePop;

// Chuyển cảnh
async function goScene(id, opts = {}) {
  const sc = SC[id];
  if (!sc || tour.busy || (tour.sc && tour.sc.id === id)) return;
  tour.busy = true; closePop();
  const texP = loadTex(sc.pano || sc.img);
  if (tour.sc && opts.spot && !opts.instant) {
    const a = spotAngles(opts.spot);
    tour.free = true; tour.tYaw = a.yaw; tour.tPitch = a.pitch; tour.tFov = tour.fov * 0.55;
    await sleep(480);
  }
  if (!opts.instant) { $('#fade').classList.add('on'); await sleep(330); }
  const tex = await texP;
  setupScene(sc, tex);
  tour.free = false;
  const startYaw = state.playing ? -999 : 0;
  Object.assign(tour, { yaw: startYaw, pitch: 0, fov: tour.maxFov * 0.72, tYaw: startYaw, tPitch: 0, tFov: tour.maxFov, playT: 0 });
  const o = { yaw: tour.yaw, pitch: 0, fov: tour.maxFov }; clampView(o); tour.yaw = tour.tYaw = o.yaw;
  $('#fade').classList.remove('on');
  tour.busy = false;
  onSceneChanged(sc);
  // tải trước các cảnh kế tiếp
  sc.spots.filter((s) => s.type === 'go').forEach((s) => loadTex(SC[s.to].pano || SC[s.to].img));
}
function onSceneChanged(sc) {
  $('#scene-name').textContent = sc.name;
  $$('#strip button').forEach((b) => b.classList.toggle('active', b.dataset.scene === sc.id));
  $('#strip button.active')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  updateMinimap();
  if (state.mode === 'tour') history.replaceState(null, '', '#canh=' + sc.id);
}

// Điều khiển kéo / zoom trong tour
const ptrs = new Map(); let pinchD = 0;
canvas.addEventListener('pointerdown', (e) => {
  if (state.mode !== 'tour') return;
  canvas.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
  interact(); closePop(); $('#stage').classList.add('grabbing');
});
canvas.addEventListener('pointermove', (e) => {
  if (state.mode !== 'tour' || !ptrs.has(e.pointerId)) return;
  const prev = ptrs.get(e.pointerId), cur = { x: e.clientX, y: e.clientY };
  ptrs.set(e.pointerId, cur);
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchD) tour.tFov *= pinchD / d; pinchD = d;
    return;
  }
  const vf = tour.fov * DEG, hf = 2 * Math.atan(Math.tan(vf / 2) * innerWidth / innerHeight);
  tour.tYaw -= (cur.x - prev.x) * hf / innerWidth;
  tour.tPitch += (cur.y - prev.y) * vf / innerHeight;
});
const endPtr = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinchD = 0; if (!ptrs.size) $('#stage').classList.remove('grabbing'); };
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', (e) => {
  if (state.mode !== 'tour') return;
  e.preventDefault(); interact(); tour.tFov *= Math.exp(e.deltaY * 0.0012);
}, { passive: false });
canvas.addEventListener('dblclick', (e) => {
  if (state.mode !== 'tour') return;
  const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  const dir = new V3(ndc.x, ndc.y, 0.5).unproject(tourCam).normalize();
  tour.tYaw = Math.atan2(dir.x, -dir.z); tour.tPitch = Math.asin(dir.y);
  tour.tFov = tour.fov > tour.minFov * 1.3 ? tour.fov * 0.6 : tour.maxFov;
});
$$('[data-zoom]').forEach((b) => (b.onclick = () => { interact(); tour.tFov *= b.dataset.zoom === 'in' ? 0.75 : 1.33; }));
addEventListener('keydown', (e) => {
  if (state.mode !== 'tour' || e.target.closest('input,textarea,select')) return;
  const k = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08] }[e.key];
  if (k) { interact(); tour.tYaw += k[0]; tour.tPitch += k[1]; }
  if (e.key === '+' || e.key === '=') tour.tFov *= 0.8;
  if (e.key === '-') tour.tFov *= 1.25;
});
function interact() { lastInteract = performance.now(); stopPlay(); $('#hint').classList.add('hide'); }

// Tự động tham quan (tiện quay video đăng Reels / TikTok)
function startPlay() {
  state.playing = true; document.body.classList.add('playing');
  $('#btn-play i').innerHTML = icon('pause'); $('#btn-play span').textContent = 'Dừng';
  if (state.mode !== 'tour') setMode('tour');
  tour.playT = 0; tour.tYaw = -99; const o = { yaw: -99, pitch: 0, fov: tour.fov }; clampView(o); tour.tYaw = o.yaw;
}
function stopPlay() {
  if (!state.playing) return;
  state.playing = false; document.body.classList.remove('playing');
  $('#btn-play i').innerHTML = icon('play'); $('#btn-play span').textContent = 'Tự động';
}
$('#btn-play').onclick = () => (state.playing ? stopPlay() : startPlay());

function tourFrame(dt) {
  if (state.playing && !tour.busy) {
    tour.playT += dt;
    const lim = yawLimit(), dur = 7;
    tour.tYaw = tour.pano ? tour.tYaw + dt * 0.25 : THREE.MathUtils.lerp(-lim, lim, Math.min(1, tour.playT / dur));
    tour.tFov = tour.maxFov;
    if (tour.playT > dur + 0.6) {
      const i = SCENES.indexOf(tour.sc);
      goScene(SCENES[(i + 1) % SCENES.length].id);
    }
  } else if (!tour.busy && performance.now() - lastInteract > 5000 && !ptrs.size) {
    // trôi nhẹ để cảnh "sống"
    const lim = yawLimit();
    tour.tYaw += tour.driftDir * dt * (tour.pano ? 0.06 : 0.035);
    if (!tour.pano && Math.abs(tour.tYaw) > lim * 0.9) { tour.driftDir = -Math.sign(tour.tYaw) || 1; tour.tYaw = Math.sign(tour.tYaw) * lim * 0.9; }
  }
  if (!tour.free) {
    const t = { yaw: tour.tYaw, pitch: tour.tPitch, fov: tour.tFov }; clampView(t);
    tour.tYaw = t.yaw; tour.tPitch = t.pitch; tour.tFov = t.fov;
  }
  const k = 1 - Math.pow(0.0008, dt);
  tour.yaw += (tour.tYaw - tour.yaw) * k; tour.pitch += (tour.tPitch - tour.pitch) * k; tour.fov += (tour.tFov - tour.fov) * k;
  if (!tour.free) { const c = { yaw: tour.yaw, pitch: tour.pitch, fov: tour.fov }; clampView(c); Object.assign(tour, c); }
  tourCam.fov = tour.fov; tourCam.aspect = innerWidth / innerHeight; tourCam.updateProjectionMatrix();
  tourCam.rotation.set(tour.pitch, -tour.yaw, 0);
  tourCam.updateMatrixWorld();
  updateSpots();
  updateCone();
}

// ------------------------------------------------------------------ Dải cảnh + mặt bằng nhỏ
$('#strip').innerHTML = SCENES.map((s) => `<button data-scene="${s.id}" title="${s.name}"><img src="${s.img}" alt="" loading="lazy"><span>${s.name}</span></button>`).join('');
$('#strip').onclick = (e) => {
  const b = e.target.closest('[data-scene]'); if (!b) return;
  stopPlay(); if (state.mode !== 'tour') setMode('tour'); goScene(b.dataset.scene);
};

const SHORT = { khach: 'Khách', bancong: 'Ban công', bep: 'Bếp', an: 'Ăn', sanh: 'Sảnh', master: 'PN Master', wc: 'WC', pn2: 'PN 2' };
function buildMinimap() {
  const pad = 0.4, x0 = -pad, z0 = Math.min(...PLAN.rooms.map((r) => r.rect[1])) - pad;
  const w = PLAN.size.w + pad * 2, d = PLAN.size.d - z0 + pad;
  $('#minimap').innerHTML = `<svg viewBox="${x0} ${z0} ${w} ${d}">
    ${PLAN.rooms.map((r) => `<rect class="room" data-room="${r.id}" x="${r.rect[0]}" y="${r.rect[1]}" width="${r.rect[2]}" height="${r.rect[3]}"/>`).join('')}
    ${PLAN.walls.map(([a, b, c, e]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${e}" stroke="rgba(255,244,228,.55)" stroke-width=".1"/>`).join('')}
    ${PLAN.rooms.filter((r) => SHORT[r.id]).map((r) => `<text x="${r.rect[0] + r.rect[2] / 2}" y="${r.rect[1] + r.rect[3] / 2 + 0.75}" text-anchor="middle">${SHORT[r.id]}</text>`).join('')}
    <path class="cone" id="mm-cone"/>
    ${SCENES.map((s) => `<circle class="mm-dot" data-scene="${s.id}" cx="${s.view.x}" cy="${s.view.z}" r=".26"><title>${s.name}</title></circle>`).join('')}
  </svg>`;
  $('#minimap').onclick = (e) => { const c = e.target.closest('[data-scene]'); if (c) { stopPlay(); goScene(c.dataset.scene); } };
}
function updateMinimap() {
  if (!tour.sc) return;
  $$('#minimap .mm-dot').forEach((c) => c.classList.toggle('active', c.dataset.scene === tour.sc.id));
  $$('#minimap .room').forEach((r) => r.classList.toggle('active', r.dataset.room === tour.sc.room));
}
function updateCone() {
  const cone = $('#mm-cone'); if (!cone || !tour.sc) return;
  const { x, z, yaw } = tour.sc.view, a = (yaw * DEG) + tour.yaw;
  const half = tour.pano ? 0.6 : Math.atan(Math.tan(tour.fov * DEG / 2) * innerWidth / innerHeight), L = 2;
  const p = (ang) => `${x + Math.sin(ang) * L},${z - Math.cos(ang) * L}`;
  cone.setAttribute('d', `M${x},${z} L${p(a - half)} L${p(a + half)} Z`);
}

// ================================================================== SA BÀN 3D
const house = new THREE.Scene();
house.background = new THREE.Color(0x1a140f);
house.fog = new THREE.Fog(0x1a140f, 40, 80);
const houseCam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 200);
const CENTER = new V3(PLAN.size.w / 2, 0, PLAN.size.d / 2 - 0.6);
const HOUSE_VIEW = { pos: new V3(CENTER.x + 6.5, 12.5, CENTER.z + 11.5), target: CENTER.clone() };
houseCam.position.copy(HOUSE_VIEW.pos);
const controls = new OrbitControls(houseCam, canvas);
controls.target.copy(CENTER); controls.enableDamping = true; controls.maxPolarAngle = 1.32; controls.minDistance = 5; controls.maxDistance = 32;
controls.enabled = false;

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8;
  return t;
}
let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const FLOORS = {
  wood: () => canvasTex(512, 512, (g, w, h) => {
    for (let y = 0; y < 8; y++) {
      const off = (y % 2) * 180;
      for (let x = -1; x < 3; x++) {
        const l = 150 + rnd() * 40 | 0;
        g.fillStyle = `rgb(${l + 30},${l - 25},${l - 75})`; g.fillRect(x * 256 + off, y * 64, 256, 64);
        g.strokeStyle = 'rgba(60,30,10,.35)'; g.lineWidth = 2; g.strokeRect(x * 256 + off, y * 64, 256, 64);
        for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(90,50,20,${0.08 + rnd() * 0.1})`; g.beginPath(); const yy = y * 64 + 6 + rnd() * 52; g.moveTo(x * 256 + off, yy); g.bezierCurveTo(x * 256 + off + 80, yy + 4, x * 256 + off + 170, yy - 4, x * 256 + off + 256, yy); g.stroke(); }
      }
    }
  }),
  marble: () => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#eeeae4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(150,145,140,${0.15 + rnd() * 0.25})`; g.lineWidth = 0.6 + rnd() * 1.6; g.beginPath(); let x = rnd() * w, y = 0; g.moveTo(x, y); while (y < h) { x += (rnd() - 0.5) * 60; y += 20 + rnd() * 40; g.lineTo(x, y); } g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2; g.strokeRect(0, 0, w / 2, h / 2); g.strokeRect(w / 2, h / 2, w / 2, h / 2);
  }),
  tile: () => canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c9c3ba'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
  }),
};

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const MAT = {
  wall: M(0xf3efe8, { roughness: 0.9 }), oak: M(0xd2ad7c, { roughness: 0.6 }), oakDark: M(0x9c7046, { roughness: 0.6 }),
  white: M(0xf5f4f0), fabric: M(0xe8decf, { roughness: 1 }), grey: M(0x9aa0a4, { roughness: 1 }), sage: M(0x8fa58a, { roughness: 1 }),
  stone: M(0x6f6d6b, { roughness: 0.35 }), steel: M(0x3c3f44, { metalness: 0.6, roughness: 0.35 }), black: M(0x1c1c1e, { roughness: 0.4 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false }),
  plant: M(0x4c7a3d, { flatShading: true }), pot: M(0xe7e1d6), rattan: M(0xe3d2b1, { roughness: 1 }),
  led: new THREE.MeshBasicMaterial({ color: 0xffe2b0 }), slab: M(0x2b231b, { roughness: 1 }), rug: M(0xd8ccb8, { roughness: 1 }),
};
const roomMeshes = [];
const wallGroup = new THREE.Group();
const WALL_H = 2.7;

function box(x1, z1, x2, z2, y1, y2, mat, parent = house, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x2 - x1), y2 - y1, Math.abs(z2 - z1)), mat);
  m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
  m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}

function buildHouse() {
  house.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2c20, 1.1));
  const sun = new THREE.DirectionalLight(0xffe6c4, 2.2);
  sun.position.set(CENTER.x + 7, 15, CENTER.z + 9); sun.target.position.copy(CENTER);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  house.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xc9d8ff, 0.45); fill.position.set(-8, 10, -6); house.add(fill);

  // Nền tầng
  const zMin = Math.min(...PLAN.rooms.map((r) => r.rect[1]));
  box(-0.35, zMin - 0.35, PLAN.size.w + 0.35, PLAN.size.d + 0.35, -0.35, -0.01, MAT.slab);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshBasicMaterial({ color: 0x3a2a1a, transparent: true, opacity: 0.6 }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(CENTER.x, -0.36, CENTER.z); house.add(glow);

  // Sàn từng phòng
  const floorTex = { wood: FLOORS.wood(), marble: FLOORS.marble(), tile: FLOORS.tile() };
  for (const r of PLAN.rooms) {
    const [x, z, w, d] = r.rect;
    const t = floorTex[r.floor].clone(); t.repeat.set(w / (r.floor === 'wood' ? 2.4 : 1.2), d / (r.floor === 'wood' ? 2.4 : 1.2)); t.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: r.floor === 'marble' ? 0.35 : 0.8, emissive: 0xd9a86c, emissiveIntensity: 0 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x + w / 2, 0.001, z + d / 2); m.receiveShadow = true;
    m.userData.room = r; house.add(m); roomMeshes.push(m);
    if (r.name) {
      const el = document.createElement('div'); el.className = 'room-label'; el.textContent = r.name;
      const o = new CSS2DObject(el); o.position.set(x + w / 2, 0.05, z + d / 2 + (r.id === 'master' ? 0.6 : 0)); house.add(o);
    }
  }

  // Tường (cắt khoảng cửa đi / cửa sổ)
  const openings = [...PLAN.doors.map((d) => ({ ...d, kind: 'door' })), ...PLAN.windows.map((w) => ({ ...w, kind: w.glassDoor ? 'glass' : 'win' }))];
  for (const wl of PLAN.walls) {
    const [x1, z1, x2, z2, hh] = wl, H = hh || WALL_H, horiz = z1 === z2, t = hh ? 0.06 : 0.07;
    const lo = horiz ? Math.min(x1, x2) : Math.min(z1, z2), hi = horiz ? Math.max(x1, x2) : Math.max(z1, z2);
    const fixed = horiz ? z1 : x1;
    const ops = openings.filter((o) => (o.along === 'x') === horiz && Math.abs((horiz ? o.at[1] : o.at[0]) - fixed) < 0.01 && (horiz ? o.at[0] : o.at[1]) > lo && (horiz ? o.at[0] : o.at[1]) < hi)
      .map((o) => ({ ...o, a: (horiz ? o.at[0] : o.at[1]) - o.w / 2, b: (horiz ? o.at[0] : o.at[1]) + o.w / 2 })).sort((p, q) => p.a - q.a);
    const seg = (a, b, y1, y2, mat = MAT.wall) => horiz ? box(a, fixed - t, b, fixed + t, y1, y2, mat, wallGroup) : box(fixed - t, a, fixed + t, b, y1, y2, mat, wallGroup);
    let cur = lo;
    for (const o of ops) {
      if (o.a > cur) seg(cur, o.a, 0, H);
      if (o.kind === 'door') seg(o.a, o.b, 2.15, H);
      else if (o.kind === 'glass') { seg(o.a, o.b, 2.35, H); seg(o.a, o.b, 0, 2.35, MAT.glass).castShadow = false; }
      else { seg(o.a, o.b, 0, 0.9); seg(o.a, o.b, 2.2, H); seg(o.a, o.b, 0.9, 2.2, MAT.glass).castShadow = false; }
      cur = o.b;
    }
    if (cur < hi) seg(cur, hi, 0, H);
  }
  wallGroup.scale.y = 0.45;
  house.add(wallGroup);

  // ---------------- Nội thất minh họa ----------------
  const plant = (x, z, s = 1) => {
    box(x - 0.14 * s, z - 0.14 * s, x + 0.14 * s, z + 0.14 * s, 0, 0.3 * s, MAT.pot);
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 * s, 0), MAT.plant); p.position.set(x, 0.55 * s, z); p.castShadow = true; house.add(p);
  };
  // Phòng khách
  box(0.05, 1.1, 0.5, 3.3, 0, 0.45, MAT.oak);
  box(0.06, 1.4, 0.12, 3.0, 0.9, 1.7, MAT.black);
  box(1.6, 1.1, 4.0, 3.3, 0, 0.012, MAT.rug, house, false);
  box(2.2, 1.75, 3.0, 2.65, 0, 0.38, MAT.oak);
  box(3.7, 0.95, 4.55, 3.45, 0, 0.42, MAT.fabric); box(4.35, 0.95, 4.6, 3.45, 0, 0.85, MAT.fabric);
  box(3.7, 0.95, 4.6, 1.15, 0, 0.62, MAT.fabric); box(3.7, 3.25, 4.6, 3.45, 0, 0.62, MAT.fabric);
  box(3.85, 1.4, 4.25, 1.8, 0.42, 0.62, MAT.sage); box(3.85, 2.6, 4.25, 3.0, 0.42, 0.62, MAT.grey);
  box(5.4, 0.3, 6.1, 1.7, 0.72, 0.76, MAT.white); box(5.45, 0.35, 6.05, 0.45, 0, 0.72, MAT.white); box(5.45, 1.55, 6.05, 1.65, 0, 0.72, MAT.white);
  box(5.0, 0.8, 5.35, 1.2, 0, 0.45, MAT.grey);
  plant(0.4, 0.4, 1.3); plant(5.8, 3.9, 1.1);
  // Ban công
  box(5.3, -1.2, 5.95, -0.6, 0, 0.85, MAT.white); plant(0.4, -0.8, 1); plant(1.0, -0.8, 0.8);
  // Bàn ăn
  box(3.3, 4.65, 4.5, 5.3, 0.72, 0.76, MAT.oak); box(3.4, 4.7, 4.4, 5.25, 0, 0.72, MAT.oakDark);
  [[3.55, 4.5], [4.25, 4.5], [3.55, 5.45], [4.25, 5.45]].forEach(([x, z]) => box(x - 0.18, z - 0.15, x + 0.18, z + 0.15, 0, 0.45, MAT.fabric));
  // Bếp chữ L
  box(0.75, 7.4, 2.8, 7.95, 0, 0.84, MAT.oak); box(0.75, 7.35, 2.8, 7.98, 0.84, 0.88, MAT.stone);
  box(2.2, 6.3, 2.75, 7.4, 0, 0.84, MAT.oak); box(2.15, 6.3, 2.78, 7.4, 0.84, 0.88, MAT.stone);
  box(0.75, 7.62, 2.8, 7.98, 1.5, 2.35, MAT.white); box(0.75, 7.62, 2.8, 7.98, 2.35, 2.65, MAT.oak);
  box(0.8, 7.9, 2.75, 7.95, 0.9, 1.48, MAT.stone, house, false);
  box(0.75, 7.6, 2.8, 7.63, 1.47, 1.5, MAT.led, house, false);
  box(0.05, 7.2, 0.72, 7.95, 0, 1.8, MAT.steel);
  box(2.45, 4.5, 2.78, 6.25, 0, 2.6, MAT.oakDark);
  // Sảnh
  box(4.55, 5.95, 4.93, 7.0, 0, 1.0, MAT.oak); box(4.55, 6.05, 4.56, 6.9, 0.1, 0.92, MAT.rattan, house, false); box(4.52, 5.93, 4.95, 7.02, 1.0, 1.04, MAT.white);
  for (let i = 0; i < 4; i++) box(4.88, 7.05 + i * 0.25, 4.93, 7.08 + i * 0.25, 0, 2.4, MAT.oak);
  for (let j = 0; j < 6; j++) box(4.88, 7.05, 4.93, 7.83, 0.45 + j * 0.38, 0.48 + j * 0.38, MAT.oak);
  box(4.5, 7.1, 4.88, 7.8, 0.4, 0.46, MAT.oak);
  // Phòng ngủ master
  box(8.0, 0.45, 9.95, 2.35, 0, 0.42, MAT.oak); box(8.08, 0.52, 9.85, 2.28, 0.42, 0.62, MAT.fabric);
  box(9.82, 0.4, 9.95, 2.4, 0, 1.15, MAT.grey); box(9.3, 0.6, 9.75, 1.3, 0.62, 0.78, MAT.white); box(9.3, 1.5, 9.75, 2.2, 0.62, 0.78, MAT.white);
  box(8.0, 0.55, 8.9, 2.25, 0.62, 0.66, MAT.sage, house, false);
  box(9.5, 2.5, 9.95, 3.35, 0.72, 0.77, MAT.oak); box(9.55, 2.55, 9.93, 3.3, 0.6, 0.72, MAT.oak);
  const mirror = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 8, 40), MAT.led); mirror.rotation.y = Math.PI / 2; mirror.position.set(9.92, 1.45, 2.92); house.add(mirror);
  const ott = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 20), MAT.fabric); ott.position.set(9.2, 0.21, 2.9); ott.castShadow = true; house.add(ott);
  box(7.45, 3.15, 9.45, 3.72, 0, 2.6, MAT.oak); box(7.6, 3.13, 9.3, 3.14, 0.2, 2.0, MAT.rattan, house, false);
  for (let j = 0; j < 6; j++) box(7.2, 3.2, 7.44, 3.72, 0.1 + j * 0.45, 0.14 + j * 0.45, MAT.oak);
  box(7.2, 3.68, 7.44, 3.72, 0, 2.6, MAT.oak);
  plant(7.32, 3.45, 0.7);
  // WC
  box(9.45, 3.95, 9.9, 4.45, 0, 0.42, MAT.white); box(9.75, 3.95, 9.95, 4.45, 0.42, 0.8, MAT.white);
  box(8.1, 4.65, 8.75, 5.12, 0, 0.85, MAT.oak); box(8.1, 4.65, 8.75, 5.12, 0.85, 0.9, MAT.white);
  box(9.0, 4.55, 9.02, 5.15, 0, 2.0, MAT.glass).castShadow = false;
  // Phòng ngủ 2
  box(7.35, 5.27, 9.95, 7.15, 0, 0.42, MAT.oak); box(7.55, 5.35, 9.85, 6.95, 0.42, 0.6, MAT.white);
  box(7.6, 5.35, 8.6, 6.95, 0.6, 0.63, MAT.grey, house, false);
  box(7.55, 5.27, 9.95, 5.4, 0.42, 0.95, MAT.oak);
  box(9.88, 5.3, 9.95, 7.2, 0.42, 2.6, MAT.oak);
  box(6.27, 5.27, 7.3, 5.8, 0, 0.5, MAT.oak); box(6.27, 5.27, 7.3, 5.8, 0.5, 0.54, MAT.white);
  box(7.8, 7.42, 9.6, 7.95, 0, 2.6, MAT.white);
  box(7.3, 7.42, 7.78, 7.95, 0, 2.6, MAT.oak);
  for (let j = 0; j < 5; j++) box(7.32, 7.44, 7.76, 7.93, 0.4 + j * 0.45, 0.42 + j * 0.45, MAT.led, house, false);
  plant(6.5, 5.55, 0.6);

  // Điểm chụp ảnh (bấm để vào tour)
  for (const s of SCENES) {
    const el = document.createElement('div');
    el.className = 'cam-pin'; el.innerHTML = `<i>${icon('camera')}</i><span>${s.name}</span>`;
    el.onclick = () => { setMode('tour'); goScene(s.id); };
    const o = new CSS2DObject(el); o.center.set(0.5, 1); o.position.set(s.view.x, 1.35, s.view.z); house.add(o);
    const a = s.view.yaw * DEG, half = (s.hfov * DEG) / 2, L = 1.5;
    const shape = new THREE.Shape([new THREE.Vector2(0, 0),
      new THREE.Vector2(Math.sin(a - half) * L, -Math.cos(a - half) * L), new THREE.Vector2(Math.sin(a + half) * L, -Math.cos(a + half) * L)]);
    const cone = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0xd9a86c, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }));
    cone.rotation.x = Math.PI / 2; cone.position.set(s.view.x, 0.03, s.view.z); house.add(cone);
  }
}

// Hover / click phòng
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let hoverRoom = null, downAt = null;
canvas.addEventListener('pointermove', (e) => {
  if (state.mode !== 'model') return;
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, houseCam);
  const hit = ray.intersectObjects(roomMeshes)[0]?.object || null;
  if (hit === hoverRoom) return;
  if (hoverRoom) hoverRoom.material.emissiveIntensity = 0;
  hoverRoom = hit;
  const has = hit && SCENES.some((s) => s.room === hit.userData.room.id);
  if (hit) hit.material.emissiveIntensity = has ? 0.28 : 0.1;
  canvas.style.cursor = has ? 'pointer' : '';
});
canvas.addEventListener('pointerdown', (e) => { if (state.mode === 'model') downAt = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (state.mode !== 'model' || !downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5 || !hoverRoom) return;
  const sc = SCENES.find((s) => s.room === hoverRoom.userData.room.id);
  if (sc) { setMode('tour'); goScene(sc.id); }
});

let houseTween = null;
function houseFly(pos, target, dur = 1.2) { houseTween = { p0: houseCam.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, k: 0, dur }; }
$('#btn-top').onclick = () => houseFly(new V3(CENTER.x, 17, CENTER.z + 0.01), CENTER.clone());
$('#btn-walls').onclick = (e) => { state.wallsLow = !state.wallsLow; e.currentTarget.classList.toggle('active', state.wallsLow); };

// ================================================================== Thư viện
const order = GALLERY_ORDER.map((id) => SC[id]).filter(Boolean);
$('#gallery-grid').innerHTML = order.map((s, i) => `<button data-i="${i}"><img src="${s.img}" alt="${s.name}" loading="lazy"><span>${s.name}</span></button>`).join('');
let lbIndex = 0;
const lb = $('#lightbox');
function showLb(i) { lbIndex = (i + order.length) % order.length; $('#lb-img').src = order[lbIndex].img; $('#lb-cap').textContent = order[lbIndex].name; lb.hidden = false; }
$('#gallery-grid').onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) showLb(+b.dataset.i); };
lb.onclick = (e) => {
  const v = e.target.closest('[data-lb]')?.dataset.lb;
  if (v === 'close' || e.target === lb) lb.hidden = true;
  else if (v) showLb(lbIndex + +v);
};
$('#lb-tour').onclick = () => { lb.hidden = true; setMode('tour'); goScene(order[lbIndex].id); };
addEventListener('keydown', (e) => {
  if (!lb.hidden) { if (e.key === 'Escape') lb.hidden = true; if (e.key === 'ArrowRight') showLb(lbIndex + 1); if (e.key === 'ArrowLeft') showLb(lbIndex - 1); return; }
  if (e.key === 'Escape') { closePop(); closeDrawer(); }
});

// ================================================================== Chế độ
function setMode(m) {
  if (m !== 'tour') stopPlay();
  state.mode = m;
  document.body.classList.remove('mode-tour', 'mode-model', 'mode-gallery'); document.body.classList.add('mode-' + m);
  $$('.modes button').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
  controls.enabled = m === 'model';
  $('#gallery').hidden = m !== 'gallery';
  closePop();
  canvas.style.cursor = '';
  $('#stage').classList.toggle('grab', m === 'tour');
  if (m === 'model') { houseCam.position.copy(HOUSE_VIEW.pos).add(new V3(4, 6, 6)); controls.target.copy(CENTER); houseFly(HOUSE_VIEW.pos.clone(), CENTER.clone(), 1.4); }
  history.replaceState(null, '', m === 'tour' ? (tour.sc ? '#canh=' + tour.sc.id : location.pathname) : m === 'model' ? '#sa-ban' : '#thu-vien');
}
$$('.modes button').forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));

// ================================================================== Thông tin căn + form
const drawer = $('#drawer');
const telHref = 'tel:' + UNIT.hotline.replace(/\s/g, '');
$('#drawer-body').innerHTML = `
  <div class="eyebrow">${UNIT.project} · ${UNIT.building}</div>
  <h2>${UNIT.title}</h2>
  <p>${UNIT.intro}</p>
  <div class="specs">
    <div class="wide"><small>Chủ đầu tư</small><b>${UNIT.developer}</b></div>
    ${UNIT.specs.filter((s) => s.value).map((s) => `<div class="${s.value.length > 16 ? 'wide' : ''}"><small>${s.label}</small><b>${s.value}</b></div>`).join('')}
    <div class="wide"><small>Vị trí</small><b>${UNIT.address}</b></div>
  </div>
  <p class="note">Ảnh là phối cảnh nội thất; mặt bằng 3D mang tính minh họa.</p>
  <h3>Đặt lịch xem nhà</h3>
  <form id="lead-form">
    <label class="field">Họ và tên<input name="name" required placeholder="Nguyễn Văn A"></label>
    <div class="row">
      <label class="field">Số điện thoại<input name="phone" type="tel" required pattern="[0-9 +.]{9,15}" placeholder="09xx xxx xxx"></label>
      <label class="field">Nhu cầu<select name="need"><option>Xem nhà trực tiếp</option><option>Nhận báo giá</option><option>Tư vấn vay vốn</option></select></label>
    </div>
    <label class="field">Thời gian thuận tiện<input name="time" placeholder="VD: Sáng thứ 7"></label>
    <button class="btn block" type="submit">Gửi đăng ký</button>
  </form>
  <div class="btn-row"><a class="btn ghost" href="${telHref}">${icon('phone')} ${UNIT.hotline}</a><a class="btn ghost" href="${UNIT.zalo}" target="_blank" rel="noopener">Chat Zalo</a></div>`;
function openDrawer() { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); }
function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
$('#btn-info').onclick = () => (drawer.classList.contains('open') ? closeDrawer() : openDrawer());
$('#drawer-x').onclick = closeDrawer;
$('#lead-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = { ...Object.fromEntries(new FormData(e.target)), unit: UNIT.code, at: new Date().toISOString(), page: location.href };
  try {
    if (UNIT.leadEndpoint) await fetch(UNIT.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    else { const k = 'i3-2908-leads', arr = JSON.parse(localStorage.getItem(k) || '[]'); arr.push(data); localStorage.setItem(k, JSON.stringify(arr)); }
    toast('Đã gửi! Chuyên viên sẽ liên hệ lại ngay.'); e.target.reset();
  } catch { toast('Gửi chưa thành công – vui lòng gọi hotline.'); }
});
$('#q-call').href = telHref; $('#q-call span').textContent = UNIT.hotline; $('#q-zalo').href = UNIT.zalo;

$('#btn-spots').onclick = (e) => { state.spots = !state.spots; e.currentTarget.classList.toggle('active', state.spots); document.body.classList.toggle('spots-off', !state.spots); closePop(); };
$('#btn-full').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
$('#btn-share').onclick = async () => {
  try { await navigator.clipboard.writeText(location.href); toast('Đã sao chép link – dán vào Zalo / Facebook để chia sẻ'); }
  catch { prompt('Sao chép link này:', location.href); }
};
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3000); }

// ================================================================== Vòng lặp
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.1);
  if (state.mode === 'tour') {
    tourFrame(dt);
    renderer.render(tourScene, tourCam);
  } else if (state.mode === 'model') {
    if (houseTween) {
      houseTween.k = Math.min(1, houseTween.k + dt / houseTween.dur);
      const k = 1 - Math.pow(1 - houseTween.k, 3);
      houseCam.position.lerpVectors(houseTween.p0, houseTween.p1, k); controls.target.lerpVectors(houseTween.t0, houseTween.t1, k);
      if (houseTween.k >= 1) houseTween = null;
    }
    const ty = state.wallsLow ? 0.45 : 1;
    wallGroup.scale.y += (ty - wallGroup.scale.y) * Math.min(1, dt * 6);
    controls.update();
    renderer.render(house, houseCam);
    labelRenderer.render(house, houseCam);
  }
}
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight); labelRenderer.setSize(innerWidth, innerHeight);
  houseCam.aspect = innerWidth / innerHeight; houseCam.updateProjectionMatrix();
  if (tour.sc) computeLimits();
});

// ================================================================== Khởi động
async function init() {
  setProgress(15);
  buildHouse(); buildMinimap();
  setProgress(40);
  const initHash = location.hash;
  const h = new URLSearchParams(initHash.slice(1));
  const first = SC[h.get('canh')] ? h.get('canh') : SCENES[0].id;
  await goScene(first, { instant: true });
  setProgress(100);
  frame();
  setTimeout(() => $('#loader').classList.add('done'), 150);
  if (initHash === '#sa-ban') setMode('model');
  else if (initHash === '#thu-vien') setMode('gallery');
  else { setMode('tour'); }
  setTimeout(() => $('#hint').classList.add('hide'), 9000);
  SCENES.forEach((s) => loadTex(s.pano || s.img));
  window.i3 = { tour, state, goScene, setMode, houseCam, controls, startPlay };
}
init().then(() => { window.__appReady = true; }).catch((e) => { console.error(e); window.__appErr?.(e); });
