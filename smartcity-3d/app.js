import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/jsm/controls/OrbitControls.js';
import { EffectComposer } from './vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/jsm/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from './vendor/jsm/renderers/CSS2DRenderer.js';
import { buildWorld, FLOOR_H, PODIUM_H, mulberry32 } from './scene.js';
import * as D from './data.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const V3 = THREE.Vector3;
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

// ------------------------------------------------------------------ Icon
const ICON_PATHS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19l7-7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sunset: '<path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 4v5M5.6 10.6l1.4 1.4M18.4 10.6L17 12M2 22h20"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  water: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z"/>',
  school: '<path d="M3 9l9-5 9 5-9 5-9-5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[n] || ''}</svg>`;
$$('[data-icon]').forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
$$('[data-bind]').forEach((el) => (el.textContent = D.PROJECT[el.dataset.bind]));

const isMobile = matchMedia('(max-width: 820px)').matches;
const setProgress = (p) => ($('#loader-progress').style.width = p + '%');

// ------------------------------------------------------------------ Dữ liệu căn hộ
const ZONE = Object.fromEntries(D.ZONES.map((z) => [z.id, z]));
const TOWER = Object.fromEntries(D.TOWERS.map((t) => [t.id, t]));
const STATUS = {
  available: { label: 'Còn trống', color: '#3ddc84' },
  hold: { label: 'Đang giữ chỗ', color: '#ffb547' },
  sold: { label: 'Đã bán', color: '#ff5d6c' },
};
const strSeed = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);

const UNITS = {};
for (const t of D.TOWERS) {
  const r = mulberry32(strSeed(t.id));
  const half = t.unitsPerFloor / 2, zone = ZONE[t.zone];
  UNITS[t.id] = [];
  for (let f = 1; f <= t.floors; f++) {
    const floor = [];
    for (let i = 0; i < t.unitsPerFloor; i++) {
      const row = i < half ? 0 : 1, col = row ? i - half : i;
      const corner = col === 0 || col === half - 1;
      const opts = corner ? D.UNIT_TYPES.corner : D.UNIT_TYPES.middle;
      const pick = opts[Math.floor(r() * opts.length)];
      const area = Math.round((pick.area[0] + r() * (pick.area[1] - pick.area[0])) * 10) / 10;
      const side = row ? 'Nam' : 'Bắc';
      const dir = col === 0 ? `Tây ${side}` : col === half - 1 ? `Đông ${side}` : side;
      const pm2 = zone.pricePerM2 * (1 + (f - t.floors / 2) * 0.004) * (row ? 1.06 : 1) * (corner ? 1.04 : 1);
      const sRand = r(), soldRatio = t.status === 'building' ? 0.32 : 0.58;
      floor.push({
        code: `${t.id}-${String(f).padStart(2, '0')}${String(i + 1).padStart(2, '0')}`,
        tower: t.id, floor: f, idx: i, row, col, corner, type: pick.type, area, dir,
        view: (row ? 'Hồ điều hòa' : 'Nội khu & thành phố') + (corner ? ' • 2 mặt thoáng' : ''),
        price: Math.round(area * pm2), // triệu đồng
        status: sRand < soldRatio ? 'sold' : sRand < soldRatio + 0.1 ? 'hold' : 'available',
      });
    }
    UNITS[t.id].push(floor);
  }
}
const allUnits = () => Object.values(UNITS).flat(2);
const towerAvail = (id) => UNITS[id].flat().filter((u) => u.status === 'available').length;
const fmtPrice = (m) => (m >= 1000 ? (m / 1000).toFixed(2).replace('.', ',') + ' tỷ' : m + ' triệu');
const findUnit = (code) => { const [tid, rest] = code.split('-'); const f = +rest.slice(0, 2), i = +rest.slice(2) - 1; return UNITS[tid]?.[f - 1]?.[i]; };

// ------------------------------------------------------------------ Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('#stage').appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
Object.assign(labelRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
$('#stage').appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xffffff, 600, 3200);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.3, 14000);
const HOME = { pos: new V3(60, 175, 560), target: new V3(-10, 40, -110) };
camera.position.set(900, 900, 1500);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, 0, 0);
controls.autoRotateSpeed = 0.35;

// ------------------------------------------------------------------ Theme
const THEMES = {
  sunset: {
    skyTop: '#2a2f66', skyMid: '#b45f79', skyHorizon: '#ff9a45', skyGround: '#3a2b2c', sunColor: '#ffb35c', glow: 1.1, sunSize: 2,
    sunDir: [-0.55, 0.05, -0.83], light: '#ffa45a', lightInt: 2.3, hemiSky: '#ffb48a', hemiGround: '#2b2a3a', hemiInt: 0.85,
    fog: '#c98068', fogNear: 1100, fogFar: 4600, windows: 0.5, lamps: 3, led: 1.5, water: 0.6, bloom: 0.6, exposure: 1.0,
  },
  night: {
    skyTop: '#03061a', skyMid: '#0a1436', skyHorizon: '#26315e', skyGround: '#05070f', sunColor: '#7c95ff', glow: 0.25, sunSize: 0.8,
    sunDir: [0.4, 0.5, -0.6], light: '#8aa2ff', lightInt: 0.35, hemiSky: '#5466aa', hemiGround: '#0a0a14', hemiInt: 0.4,
    fog: '#121937', fogNear: 900, fogFar: 4200, windows: 1.6, lamps: 4.5, led: 3, water: 1.4, bloom: 0.9, exposure: 1.15,
  },
  day: {
    skyTop: '#2f6fd0', skyMid: '#7fb3ea', skyHorizon: '#d9e9f7', skyGround: '#7a7a72', sunColor: '#fff6dd', glow: 0.5, sunSize: 2,
    sunDir: [0.4, 0.72, 0.56], light: '#fff3e0', lightInt: 3.0, hemiSky: '#cfe3ff', hemiGround: '#5a5040', hemiInt: 1.1,
    fog: '#c9dcef', fogNear: 1300, fogFar: 5200, windows: 0.04, lamps: 0.85, led: 0.5, water: 0.15, bloom: 0.2, exposure: 0.95,
  },
};
const toThemeState = (t) => Object.fromEntries(Object.entries(t).map(([k, v]) =>
  [k, typeof v === 'string' ? new THREE.Color(v) : Array.isArray(v) ? new V3(...v).normalize() : v]));
let themeNow = toThemeState(THEMES.sunset), themeFrom = null, themeTo = null, themeT = 1;

function lerpTheme(a, b, k) {
  const out = {};
  for (const key in a) {
    const x = a[key], y = b[key];
    out[key] = x.isColor ? x.clone().lerp(y, k) : x.isVector3 ? x.clone().lerp(y, k).normalize() : x + (y - x) * k;
  }
  return out;
}

// ------------------------------------------------------------------ Trạng thái
const state = { mode: 'model', panel: null, tower: null, floor: null, theme: 'sunset', labels: true, autoRotate: true, view: 'orbit', tourPoint: null };
let W, composer, bloom;
let lastInteract = performance.now();
const tagEls = {}, pinEls = {};
const landmarkLabels = [];
let landmarkGroup, tourArrows = [], panoSphere = null;

// ------------------------------------------------------------------ Camera tween
let tween = null;
function flyTo(pos, target, dur = 1.8, lift) {
  const d = camera.position.distanceTo(pos);
  // bay vòng lên cao khi xuất phát/kết thúc sát mặt đất để không xuyên qua cây, nhà
  if (lift === undefined) lift = (camera.position.y < 40 || pos.y < 40) && d > 80 ? Math.min(220, d * 0.25) : 0;
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), k: 0, dur, lift };
}
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function setView(mode) {
  state.view = mode;
  if (mode === 'orbit') {
    Object.assign(controls, { minDistance: 30, maxDistance: 2800, enableZoom: true, enablePan: true, minPolarAngle: 0.05, maxPolarAngle: 1.45, rotateSpeed: 0.8 });
    camera.fov = 45; camera.updateProjectionMatrix();
  } else {
    Object.assign(controls, { minDistance: 0.01, maxDistance: 2, enableZoom: false, enablePan: false, minPolarAngle: 0.25, maxPolarAngle: Math.PI - 0.25, rotateSpeed: -0.35 });
  }
}
setView('orbit');

renderer.domElement.addEventListener('wheel', (e) => {
  if (state.view !== 'look') return;
  camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.03, 28, 85);
  camera.updateProjectionMatrix();
}, { passive: true });

// ------------------------------------------------------------------ Panel
const panel = $('#panel'), panelBody = $('#panel-body');
function openPanel(name, arg) {
  if (state.panel === 'location' && name !== 'location') { landmarkGroup.visible = false; document.body.classList.remove('in-location'); }
  state.panel = name;
  $$('.nav button').forEach((b) => b.classList.toggle('active', b.dataset.panel === name));
  panelBody.innerHTML = (RENDER[name] || (() => ''))(arg);
  panelBody.scrollTop = 0;
  panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false');
  (AFTER[name] || (() => {}))(arg);
}
function closePanel() {
  panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true');
  $$('.nav button').forEach((b) => b.classList.remove('active'));
  if (state.panel === 'location') { landmarkGroup.visible = false; document.body.classList.remove('in-location'); }
  state.panel = null;
  clearTower();
}
$('#panel-close').onclick = closePanel;

const statsHtml = () => `<div class="stats">${D.PROJECT.stats.map((s) => `<div class="stat"><b>${s.value}</b><span>${s.label}</span></div>`).join('')}</div>`;
const legendHtml = () => `<div class="legend">${Object.values(STATUS).map((s) => `<span style="--c:${s.color}">${s.label}</span>`).join('')}</div>`;

const RENDER = {
  overview: () => `
    <div class="eyebrow">Tổng quan dự án</div>
    <h2>${D.PROJECT.brandTop} ${D.PROJECT.brandMain}</h2>
    <p>${D.PROJECT.tagline}</p>
    <p>${D.PROJECT.intro}</p>
    ${statsHtml()}
    <h3>Địa chỉ</h3><p>${D.PROJECT.address}</p>
    <div class="btn-row"><button class="btn" data-go="search">Tìm căn ngay</button><button class="btn ghost" data-go="tour">Tham quan 360°</button></div>`,

  location: () => `
    <div class="eyebrow">Vị trí & liên kết vùng</div>
    <h2>Kết nối thuận tiện</h2>
    <p>${D.PROJECT.address}</p>
    <div class="card-list">${D.LANDMARKS.map((l) => `<div class="card"><span class="ico">${icon('pin')}</span><div class="grow"><b>${l.name}</b><small>Di chuyển khoảng ${l.time}</small></div></div>`).join('')}</div>`,

  zones: () => `
    <div class="eyebrow">Phân khu</div><h2>Các phân khu căn hộ</h2>
    <p>Rê chuột vào phân khu để xem vị trí trên sa bàn, bấm để bay tới.</p>
    <div class="card-list">${D.ZONES.map((z) => {
      const ts = D.TOWERS.filter((t) => t.zone === z.id);
      const av = ts.reduce((a, t) => a + towerAvail(t.id), 0);
      return `<button class="card" data-zone="${z.id}"><span class="dot" style="background:${z.color}"></span>
        <div class="grow"><b>${z.name}</b><small>${ts.map((t) => t.id).join(' • ')} — từ ${z.pricePerM2} tr/m²</small></div>
        <div class="right"><b>${av}</b><small>căn trống</small></div></button>`;
    }).join('')}</div>
    <h3>Tất cả các tòa</h3>
    <div class="card-list">${D.TOWERS.map((t) => `<button class="card" data-tower="${t.id}"><span class="dot" style="background:${ZONE[t.zone].color}"></span>
      <div class="grow"><b>Tòa ${t.id} · ${ZONE[t.zone].name}</b><small>${t.floors} tầng • ${t.unitsPerFloor} căn/tầng</small></div>
      <span class="badge ${t.status}">${t.status === 'done' ? 'Hoàn thiện' : 'Đang xây'}</span></button>`).join('')}</div>`,

  amenities: () => `
    <div class="eyebrow">Tiện ích nội khu</div><h2>Sống trọn tiện ích</h2>
    <div class="card-list">${D.AMENITIES.map((a) => `<button class="card" data-amenity="${a.id}"><span class="ico">${icon(a.icon)}</span><div class="grow"><b>${a.name}</b><small>${a.desc}</small></div></button>`).join('')}</div>`,

  amenity: (a) => `
    <div class="eyebrow">Tiện ích</div><h2>${a.name}</h2><p>${a.desc}</p>
    <div class="btn-row"><button class="btn ghost" data-go="amenities">← Tất cả tiện ích</button><button class="btn" data-go="contact">Nhận tư vấn</button></div>`,

  search: () => {
    const maxP = Math.ceil(Math.max(...allUnits().map((u) => u.price)) / 500) * 500;
    const types = [...new Set([...D.UNIT_TYPES.corner, ...D.UNIT_TYPES.middle].map((t) => t.type))];
    return `
    <div class="eyebrow">Tìm căn hộ</div><h2>Lọc căn theo nhu cầu</h2>
    <form id="search-form">
      <div class="row">
        <label class="field">Phân khu<select name="zone"><option value="">Tất cả</option>${D.ZONES.map((z) => `<option value="${z.id}">${z.name}</option>`).join('')}</select></label>
        <label class="field">Loại căn<select name="type"><option value="">Tất cả</option>${types.map((t) => `<option>${t}</option>`).join('')}</select></label>
      </div>
      <div class="row">
        <label class="field">Hướng<select name="dir"><option value="">Tất cả</option>${['Bắc', 'Nam', 'Đông', 'Tây'].map((d) => `<option>${d}</option>`).join('')}</select></label>
        <label class="field">Tầng<select name="floor"><option value="">Tất cả</option><option value="low">Thấp (1–12)</option><option value="mid">Trung (13–28)</option><option value="high">Cao (29+)</option></select></label>
      </div>
      <label class="field">Giá tối đa: <b id="price-out">${fmtPrice(maxP)}</b><input type="range" name="price" min="1000" max="${maxP}" step="100" value="${maxP}"></label>
      <label class="check"><input type="checkbox" name="avail" checked> Chỉ hiện căn còn trống</label>
    </form>
    <h3 id="search-count"></h3>
    <div class="card-list" id="search-results"></div>`;
  },

  gallery: () => `
    <div class="eyebrow">Thư viện</div><h2>Hình ảnh dự án</h2>
    <p>Bấm nút <b>máy ảnh</b> trên thanh công cụ để chụp lại góc nhìn sa bàn – ảnh sẽ được thêm vào đây và tải về máy để đăng bài.</p>
    <div class="gallery">${[...D.GALLERY, ...snapshots].map((g, i) => `<button data-img="${i}"><img src="${g.src}" alt="${g.title}" loading="lazy"></button>`).join('')}</div>`,

  contact: (unit) => `
    <div class="eyebrow">Liên hệ</div><h2>Đăng ký nhận báo giá</h2>
    <p>Để lại thông tin, chuyên viên sẽ gọi lại trong 15 phút kèm bảng giá & chính sách mới nhất.</p>
    <form id="lead-form">
      <label class="field">Họ và tên<input name="name" required placeholder="Nguyễn Văn A"></label>
      <label class="field">Số điện thoại<input name="phone" required type="tel" pattern="[0-9 +.]{9,15}" placeholder="09xx xxx xxx"></label>
      <div class="row">
        <label class="field">Nhu cầu<select name="need"><option>Mua để ở</option><option>Đầu tư</option><option>Thuê</option></select></label>
        <label class="field">Mã căn quan tâm<input name="unit" value="${unit?.code || ''}" placeholder="VD: S1-1205"></label>
      </div>
      <label class="field">Ghi chú<textarea name="note" rows="2" placeholder="Tài chính dự kiến, số phòng ngủ…"></textarea></label>
      <button class="btn gold block" type="submit">Gửi đăng ký</button>
    </form>
    <div class="btn-row"><a class="btn ghost" href="tel:${D.PROJECT.hotline.replace(/\s/g, '')}">${icon('phone')} ${D.PROJECT.hotline}</a><a class="btn ghost" href="${D.PROJECT.zalo}" target="_blank" rel="noopener">Chat Zalo</a></div>`,

  tower: (id) => {
    const t = TOWER[id], z = ZONE[t.zone], av = towerAvail(id), total = t.floors * t.unitsPerFloor;
    const minP = Math.min(...UNITS[id].flat().map((u) => u.price));
    return `
    <div class="eyebrow" style="color:${z.color}">${z.name}</div>
    <h2>Tòa ${t.id} <span class="badge ${t.status}">${t.status === 'done' ? 'Hoàn thiện' : `Đang xây • ${t.builtFloors}/${t.floors} tầng`}</span></h2>
    <div class="stats">
      <div class="stat"><b>${t.floors}</b><span>Số tầng</span></div>
      <div class="stat"><b>${av}<small style="font-size:13px;color:var(--muted)"> / ${total}</small></b><span>Căn còn trống</span></div>
      <div class="stat"><b>${fmtPrice(minP)}</b><span>Giá chỉ từ</span></div>
      <div class="stat"><b>${t.handover}</b><span>Bàn giao</span></div>
    </div>
    <h3>Chọn tầng</h3>
    <div class="floors">${UNITS[id].slice().reverse().map((fl) => {
      const a = fl.filter((u) => u.status === 'available').length;
      return `<button class="floor-btn" data-floor="${fl[0].floor}" ${a ? '' : 'disabled'} title="${a} căn trống">${fl[0].floor}<i style="width:${(a / fl.length) * 100}%"></i></button>`;
    }).join('')}</div>
    <div id="floor-plan"><p>Chọn một tầng để xem mặt bằng và trạng thái từng căn.</p></div>`;
  },

  photoSpot: (s) => `
    <div class="eyebrow">Khám phá</div><h2>${s.title}</h2><p>${s.text}</p>
    <div class="btn-row"><button class="btn" data-link="${s.link}">Xem trên sa bàn 3D</button><button class="btn ghost" data-go="contact">Nhận tư vấn</button></div>`,
};

const AFTER = {
  location: () => {
    landmarkGroup.visible = true; document.body.classList.add('in-location');
    flyTo(new V3(250, 1250, 1500), new V3(0, 0, -80), 2.4);
  },
  search: () => {
    const form = $('#search-form');
    const run = () => {
      const f = Object.fromEntries(new FormData(form));
      $('#price-out').textContent = fmtPrice(+f.price);
      const res = allUnits().filter((u) =>
        (!f.zone || TOWER[u.tower].zone === f.zone) && (!f.type || u.type === f.type) && (!f.dir || u.dir.includes(f.dir)) &&
        (!f.floor || (f.floor === 'low' ? u.floor <= 12 : f.floor === 'mid' ? u.floor > 12 && u.floor <= 28 : u.floor > 28)) &&
        u.price <= +f.price && (!f.avail || u.status === 'available')).sort((a, b) => a.price - b.price);
      $('#search-count').textContent = `Tìm thấy ${res.length} căn`;
      $('#search-results').innerHTML = res.slice(0, 60).map(unitCard).join('') + (res.length > 60 ? '<p>Thu hẹp bộ lọc để xem thêm…</p>' : '');
    };
    form.addEventListener('input', run); run();
  },
  contact: () => {
    $('#lead-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = { ...Object.fromEntries(new FormData(e.target)), at: new Date().toISOString(), page: location.href };
      try {
        if (D.PROJECT.leadEndpoint) await fetch(D.PROJECT.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        else { const k = 'sc3d-leads'; const arr = JSON.parse(localStorage.getItem(k) || '[]'); arr.push(data); localStorage.setItem(k, JSON.stringify(arr)); }
        toast('Đã gửi đăng ký! Chúng tôi sẽ liên hệ lại ngay.');
        e.target.reset();
      } catch { toast('Gửi chưa thành công, vui lòng gọi hotline.'); }
    });
  },
  zones: () => {
    $$('[data-zone]').forEach((el) => {
      el.onmouseenter = () => highlightZone(el.dataset.zone);
      el.onmouseleave = () => highlightZone(null);
    });
  },
  tower: (id) => { if (state.floor) selectFloor(state.floor); },
};

const unitCard = (u) => `<button class="card" data-unit="${u.code}"><span class="dot" style="background:${STATUS[u.status].color}"></span>
  <div class="grow"><b>${u.code}</b><small>${u.type} • ${u.area} m² • ${u.dir}</small></div><div class="right"><b>${fmtPrice(u.price)}</b><small>${STATUS[u.status].label}</small></div></button>`;

// Uỷ quyền click trong panel
panelBody.addEventListener('click', (e) => {
  const el = e.target.closest('[data-go],[data-zone],[data-tower],[data-amenity],[data-floor],[data-unit],[data-img],[data-link],.u');
  if (!el) return;
  const ds = el.dataset;
  if (ds.go === 'tour') return enterTour(D.TOUR_POINTS[0].id);
  if (ds.go) return openPanel(ds.go);
  if (ds.zone) return flyToZone(ds.zone);
  if (ds.tower) return selectTower(ds.tower);
  if (ds.amenity) return showAmenity(D.AMENITIES.find((a) => a.id === ds.amenity));
  if (ds.floor) return selectFloor(+ds.floor);
  if (ds.unit) { const u = findUnit(ds.unit); if (state.tower !== u.tower) selectTower(u.tower, u.floor); else selectFloor(u.floor); return openUnit(u); }
  if (ds.img) return openLightbox([...D.GALLERY, ...snapshots][+ds.img]);
  if (ds.link) { setMode('model'); return followLink(ds.link); }
});

$$('.nav button').forEach((b) => (b.onclick = () => {
  if (state.mode === 'tour') setMode('model');
  if (state.mode === 'photo' && !['overview', 'gallery', 'contact', 'location'].includes(b.dataset.panel)) setMode('model');
  if (state.mode === 'photo' && b.dataset.panel === 'location') setMode('model');
  state.panel === b.dataset.panel ? closePanel() : openPanel(b.dataset.panel);
}));

// ------------------------------------------------------------------ Tòa / tầng / căn
function towerCamera(t, floor) {
  const tw = W.towers[t.id];
  const y = floor ? PODIUM_H + (floor - 0.5) * FLOOR_H : PODIUM_H + tw.H * 0.5;
  const target = new V3(t.x, y, t.z);
  const dir = camera.position.clone().sub(target).setY(0).normalize().lerp(new V3(0.25, 0, 1).normalize(), 0.5).normalize();
  const dist = (floor ? 120 : tw.H * 1.5 + 90) * (camera.aspect < 1 ? 1.7 : 1);
  return { pos: target.clone().addScaledVector(dir, dist).add(new V3(0, floor ? 25 : tw.H * 0.3, 0)), target };
}

function clearTower() {
  if (state.tower) { W.towers[state.tower].hl.visible = false; tagEls[state.tower]?.classList.remove('active'); }
  state.tower = null; state.floor = null; W.floorSlab.visible = false;
  updateHash();
}

function selectTower(id, floor) {
  if (state.view === 'look') exitLook();
  if (state.tower && state.tower !== id) clearTower();
  state.tower = id; state.floor = floor || null;
  const t = TOWER[id];
  W.towers[id].hl.visible = true; tagEls[id]?.classList.add('active');
  const c = towerCamera(t, floor); flyTo(c.pos, c.target, 1.6);
  openPanel('tower', id);
  updateHash();
}

function selectFloor(f) {
  const t = TOWER[state.tower]; if (!t) return;
  state.floor = f;
  $$('.floor-btn').forEach((b) => b.classList.toggle('active', +b.dataset.floor === f));
  W.floorSlab.position.set(t.x, PODIUM_H + (f - 0.5) * FLOOR_H, t.z);
  W.floorSlab.scale.set(t.w + 2.6, FLOOR_H * 0.92, t.d + 2.6);
  W.floorSlab.visible = true;
  const c = towerCamera(t, f); flyTo(c.pos, c.target, 1.2);
  const units = UNITS[t.id][f - 1], av = units.filter((u) => u.status === 'available');
  $('#floor-plan').innerHTML = `<h3>Mặt bằng tầng ${f} • ${av.length} căn trống</h3>${legendHtml()}${planSvg(units, t)}
    <div class="card-list" style="margin-top:10px">${av.map(unitCard).join('') || '<p>Tầng này đã hết căn.</p>'}</div>`;
  updateHash();
}

function planSvg(units, t) {
  const half = t.unitsPerFloor / 2, Wd = 360, pad = 8, cw = (Wd - pad * 2) / half, rowH = 74;
  const cell = (u) => {
    const x = pad + u.col * cw, y = u.row ? 120 : pad + 12;
    return `<g class="u" data-unit="${u.code}"><rect x="${x + 1.5}" y="${y}" width="${cw - 3}" height="${rowH}" rx="5" fill="${STATUS[u.status].color}" opacity="${u.status === 'sold' ? 0.55 : 0.95}"/>
      <text x="${x + cw / 2}" y="${y + rowH / 2 - 3}" text-anchor="middle">${String(u.idx + 1).padStart(2, '0')}</text>
      <text x="${x + cw / 2}" y="${y + rowH / 2 + 11}" text-anchor="middle" style="font-size:8.5px;font-weight:500">${u.type}</text></g>`;
  };
  return `<svg class="plan" viewBox="0 0 ${Wd} 222">
    <text x="${Wd / 2}" y="12" text-anchor="middle" style="fill:#a9b3d1;font-size:9px">▲ BẮC — Nội khu & thành phố</text>
    ${units.map(cell).join('')}
    <rect x="${pad}" y="${pad + 12 + rowH + 4}" width="${Wd - pad * 2}" height="${120 - (pad + 12 + rowH) - 8}" rx="4" fill="rgba(255,255,255,.06)"/>
    <rect x="${Wd / 2 - 26}" y="${pad + 12 + rowH + 6}" width="52" height="${120 - (pad + 12 + rowH) - 12}" rx="3" fill="rgba(255,255,255,.18)"/>
    <text x="${Wd / 2}" y="${pad + 12 + rowH + 18}" text-anchor="middle" style="fill:#eef2ff;font-size:8px;font-weight:500">Thang máy</text>
    <text x="${Wd / 2}" y="214" text-anchor="middle" style="fill:#36d6ff;font-size:9px">▼ NAM — View hồ điều hòa</text>
  </svg>`;
}

const modal = $('#modal'), modalCard = $('#modal-card');
function openUnit(u) {
  const t = TOWER[u.tower], z = ZONE[t.zone], s = STATUS[u.status];
  modalCard.innerHTML = `
    <button class="panel-close" data-close aria-label="Đóng">×</button>
    <div class="eyebrow" style="color:${z.color}">${z.name} • Tòa ${t.id} • Tầng ${u.floor}</div>
    <h2>Căn ${u.code}</h2>
    <span class="badge" style="background:${s.color}22;color:${s.color}">${s.label}</span>
    <div class="spec" style="margin-top:14px">
      <div><small>Loại căn</small><b>${u.type}</b></div><div><small>Diện tích</small><b>${u.area} m²</b></div>
      <div><small>Hướng</small><b>${u.dir}</b></div><div><small>Bàn giao</small><b>${t.handover}</b></div>
      <div style="grid-column:1/-1"><small>View</small><b>${u.view}</b></div>
    </div>
    <p class="price">${fmtPrice(u.price)} <small>• ~${Math.round(u.price / u.area)} tr/m² (giá tham khảo)</small></p>
    <div class="btn-row">
      <button class="btn ghost" data-view="${u.code}">Xem view từ căn</button>
      <button class="btn gold" data-quote="${u.code}" ${u.status === 'sold' ? 'disabled style="opacity:.5"' : ''}>${u.status === 'available' ? 'Giữ chỗ / báo giá' : 'Nhận căn tương tự'}</button>
    </div>`;
  modal.hidden = false;
}
modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.closest('[data-close]')) return (modal.hidden = true);
  const v = e.target.closest('[data-view]'), q = e.target.closest('[data-quote]');
  if (v) { modal.hidden = true; enterUnitView(findUnit(v.dataset.view)); }
  if (q) { modal.hidden = true; openPanel('contact', findUnit(q.dataset.quote)); }
});

// View từ căn hộ (góc nhìn thứ nhất)
let savedCam = null;
function enterUnitView(u) {
  const t = TOWER[u.tower], half = t.unitsPerFloor / 2;
  const x = t.x - t.w / 2 + (u.col + 0.5) * (t.w / half);
  const sgn = u.row ? 1 : -1;
  const pos = new V3(x, PODIUM_H + (u.floor - 0.6) * FLOOR_H, t.z + sgn * (t.d / 2 + 2));
  const target = pos.clone().add(new V3(0, -0.12, sgn * 1));
  savedCam = { pos: camera.position.clone(), target: controls.target.clone() };
  W.towers[t.id].hl.visible = false; W.floorSlab.visible = false;
  setView('look'); flyTo(pos, target, 2);
  $('#unit-view-code').textContent = u.code;
  $('#unit-view-bar').hidden = false; $('#hint').classList.add('hide');
  if (isMobile) closePanelSoft();
}
function exitLook() {
  $('#unit-view-bar').hidden = true;
  setView('orbit');
  if (state.tower) { W.towers[state.tower].hl.visible = true; if (state.floor) W.floorSlab.visible = true; }
  if (savedCam) { flyTo(savedCam.pos, savedCam.target, 1.6); savedCam = null; }
}
$('#unit-view-exit').onclick = exitLook;
const closePanelSoft = () => { panel.classList.remove('open'); };

function highlightZone(zid) {
  D.TOWERS.forEach((t) => (W.towers[t.id].hl.visible = (zid && t.zone === zid) || state.tower === t.id));
}
function flyToZone(zid) {
  const ts = D.TOWERS.filter((t) => t.zone === zid);
  const c = ts.reduce((a, t) => a.add(new V3(t.x, 0, t.z)), new V3()).divideScalar(ts.length);
  const h = Math.max(...ts.map((t) => W.towers[t.id].H));
  flyTo(new V3(c.x + 60, h * 1.2 + 60, c.z + h * 2.6 + 80), new V3(c.x, h * 0.45, c.z), 1.8);
  highlightZone(zid);
}
function showAmenity(a) {
  const p = new V3(...a.pos);
  flyTo(p.clone().add(new V3(70, 85, 150)), p, 1.8);
  Object.values(pinEls).forEach((el) => el.classList.remove('active'));
  pinEls[a.id]?.classList.add('active');
  openPanel('amenity', a);
}
function followLink(link) {
  const [kind, id] = link.split(':');
  if (kind === 'tower') selectTower(id);
  else showAmenity(D.AMENITIES.find((a) => a.id === id));
}

// ------------------------------------------------------------------ Nhãn 3D
function buildLabels() {
  for (const t of D.TOWERS) {
    const el = document.createElement('div');
    el.className = 'tag'; el.style.setProperty('--c', ZONE[t.zone].color);
    el.innerHTML = `<b>${t.id}</b><span class="tag-more">${ZONE[t.zone].name}<br><small>Còn ${towerAvail(t.id)} căn trống</small></span>`;
    el.onclick = () => selectTower(t.id);
    const o = new CSS2DObject(el); o.center.set(0.5, 1); o.position.copy(W.towers[t.id].top); scene.add(o);
    tagEls[t.id] = el;
  }
  for (const a of D.AMENITIES) {
    const el = document.createElement('div');
    el.className = 'pin'; el.innerHTML = `<i>${icon(a.icon)}</i><span>${a.name}</span>`;
    el.onclick = () => showAmenity(a);
    const o = new CSS2DObject(el); o.center.set(0.5, 1); o.position.set(...a.pos); scene.add(o);
    pinEls[a.id] = el;
  }
  // Liên kết vùng: các vòng cung phát sáng
  landmarkGroup = new THREE.Group(); landmarkGroup.visible = false; scene.add(landmarkGroup);
  const arcMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x36d6ff).multiplyScalar(2.2) });
  const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(4) });
  const C = new V3(0, 4, -60);
  landmarkGroup.userData.dots = [];
  for (const l of D.LANDMARKS) {
    const a = THREE.MathUtils.degToRad(l.angle);
    const end = new V3(Math.sin(a) * l.dist, 4, -Math.cos(a) * l.dist - 60);
    const mid = C.clone().add(end).multiplyScalar(0.5).setY(l.dist * 0.28);
    const curve = new THREE.QuadraticBezierCurve3(C, mid, end);
    landmarkGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 1.6, 6), arcMat));
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 40, 12), arcMat); beacon.position.copy(end).setY(20); landmarkGroup.add(beacon);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(4, 10, 8), dotMat); dot.userData.curve = curve; dot.userData.off = Math.random();
    landmarkGroup.add(dot); landmarkGroup.userData.dots.push(dot);
    const el = document.createElement('div'); el.className = 'landmark'; el.innerHTML = `<b>${l.time}</b>${l.name}`;
    const o = new CSS2DObject(el); o.center.set(0.5, 1); o.position.copy(end).setY(56); o.visible = false; scene.add(o); landmarkLabels.push(o);
  }
}

// ------------------------------------------------------------------ Tour 360°
const TP = Object.fromEntries(D.TOUR_POINTS.map((p) => [p.id, p]));
$('#tour-list').innerHTML = D.TOUR_POINTS.map((p) => `<button data-tp="${p.id}">${p.name}</button>`).join('');
$('#tour-list').onclick = (e) => { const b = e.target.closest('[data-tp]'); if (b) goTourPoint(b.dataset.tp); };
$('#tour-exit').onclick = () => setMode('model');
const texLoader = new THREE.TextureLoader();

function enterTour(id) {
  state.mode = 'tour';
  $$('.modes button').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'tour'));
  closePanel();
  $('#photo-view').hidden = true;
  $('#tour-bar').hidden = false; $('#unit-view-bar').hidden = true; $('#hint').classList.add('hide');
  document.body.classList.add('in-tour');
  savedCam = null;
  setView('look');
  goTourPoint(id || D.TOUR_POINTS[0].id);
}
function clearTourArrows() { tourArrows.forEach((o) => { o.element.remove(); scene.remove(o); }); tourArrows = []; }
function goTourPoint(id) {
  const p = TP[id]; state.tourPoint = id;
  const pos = new V3(...p.pos), look = new V3(...p.look);
  const target = pos.clone().add(look.clone().sub(pos).normalize().multiplyScalar(0.5));
  flyTo(pos, target, 2.2);
  $('#tour-name').textContent = p.name;
  $$('#tour-list button').forEach((b) => b.classList.toggle('active', b.dataset.tp === id));
  clearTourArrows();
  for (const lid of p.links) {
    const lp = TP[lid], el = document.createElement('div');
    el.className = 'tour-arrow'; el.innerHTML = `<i>➜</i><span>${lp.name}</span>`;
    el.onclick = () => goTourPoint(lid);
    const o = new CSS2DObject(el); o.center.set(0.5, 1); o.position.set(lp.pos[0], lp.pos[1] + 6, lp.pos[2]); scene.add(o); tourArrows.push(o);
  }
  // Ảnh panorama thật (nếu có)
  if (panoSphere) { scene.remove(panoSphere); panoSphere.material.map?.dispose(); panoSphere = null; }
  if (p.pano) {
    texLoader.load(p.pano, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      panoSphere = new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false }));
      panoSphere.scale.x = -1; panoSphere.renderOrder = 1000; panoSphere.position.copy(pos);
      if (state.tourPoint === id) scene.add(panoSphere);
    });
  }
  history.replaceState(null, '', '#tour=' + id);
}
function exitTour() {
  clearTourArrows();
  if (panoSphere) { scene.remove(panoSphere); panoSphere = null; }
  $('#tour-bar').hidden = true;
  document.body.classList.remove('in-tour');
  state.tourPoint = null;
  setView('orbit');
  flyTo(HOME.pos, HOME.target, 2);
  history.replaceState(null, '', location.pathname);
}

// ------------------------------------------------------------------ Ảnh thực tế (kéo / phóng to)
const photo = { s: 1, x: 0, y: 0, min: 1, w: 0, h: 0 };
const pv = $('#photo-view'), pc = $('#photo-canvas'), pimg = $('#photo-img');
$('#photo-hotspots').innerHTML = D.PHOTO_HOTSPOTS.map((h, i) => `<button class="photo-spot" data-spot="${i}" style="left:${h.x}%;top:${h.y}%"><i></i><span>${h.title}</span></button>`).join('');
function photoFit() {
  photo.w = pimg.naturalWidth || 1200; photo.h = pimg.naturalHeight || 1200;
  pimg.style.width = photo.w + 'px'; pimg.style.height = photo.h + 'px';
  photo.min = Math.min(innerWidth / photo.w, innerHeight / photo.h);
  photo.s = Math.max(innerWidth / photo.w, innerHeight / photo.h);
  photo.x = (innerWidth - photo.w * photo.s) / 2; photo.y = (innerHeight - photo.h * photo.s) / 2;
  photoApply();
}
function photoApply() {
  photo.s = THREE.MathUtils.clamp(photo.s, photo.min, photo.min * 5);
  const sw = photo.w * photo.s, sh = photo.h * photo.s;
  photo.x = sw <= innerWidth ? (innerWidth - sw) / 2 : THREE.MathUtils.clamp(photo.x, innerWidth - sw, 0);
  photo.y = sh <= innerHeight ? (innerHeight - sh) / 2 : THREE.MathUtils.clamp(photo.y, innerHeight - sh, 0);
  pc.style.transform = `translate(${photo.x}px,${photo.y}px) scale(${photo.s})`;
  $$('.photo-spot', pc).forEach((el) => (el.style.transform = `translate(-50%,-50%) scale(${1 / photo.s})`));
}
function photoZoom(f, cx = innerWidth / 2, cy = innerHeight / 2) {
  const ns = THREE.MathUtils.clamp(photo.s * f, photo.min, photo.min * 5), k = ns / photo.s;
  photo.x = cx - (cx - photo.x) * k; photo.y = cy - (cy - photo.y) * k; photo.s = ns; photoApply();
}
pimg.complete ? photoFit() : (pimg.onload = photoFit);
pv.addEventListener('wheel', (e) => { e.preventDefault(); photoZoom(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
const ptrs = new Map(); let pinch = null, dragMoved = 0;
pv.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.photo-zoom')) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragMoved = 0;
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; }
  pv.classList.add('dragging');
});
pv.addEventListener('pointermove', (e) => {
  const prev = ptrs.get(e.pointerId); if (!prev) return;
  const cur = { x: e.clientX, y: e.clientY }; ptrs.set(e.pointerId, cur);
  if (ptrs.size === 2 && pinch) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    photoZoom(d / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); pinch.d = d; dragMoved += 10;
  } else if (ptrs.size === 1) {
    photo.x += cur.x - prev.x; photo.y += cur.y - prev.y; dragMoved += Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y); photoApply();
  }
});
const ptrUp = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) pv.classList.remove('dragging'); };
pv.addEventListener('pointerup', ptrUp); pv.addEventListener('pointercancel', ptrUp);
pv.addEventListener('click', (e) => {
  const spot = e.target.closest('[data-spot]');
  if (spot && dragMoved < 8) openPanel('photoSpot', D.PHOTO_HOTSPOTS[+spot.dataset.spot]);
});
$$('[data-zoom]').forEach((b) => (b.onclick = () => (b.dataset.zoom === 'in' ? photoZoom(1.35) : b.dataset.zoom === 'out' ? photoZoom(1 / 1.35) : photoFit())));

// ------------------------------------------------------------------ Chế độ
function setMode(m) {
  if (m === state.mode) return;
  if (state.mode === 'tour' && m !== 'tour') { state.mode = m; exitTour(); }
  if (state.view === 'look' && m !== 'tour') exitLook();
  state.mode = m;
  $$('.modes button').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
  pv.hidden = m !== 'photo';
  $('#tools').style.visibility = m === 'photo' ? 'hidden' : '';
  $('#compass').style.visibility = m === 'photo' ? 'hidden' : '';
  if (m === 'photo') { closePanel(); photoFit(); $('#hint').textContent = 'Kéo để di chuyển • Cuộn/chụm để phóng to • Bấm vào điểm sáng để khám phá'; $('#hint').classList.remove('hide'); history.replaceState(null, '', '#anh'); }
  if (m === 'model') { $('#hint').textContent = 'Kéo để xoay • Cuộn để phóng to • Bấm vào tòa nhà để chọn căn'; if (location.hash === '#anh') history.replaceState(null, '', location.pathname); }
  if (m === 'tour') { state.mode = 'model'; enterTour(); }
}
$$('.modes button').forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));

// ------------------------------------------------------------------ Công cụ
$$('[data-theme]').forEach((b) => (b.onclick = () => setTheme(b.dataset.theme)));
function setTheme(name, instant) {
  state.theme = name;
  $$('[data-theme]').forEach((b) => b.classList.toggle('active', b.dataset.theme === name));
  themeFrom = themeNow; themeTo = toThemeState(THEMES[name]); themeT = instant ? 1 : 0;
  if (instant) { themeNow = themeTo; applyTheme(themeNow); }
}
$('#btn-rotate').onclick = (e) => { state.autoRotate = !state.autoRotate; e.currentTarget.classList.toggle('active', state.autoRotate); };
$('#btn-labels').onclick = (e) => { state.labels = !state.labels; e.currentTarget.classList.toggle('active', state.labels); document.body.classList.toggle('labels-off', !state.labels); };
$('#btn-full').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
$('#btn-reset').onclick = () => { if (state.mode === 'tour') return setMode('model'); if (state.view === 'look') { savedCam = null; exitLook(); } closePanel(); flyTo(HOME.pos, HOME.target, 1.8); };
const snapshots = [];
$('#btn-shot').onclick = () => {
  composer.render();
  const src = renderer.domElement.toDataURL('image/jpeg', 0.92);
  snapshots.push({ src, title: 'Ảnh chụp sa bàn ' + new Date().toLocaleTimeString('vi-VN') });
  const a = document.createElement('a'); a.href = src; a.download = `sa-ban-3d-${Date.now()}.jpg`; a.click();
  toast('Đã chụp & tải ảnh về máy (xem lại trong Thư viện)');
};
$('#qc-call').href = 'tel:' + D.PROJECT.hotline.replace(/\s/g, '');
$('#qc-call span').textContent = D.PROJECT.hotline;
$('#qc-zalo').href = D.PROJECT.zalo;

const lightbox = $('#lightbox');
function openLightbox(g) { $('#lightbox-img').src = g.src; $('#lightbox-cap').textContent = g.title; lightbox.hidden = false; }
lightbox.onclick = () => (lightbox.hidden = true);
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!lightbox.hidden) lightbox.hidden = true;
  else if (!modal.hidden) modal.hidden = true;
  else if (state.view === 'look' && state.mode !== 'tour') exitLook();
  else if (state.panel) closePanel();
});

let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200); }

function updateHash() {
  if (state.mode !== 'model') return;
  const h = state.tower ? `#toa=${state.tower}${state.floor ? '&tang=' + state.floor : ''}` : '';
  history.replaceState(null, '', h || location.pathname);
}

// ------------------------------------------------------------------ Tương tác 3D
const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
let hovered = null, mouseDirty = false, downAt = null;
const tooltip = $('#tooltip');
renderer.domElement.addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  mouseDirty = true;
  tooltip.style.left = e.clientX + 16 + 'px'; tooltip.style.top = e.clientY + 16 + 'px';
});
renderer.domElement.addEventListener('pointerleave', () => { setHover(null); });
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; markInteract(); });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6 || performance.now() - downAt.t > 500) return;
  if (state.view === 'look') return;
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  const id = pick();
  if (id) selectTower(id);
});
controls.addEventListener('start', markInteract);
function markInteract() { lastInteract = performance.now(); tween = null; $('#hint').classList.add('hide'); }

function pick() {
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(W.pickables, false)[0];
  return hit?.object.userData.towerId || null;
}
function setHover(id) {
  if (hovered === id) return;
  if (hovered && hovered !== state.tower) W.towers[hovered].hl.visible = false;
  hovered = id;
  renderer.domElement.style.cursor = id ? 'pointer' : '';
  if (!id) return tooltip.classList.remove('show');
  W.towers[id].hl.visible = true;
  const t = TOWER[id];
  tooltip.innerHTML = `<b>Tòa ${t.id} · ${ZONE[t.zone].name}</b><div class="muted">${t.floors} tầng • ${t.status === 'done' ? 'Hoàn thiện' : 'Đang xây dựng'}</div><div style="color:#3ddc84;margin-top:4px">Còn ${towerAvail(id)} căn trống – bấm để xem</div>`;
  tooltip.classList.add('show');
}

// ------------------------------------------------------------------ Vòng lặp
function applyTheme(v) {
  const u = W.sky.material.uniforms;
  u.topColor.value.copy(v.skyTop); u.midColor.value.copy(v.skyMid); u.horizonColor.value.copy(v.skyHorizon);
  u.groundColor.value.copy(v.skyGround); u.sunColor.value.copy(v.sunColor); u.sunDir.value.copy(v.sunDir);
  u.glow.value = v.glow; u.sunSize.value = v.sunSize;
  scene.fog.color.copy(v.fog); scene.fog.near = v.fogNear; scene.fog.far = v.fogFar;
  W.sun.color.copy(v.light); W.sun.intensity = v.lightInt;
  W.sun.position.copy(v.sunDir).multiplyScalar(1200).setY(Math.max(v.sunDir.y * 1200, 120));
  W.hemi.color.copy(v.hemiSky); W.hemi.groundColor.copy(v.hemiGround); W.hemi.intensity = v.hemiInt;
  W.windowMats.forEach((m) => (m.emissiveIntensity = v.windows));
  W.lampMats.forEach((m) => m.color.copy(m.userData.base).multiplyScalar(v.lamps));
  W.ledMats.forEach((m) => m.color.copy(m.userData.base).multiplyScalar(v.led));
  W.waterMats.forEach((m) => (m.emissiveIntensity = v.water));
  bloom.strength = v.bloom;
  renderer.toneMappingExposure = v.exposure;
}

const clock = new THREE.Clock();
const tmpP = new V3();
function animate() {
  requestAnimationFrame(animate);
  const rawDt = clock.getDelta(), dt = Math.min(rawDt, 0.05), time = clock.elapsedTime;
  if (state.mode === 'photo' && !document.hidden) return; // tiết kiệm pin khi xem ảnh

  if (themeT < 1) { themeT = Math.min(1, themeT + dt / 1.4); themeNow = lerpTheme(themeFrom, themeTo, ease(themeT)); applyTheme(themeNow); }

  if (tween) {
    tween.k = Math.min(1, tween.k + Math.min(rawDt, 0.2) / tween.dur);
    const k = ease(tween.k);
    camera.position.lerpVectors(tween.p0, tween.p1, k);
    camera.position.y += Math.sin(k * Math.PI) * tween.lift;
    controls.target.lerpVectors(tween.t0, tween.t1, k);
    if (tween.k >= 1) tween = null;
  }
  const idle = performance.now() - lastInteract > 9000;
  controls.autoRotate = !tween && idle && state.autoRotate && (state.view === 'orbit' || state.mode === 'tour') && modal.hidden;
  controls.autoRotateSpeed = state.view === 'look' ? -0.25 : 0.35;
  controls.update();
  if (state.view === 'orbit') {
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, -900, 900);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -900, 900);
    controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, 400);
    if (camera.position.y < 6) camera.position.y = 6;
  }

  if (mouseDirty && state.view === 'orbit' && !tween) { mouseDirty = false; setHover(pick()); }
  W.tick.forEach((f) => f(time));
  landmarkLabels.forEach((o) => (o.visible = landmarkGroup.visible && state.mode === 'model'));
  if (landmarkGroup.visible) landmarkGroup.userData.dots.forEach((d) => d.position.copy(d.userData.curve.getPoint((time * 0.25 + d.userData.off) % 1)));
  if (W.floorSlab.visible) W.floorSlab.children[0].material.opacity = 0.4 + Math.sin(time * 4) * 0.15;

  // sương mù giãn theo khoảng cách camera để nhìn xa (Vị trí) vẫn rõ
  const camDist = camera.position.distanceTo(controls.target);
  scene.fog.near = themeNow.fogNear + camDist * 0.8; scene.fog.far = themeNow.fogFar + camDist * 1.4;

  $('#compass .needle').style.transform = `rotate(${controls.getAzimuthalAngle()}rad)`;
  composer.render();
  labelRenderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
  if (state.mode === 'photo') photoFit();
});

// ------------------------------------------------------------------ Khởi động
async function init() {
  setProgress(12); await nextFrame();
  W = buildWorld(scene, renderer, { shadows: !isMobile, lowRes: isMobile, keepClear: D.TOUR_POINTS.map((p) => p.pos) });
  setProgress(62); await nextFrame();

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.7, 0.55, 0.82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  buildLabels();
  setTheme('sunset', true);
  setProgress(85); await nextFrame();
  renderer.compile(scene, camera);
  setProgress(100);
  animate();
  await nextFrame();
  $('#loader').classList.add('done');

  // deep link: #toa=S1&tang=12 | #tour=p-lake | #anh
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.has('toa') && TOWER[h.get('toa')]) {
    camera.position.copy(HOME.pos).add(new V3(300, 300, 300)); controls.target.copy(HOME.target);
    const f = +h.get('tang');
    selectTower(h.get('toa'), f >= 1 && f <= TOWER[h.get('toa')].floors ? f : null);
  } else if (h.has('tour')) {
    camera.position.copy(HOME.pos); controls.target.copy(HOME.target);
    setMode('tour'); goTourPoint(TP[h.get('tour')] ? h.get('tour') : D.TOUR_POINTS[0].id);
  } else if (location.hash === '#anh') {
    camera.position.copy(HOME.pos); controls.target.copy(HOME.target);
    setMode('photo');
  } else {
    flyTo(HOME.pos, HOME.target, 4.2);
  }
  lastInteract = performance.now();
  // tiện debug trên console trình duyệt
  window.sc3d = { THREE, scene, camera, controls, W, state, flyTo, selectTower, selectFloor, setTheme, setMode, openPanel, enterTour, HOME, skip: () => { if (tween) tween.k = 1; } };
}
init().then(() => { window.__appReady = true; }).catch((e) => { console.error(e); window.__appErr?.(e); });
