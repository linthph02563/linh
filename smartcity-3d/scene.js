// Dựng toàn bộ sa bàn 3D bằng hình khối thủ tục (không cần file model ngoài).
import * as THREE from './vendor/three.module.min.js';
import { Reflector } from './vendor/jsm/objects/Reflector.js';
import { TOWERS, ZONES } from './data.js';

export const FLOOR_H = 3;
export const PODIUM_H = 8;

const V3 = THREE.Vector3;

export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pointInPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// ---------- Mặt bằng tổng thể ----------
const LAKE_CTRL = [[-240, 150], [-218, 62], [-150, 18], [-60, -2], [40, -12], [120, -4], [188, 22], [214, 62],
  [204, 100], [172, 116], [128, 168], [46, 202], [-80, 212], [-185, 200]];
const PARK_POLY = [[-262, 330], [-150, -158], [236, -158], [236, 330]];
const BOULEVARD = [[-430, 320], [-60, -430]];
const BRIDGE_CTRL = [[66, -9], [122, 22], [148, 66], [160, 108], [166, 138]];
const AMPHI = { x: 20, z: -82 };
const POOL = { x: 20, z: -48, r: 14 };
const PITCH = { x: 128, z: -96, w: 54, d: 34 };
const PLATFORM = { x: 168, z: 152, r: 20 };

const lakeCurve = new THREE.CatmullRomCurve3(LAKE_CTRL.map(([x, z]) => new V3(x, 0, z)), true, 'centripetal');
const LAKE_PTS = lakeCurve.getSpacedPoints(180).map((p) => [p.x, p.z]);
export const inLake = (x, z) => pointInPoly(x, z, LAKE_PTS);

// ---------- Texture thủ tục ----------
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// Mặt đứng tòa: 8 cột cửa x 16 tầng mỗi ô lặp
function facadeTextures(seed, wall = '#d8d2c8', litRatio = 0.3) {
  const r = mulberry32(seed);
  const cols = 8, rows = 16, W = 256, H = 512, cw = W / cols, rh = H / rows;
  const lit = [];
  for (let i = 0; i < cols * rows; i++) lit.push(r() < litRatio ? 0.45 + r() * 0.55 : 0);
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) {
      g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, y * rh + rh - 3, W, 3); // gờ sàn
      for (let x = 0; x < cols; x++) {
        const k = 40 + r() * 30;
        const grad = g.createLinearGradient(0, y * rh, 0, y * rh + rh);
        grad.addColorStop(0, `rgb(${k + 30},${k + 42},${k + 58})`);
        grad.addColorStop(1, `rgb(${k},${k + 8},${k + 20})`);
        g.fillStyle = grad;
        g.fillRect(x * cw + 4, y * rh + 4, cw - 8, rh - 9);
        if (x % 2 === 0) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x * cw + 2, y * rh + rh - 6, cw - 4, 2); } // ban công
      }
    }
  });
  const emissive = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = lit[y * cols + x];
      if (!v) continue;
      const warm = r() < 0.8;
      g.fillStyle = warm ? `rgba(255,${190 + r() * 40 | 0},${120 + r() * 60 | 0},${v})` : `rgba(210,230,255,${v})`;
      g.fillRect(x * cw + 4, y * rh + 4, cw - 8, rh - 9);
    }
  });
  return { map, emissive, cols, rows };
}

function latticeTex() {
  return canvasTex(32, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#fff'; g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h / 2); g.lineTo(0, h); g.stroke();
  });
}

function skeletonTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#8d8a86';
    g.fillRect(0, h - 10, w, 10); // sàn bê tông
    g.fillRect(0, 0, 8, h); g.fillRect(w / 2 - 4, 0, 8, h); // cột
  });
}

function groundTexture() {
  const S = 2048, EXT = 1800, k = S / EXT;
  const P = (x, z) => [(x + EXT / 2) * k, (z + EXT / 2) * k];
  const r = mulberry32(7);
  return canvasTex(S, S, (g) => {
    g.fillStyle = '#3b3d35'; g.fillRect(0, 0, S, S);
    // ruộng / đất trống phía xa
    for (let i = 0; i < 160; i++) {
      const x = -900 + r() * 1800, z = -900 + r() * 1800;
      g.fillStyle = ['#454a3a', '#3f4435', '#4d4a3e', '#38402f'][i % 4];
      const [px, pz] = P(x, z); g.fillRect(px, pz, (30 + r() * 90) * k, (30 + r() * 90) * k);
    }
    const poly = (pts, fill) => { g.beginPath(); pts.forEach(([x, z], i) => { const [a, b] = P(x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.closePath(); g.fillStyle = fill; g.fill(); };
    const line = (pts, width, stroke, dash) => {
      g.beginPath(); pts.forEach(([x, z], i) => { const [a, b] = P(x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); });
      g.lineWidth = width * k; g.strokeStyle = stroke; g.setLineDash(dash ? dash.map((d) => d * k) : []); g.lineCap = 'round'; g.stroke(); g.setLineDash([]);
    };
    // công viên
    poly(PARK_POLY, '#3d6534');
    for (let i = 0; i < 90; i++) {
      const x = -230 + r() * 460, z = -150 + r() * 470;
      const [px, pz] = P(x, z); g.fillStyle = r() < 0.5 ? 'rgba(90,130,60,.35)' : 'rgba(40,70,35,.35)';
      g.beginPath(); g.arc(px, pz, (8 + r() * 25) * k, 0, 7); g.fill();
    }
    // công trường bên trái
    poly([[-520, -130], [-290, -130], [-250, 130], [-520, 130]], '#857560');
    for (let i = 0; i < 25; i++) { const [px, pz] = P(-510 + r() * 240, -120 + r() * 240); g.fillStyle = r() < .5 ? '#9a8a70' : '#6f634f'; g.fillRect(px, pz, 20 * k, 14 * k); }
    // khu dân cư hiện hữu bên phải
    poly([[244, -240], [620, -240], [620, 420], [244, 420]], '#4a4541');
    poly([[-620, 150], [-330, 150], [-420, 420], [-620, 420]], '#4a4541');
    // nền các tòa
    TOWERS.forEach((t) => { const [px, pz] = P(t.x - t.w / 2 - 12, t.z - t.d / 2 - 12); g.fillStyle = '#8f8a80'; g.fillRect(px, pz, (t.w + 24) * k, (t.d + 24) * k); });
    poly([[-340, -270], [-190, -270], [-170, -160], [-340, -160]], '#5d6152');
    // đường
    line(BOULEVARD, 44, '#2a2c32'); line(BOULEVARD, 4, '#3c6a35');
    line(BOULEVARD.map(([x, z]) => [x - 11, z - 3]), .6, 'rgba(255,255,255,.5)', [6, 8]);
    line(BOULEVARD.map(([x, z]) => [x + 11, z + 3]), .6, 'rgba(255,255,255,.5)', [6, 8]);
    line([[-180, -158], [460, -158]], 18, '#2c2e33');
    line([[-180, -158], [460, -158]], .5, 'rgba(255,255,255,.45)', [6, 8]);
    line([[248, 460], [252, -460]], 14, '#2c2e33');
    line([[-60, -430], [-60, -900]], 30, '#2a2c32');
    line([[252, -320], [-600, -330]], 16, '#2c2e33');
    for (let z = -220; z < 420; z += 46) line([[256, z], [620, z + 6]], 6, '#34353a');
    // lối dạo bao quanh hồ
    line([...LAKE_PTS, LAKE_PTS[0]], 22, '#b9ad97');
    // đường dạo uốn lượn trong công viên
    g.lineJoin = 'round';
    [[[-200, -140], [-120, -60], [-60, -30], [20, -30]], [[20, -30], [80, -40], [130, -60], [200, -140]],
      [[-140, 250], [-60, 270], [60, 260], [180, 230]], [[200, 160], [225, 240], [200, 320]], [[-220, 240], [-250, 300]]]
      .forEach((pts) => line(pts, 5, '#c8bca2'));
    // quảng trường
    const [ax, az] = P(AMPHI.x, AMPHI.z); g.fillStyle = '#cfc5b2'; g.beginPath(); g.arc(ax, az + 18 * k, 62 * k, 0, 7); g.fill();
    const [lx, lz] = P(-40, -14); g.fillStyle = '#d3c9b6'; g.beginPath(); g.arc(lx, lz, 20 * k, 0, 7); g.fill();
  });
}

function pitchTexture() {
  return canvasTex(512, 320, (g, w, h) => {
    for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#3f8f3a' : '#479a40'; g.fillRect((i * w) / 10, 0, w / 10 + 1, h); }
    g.strokeStyle = '#eef'; g.lineWidth = 4;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w / 2, h - 10); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, 40, 0, 7); g.stroke();
    g.strokeRect(10, h / 2 - 70, 70, 140); g.strokeRect(w - 80, h / 2 - 70, 70, 140);
  });
}

// ---------- Bầu trời ----------
// Tán cọ: 8 lá dài rủ xuống, gộp thành một geometry
function palmCrownGeometry() {
  const pos = [], nor = [];
  for (let i = 0; i < 8; i++) {
    const g = new THREE.BoxGeometry(5.2, 0.15, 1.1).toNonIndexed();
    g.translate(2.6, 0, 0);
    g.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.45 - (i % 2) * 0.2));
    g.applyMatrix4(new THREE.Matrix4().makeRotationY((i / 8) * Math.PI * 2));
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return geo;
}

function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      topColor: { value: new THREE.Color() }, midColor: { value: new THREE.Color() }, horizonColor: { value: new THREE.Color() },
      groundColor: { value: new THREE.Color() }, sunColor: { value: new THREE.Color() }, sunDir: { value: new V3(0, 1, 0) },
      glow: { value: 1 }, sunSize: { value: 1 },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 topColor, midColor, horizonColor, groundColor, sunColor, sunDir; uniform float glow, sunSize;
      varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 c = mix(horizonColor, midColor, smoothstep(0.0, 0.2, h));
        c = mix(c, topColor, smoothstep(0.16, 0.7, h));
        c = mix(c, groundColor, smoothstep(0.0, -0.06, h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunColor * (pow(s, 5.0) * 0.35 * glow + pow(s, 48.0) * 0.7 * glow + pow(s, 900.0) * sunSize);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 48, 24), mat);
  sky.renderOrder = -1;
  return sky;
}

// ---------- Cần cẩu ----------
function makeCrane(h, jib, mats) {
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  add(new THREE.BoxGeometry(2.4, h, 2.4), mats.lattice, 0, h / 2, 0);
  add(new THREE.BoxGeometry(jib, 1.8, 1.8), mats.latticeH, jib * 0.32, h, 0);
  add(new THREE.BoxGeometry(jib * 0.34, 1.8, 2.6), mats.latticeH, -jib * 0.3, h, 0);
  add(new THREE.BoxGeometry(5, 3.2, 3.2), mats.concrete, -jib * 0.43, h - 1.4, 0);
  add(new THREE.BoxGeometry(3, 3, 3), mats.cab, 2, h - 2.4, 2.4);
  add(new THREE.ConeGeometry(1.8, 9, 4), mats.lattice, 0, h + 5.4, 0);
  add(new THREE.BoxGeometry(0.15, h * 0.3, 0.15), mats.cab, jib * 0.62, h - h * 0.15, 0);
  const l1 = add(new THREE.SphereGeometry(0.8, 8, 6), mats.red, 0, h + 10.2, 0);
  const l2 = add(new THREE.SphereGeometry(0.8, 8, 6), mats.red, jib * 0.82, h + 1, 0);
  l1.castShadow = l2.castShadow = false;
  return g;
}

// ---------- Build ----------
export function buildWorld(scene, renderer, opts = {}) {
  const r = mulberry32(2024);
  const W = { towers: {}, pickables: [], windowMats: [], lampMats: [], ledMats: [], waterMats: [], jets: [], tick: [] };

  // Bầu trời + ánh sáng
  W.sky = makeSky(); scene.add(W.sky);
  W.hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1); scene.add(W.hemi);
  W.sun = new THREE.DirectionalLight(0xffffff, 2);
  W.sun.castShadow = !!opts.shadows;
  W.sun.shadow.mapSize.set(2048, 2048);
  Object.assign(W.sun.shadow.camera, { left: -650, right: 650, top: 650, bottom: -650, near: 10, far: 2600 });
  W.sun.shadow.bias = -0.0004; W.sun.shadow.normalBias = 0.6;
  scene.add(W.sun, W.sun.target);

  // Mặt đất
  const groundTex = groundTexture();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshStandardMaterial({ color: 0x34362f, roughness: 1 }));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.2; scene.add(outer);

  // ---------- Hồ (mặt nước phản chiếu) ----------
  const lakeShape = new THREE.Shape(LAKE_PTS.map(([x, z]) => new THREE.Vector2(x, -z)));
  const lakeGeo = new THREE.ShapeGeometry(lakeShape, 4);
  const pr = Math.min(window.devicePixelRatio, 2) * (opts.lowRes ? 0.35 : 0.6);
  W.lake = new Reflector(lakeGeo, { textureWidth: innerWidth * pr, textureHeight: innerHeight * pr, color: 0x8c96a6, clipBias: 0.003 });
  W.lake.rotation.x = -Math.PI / 2; W.lake.position.y = 0.3; scene.add(W.lake);
  const tint = new THREE.Mesh(lakeGeo, new THREE.MeshStandardMaterial({ color: 0x0d2233, transparent: true, opacity: 0.28, roughness: 0.15, metalness: 0.2 }));
  tint.rotation.x = -Math.PI / 2; tint.position.y = 0.45; scene.add(tint);

  // Bờ hồ
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xd6ccb8, roughness: 0.8 });
  const edge = new THREE.Mesh(new THREE.TubeGeometry(lakeCurve, 300, 1.1, 6, true), edgeMat);
  edge.position.y = 0.4; edge.scale.y = 0.5; scene.add(edge);

  // ---------- Vật liệu dùng chung ----------
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd08a }); lampMat.userData.base = new THREE.Color(0xffd08a); W.lampMats.push(lampMat);
  const lampMatOrange = new THREE.MeshBasicMaterial({ color: 0xff9a3c }); lampMatOrange.userData.base = new THREE.Color(0xff9a3c); W.lampMats.push(lampMatOrange);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xfff1d2 }); ledMat.userData.base = new THREE.Color(0xfff1d2); W.ledMats.push(ledMat);
  const latTex = latticeTex(); latTex.repeat.set(1, 18);
  const latTexH = latticeTex(); latTexH.rotation = Math.PI / 2; latTexH.repeat.set(1, 16);
  const craneMats = {
    lattice: new THREE.MeshStandardMaterial({ color: 0xe9b437, map: latTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }),
    latticeH: new THREE.MeshStandardMaterial({ color: 0xe9b437, map: latTexH, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x8a8a8a }),
    cab: new THREE.MeshStandardMaterial({ color: 0xdedede }),
    red: new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a2a).multiplyScalar(4) }),
  };

  // Đèn (instanced)
  const lampPts = [], lampPtsOrange = [];
  const lampGeo = new THREE.SphereGeometry(0.7, 8, 6);
  const keepClear = opts.keepClear || [];
  const placeLamps = (mat, all) => {
    const pts = all.filter((p) => keepClear.every((c) => Math.hypot(p[0] - c[0], p[2] - c[2]) > 14));
    const im = new THREE.InstancedMesh(lampGeo, mat, pts.length);
    const m = new THREE.Matrix4();
    pts.forEach((p, i) => { m.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(i, m); });
    scene.add(im);
  };

  // ven hồ
  const lakeTot = lakeCurve.getLength();
  for (let s = 0; s < lakeTot; s += 11) {
    const t = s / lakeTot, p = lakeCurve.getPointAt(t), tg = lakeCurve.getTangentAt(t);
    let n = new V3(tg.z, 0, -tg.x);
    if (inLake(p.x + n.x * 5, p.z + n.z * 5)) n.negate();
    lampPts.push([p.x + n.x * 9, 4.2, p.z + n.z * 9]);
  }
  // đại lộ & đường nội khu
  const [b0, b1] = BOULEVARD.map(([x, z]) => new V3(x, 0, z));
  const bDir = b1.clone().sub(b0), bLen = bDir.length(); bDir.normalize();
  const bN = new V3(-bDir.z, 0, bDir.x);
  for (let s = 0; s < bLen; s += 18) for (const off of [-20, -2, 2, 20]) {
    const p = b0.clone().addScaledVector(bDir, s).addScaledVector(bN, off);
    (Math.abs(off) > 10 ? lampPtsOrange : lampPts).push([p.x, Math.abs(off) > 10 ? 6 : 5, p.z]);
  }
  for (let x = -170; x < 460; x += 16) { lampPts.push([x, 5, -168]); lampPts.push([x + 8, 5, -148]); }
  for (let z = -440; z < 460; z += 14) lampPtsOrange.push([242 + (z % 28 ? 0 : 0), 5, z]);
  for (let x = -590; x < 250; x += 18) lampPtsOrange.push([x, 5, -322]);
  // quanh quảng trường + đường dạo
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) lampPts.push([AMPHI.x + Math.cos(a) * 62, 4, AMPHI.z + 18 + Math.sin(a) * 62]);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) lampPts.push([-40 + Math.cos(a) * 20, 3, -14 + Math.sin(a) * 20]);

  // ---------- Cầu dạo ánh sáng ----------
  const bridgeCurve = new THREE.CatmullRomCurve3(BRIDGE_CTRL.map(([x, z]) => new V3(x, 1.6, z)));
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xcdbfa8, roughness: 0.7 });
  const bSteps = 140, deckGeo = new THREE.BoxGeometry(1, 0.8, 7);
  const deck = new THREE.InstancedMesh(deckGeo, deckMat, bSteps);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3();
  const sideL = [], sideR = [];
  for (let i = 0; i < bSteps; i++) {
    const t = i / (bSteps - 1), p = bridgeCurve.getPointAt(t), tg = bridgeCurve.getTangentAt(t);
    q.setFromUnitVectors(new V3(1, 0, 0), tg);
    sc.set(bridgeCurve.getLength() / bSteps + 0.6, 1, 1);
    mtx.compose(p, q, sc); deck.setMatrixAt(i, mtx);
    const n = new V3(-tg.z, 0, tg.x);
    sideL.push(p.clone().addScaledVector(n, 3.6).setY(2.4));
    sideR.push(p.clone().addScaledVector(n, -3.6).setY(2.4));
  }
  deck.castShadow = true; scene.add(deck);
  [sideL, sideR].forEach((pts) => scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.4, 6), ledMat)));

  // ---------- Đảo chòi nghỉ ----------
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(PLATFORM.r, PLATFORM.r + 1, 1.4, 48), deckMat);
  plat.position.set(PLATFORM.x, 0.7, PLATFORM.z); plat.receiveShadow = true; scene.add(plat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(PLATFORM.r + 0.6, 0.35, 6, 80), ledMat);
  ring.rotation.x = Math.PI / 2; ring.position.set(PLATFORM.x, 1.6, PLATFORM.z); scene.add(ring);
  [[0, 0, 0x2f6fd6], [-9, 6, 0x2f6fd6], [8, -7, 0xd64545], [9, 8, 0xe8e8e8]].forEach(([dx, dz, col]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 6), craneMats.cab); pole.position.set(PLATFORM.x + dx, 4, PLATFORM.z + dz); scene.add(pole);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6, 2.4, 4), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }));
    roof.position.set(PLATFORM.x + dx, 7.6, PLATFORM.z + dz); roof.rotation.y = Math.PI / 4; roof.castShadow = true; scene.add(roof);
  });

  // ---------- Quảng trường khán đài ----------
  const tierMat = new THREE.MeshStandardMaterial({ color: 0xece7dd, roughness: 0.7 });
  for (let i = 0; i < 8; i++) {
    const r1 = 30 + i * 3.2, r2 = r1 + 3.4;
    const s = new THREE.Shape();
    s.absarc(0, 0, r2, 0.1, Math.PI - 0.1, false);
    s.absarc(0, 0, r1, Math.PI - 0.1, 0.1, true);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.8 + i * 0.9, bevelEnabled: false, curveSegments: 40 });
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, tierMat); m.position.set(AMPHI.x, 0, AMPHI.z + 18); m.castShadow = m.receiveShadow = true; scene.add(m);
  }
  // hồ nhạc nước
  const poolMat = new THREE.MeshStandardMaterial({ color: 0x3fb7ff, emissive: 0x1d8fe0, emissiveIntensity: 0.6, roughness: 0.1 });
  W.waterMats.push(poolMat);
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(POOL.r, POOL.r, 0.8, 48), poolMat);
  pool.position.set(POOL.x, 0.4, POOL.z); scene.add(pool);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(POOL.r, 0.7, 6, 60), tierMat); rim.rotation.x = Math.PI / 2; rim.position.set(POOL.x, 0.8, POOL.z); scene.add(rim);
  const jetMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfe9ff).multiplyScalar(1.6), transparent: true, opacity: 0.75 });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, jr = i % 2 ? 9 : 5;
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.5, 1, 6), jetMat);
    jet.position.set(POOL.x + Math.cos(a) * jr, 0, POOL.z + Math.sin(a) * jr); jet.userData.phase = i * 0.6;
    scene.add(jet); W.jets.push(jet);
  }
  const cJet = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.9, 1, 8), jetMat); cJet.position.set(POOL.x, 0, POOL.z); cJet.userData.phase = 0; cJet.userData.big = true; scene.add(cJet); W.jets.push(cJet);

  // ---------- Sân bóng + khu vui chơi ----------
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(PITCH.w, PITCH.d), new THREE.MeshStandardMaterial({ map: pitchTexture(), roughness: 0.9 }));
  pitch.rotation.set(-Math.PI / 2, 0, -0.12); pitch.position.set(PITCH.x, 0.15, PITCH.z); pitch.receiveShadow = true; scene.add(pitch);
  ['#ff6b6b', '#ffd166', '#4ecdc4', '#5b8cff', '#ff9f43'].forEach((c, i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(4 + (i % 2) * 3, 2 + (i % 3), 4), new THREE.MeshStandardMaterial({ color: c }));
    b.position.set(88 + i * 6, 1.5, -70 + (i % 2) * 6); b.castShadow = true; scene.add(b);
  });

  // ---------- Tòa căn hộ ----------
  const facadeSets = [facadeTextures(11), facadeTextures(23, '#e3ddd3'), facadeTextures(37, '#cfc8bd')];
  const podiumMat = new THREE.MeshStandardMaterial({ color: 0xcfc5b5, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x9a958d, roughness: 0.9 });
  const skTex = skeletonTex();
  const zoneColor = Object.fromEntries(ZONES.map((z) => [z.id, new THREE.Color(z.color)]));

  const makeFacadeMat = (set, w, floors, seedOffset) => {
    const map = set.map.clone(), em = set.emissive.clone();
    [map, em].forEach((t) => { t.repeat.set(w / 15, floors / set.rows); t.offset.set(seedOffset % 1, (seedOffset * 7) % 1); t.needsUpdate = true; });
    const mat = new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: 0xffe2b8, emissiveIntensity: 1, roughness: 0.55, metalness: 0.15 });
    W.windowMats.push(mat);
    return mat;
  };

  TOWERS.forEach((def, idx) => {
    const g = new THREE.Group(); g.position.set(def.x, 0, def.z);
    const built = def.status === 'building' ? def.builtFloors : def.floors;
    const H = def.floors * FLOOR_H, BH = built * FLOOR_H;
    const podium = new THREE.Mesh(new THREE.BoxGeometry(def.w + 12, PODIUM_H, def.d + 12), podiumMat);
    podium.position.y = PODIUM_H / 2; podium.castShadow = podium.receiveShadow = true; g.add(podium);

    const body = new THREE.Mesh(new THREE.BoxGeometry(def.w, BH, def.d), makeFacadeMat(facadeSets[idx % 3], def.w, built, idx * 0.37));
    body.position.y = PODIUM_H + BH / 2; body.castShadow = body.receiveShadow = true; g.add(body);
    body.userData.towerId = def.id; W.pickables.push(body);

    if (def.status === 'building') {
      const skH = H - BH;
      const t = skTex.clone(); t.repeat.set(def.w / 8, skH / FLOOR_H); t.needsUpdate = true;
      const sk = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.5, skH, def.d - 0.5),
        new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.4, side: THREE.DoubleSide, color: 0xb9b4ac }));
      sk.position.y = PODIUM_H + BH + skH / 2; sk.castShadow = true; g.add(sk);
      sk.userData.towerId = def.id; W.pickables.push(sk);
      const crane = makeCrane(H - BH + 34, 58, craneMats);
      crane.position.set(def.w * 0.15, PODIUM_H + BH - 6, 0); crane.rotation.y = r() * Math.PI * 2; g.add(crane);
    } else {
      const crown = new THREE.Mesh(new THREE.BoxGeometry(def.w * 0.62, 7, def.d * 0.5), roofMat);
      crown.position.y = PODIUM_H + BH + 3.5; crown.castShadow = true; g.add(crown);
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(def.w + 0.6, 1.4, def.d + 0.6), podiumMat);
      parapet.position.y = PODIUM_H + BH + 0.7; g.add(parapet);
    }
    if (def.led) {
      [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 1]].forEach(([sx, sz]) => {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.7, BH, 0.7), ledMat);
        s.position.set(sx * (def.w / 2 + 0.2) + (sx === 0 ? -def.w * 0.18 : 0), PODIUM_H + BH / 2, sz * (def.d / 2 + 0.2)); g.add(s);
      });
    }

    // highlight
    const hlGeo = new THREE.BoxGeometry(def.w + 1.6, H + 1, def.d + 1.6);
    const zc = zoneColor[def.zone];
    const hl = new THREE.Group();
    hl.add(new THREE.Mesh(hlGeo, new THREE.MeshBasicMaterial({ color: zc, transparent: true, opacity: 0.16, depthWrite: false })));
    hl.add(new THREE.LineSegments(new THREE.EdgesGeometry(hlGeo), new THREE.LineBasicMaterial({ color: zc.clone().multiplyScalar(2.5) })));
    hl.position.y = PODIUM_H + H / 2; hl.visible = false; g.add(hl);

    scene.add(g);
    W.towers[def.id] = { def, group: g, hl, H, top: new V3(def.x, PODIUM_H + H + 10, def.z) };
  });

  // tầng đang chọn
  const slabGeo = new THREE.BoxGeometry(1, 1, 1);
  W.floorSlab = new THREE.Group();
  W.floorSlab.add(new THREE.Mesh(slabGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0x36d6ff).multiplyScalar(1.2), transparent: true, opacity: 0.55, depthWrite: false })));
  W.floorSlab.add(new THREE.LineSegments(new THREE.EdgesGeometry(slabGeo), new THREE.LineBasicMaterial({ color: new THREE.Color(0x9ff0ff).multiplyScalar(3) })));
  W.floorSlab.visible = false; scene.add(W.floorSlab);

  // Trường học (khối trắng)
  const schoolSet = facadeTextures(55, '#f1efe9', 0.25);
  const school = new THREE.Mesh(new THREE.BoxGeometry(110, 18, 30), makeFacadeMat(schoolSet, 110, 5, 0.2));
  school.position.set(112, 9, -192); school.castShadow = school.receiveShadow = true; scene.add(school);
  const school2 = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 26), makeFacadeMat(schoolSet, 40, 4, 0.5));
  school2.position.set(40, 6, -196); school2.castShadow = true; scene.add(school2);

  // Các tòa nền phía xa (không chọn được)
  const bgSets = [facadeTextures(71, '#cbc6be', 0.3), facadeTextures(83, '#bdb9b3', 0.3)];
  [[-430, -350, 26, 120], [-475, -300, 24, 105], [-390, -420, 30, 132], [-150, -560, 28, 96], [-100, -600, 24, 90],
    [330, -430, 28, 110], [380, -470, 26, 96], [520, -380, 30, 80], [-640, -120, 26, 100], [-700, -60, 24, 84], [0, -720, 34, 140]]
    .forEach(([x, z, w, h], i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.75), makeFacadeMat(bgSets[i % 2], w, h / FLOOR_H, i * 0.21));
      m.position.set(x, h / 2, z); m.castShadow = true; scene.add(m);
    });

  // Cần cẩu công trường
  [[-170, -110, 70], [-120, -60, 60], [-420, -30, 55], [-360, 60, 50]].forEach(([x, z, h]) => {
    const c = makeCrane(h, 50, craneMats); c.position.set(x, 0, z); c.rotation.y = r() * 6; scene.add(c);
  });
  // khung bê tông đang xây
  for (let i = 0; i < 6; i++) {
    const h = 6 + r() * 18, t = skTex.clone(); t.repeat.set(3, h / FLOOR_H); t.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.BoxGeometry(24, h, 18), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.4, side: THREE.DoubleSide, color: 0xb9b4ac }));
    m.position.set(-500 + i * 38, h / 2, -100 + (i % 3) * 60); m.castShadow = true; scene.add(m);
  }

  // ---------- Nhà thấp tầng (instanced) ----------
  const houseSet = facadeTextures(91, '#e8dccb', 0.42);
  houseSet.map.repeat.set(0.35, 0.3); houseSet.emissive.repeat.set(0.35, 0.3);
  const houseMat = new THREE.MeshStandardMaterial({ map: houseSet.map, emissiveMap: houseSet.emissive, emissive: 0xffc27a, roughness: 0.85 });
  W.windowMats.push(houseMat);
  const houses = [];
  const addHouses = (x0, x1, z0, z1, step, avoid) => {
    for (let x = x0; x < x1; x += step) for (let z = z0; z < z1; z += step) {
      if (r() < 0.12) continue;
      const px = x + (r() - 0.5) * 4, pz = z + (r() - 0.5) * 4;
      if (avoid && avoid(px, pz)) continue;
      houses.push([px, pz, 7 + r() * 5, 8 + r() * 5, 6 + Math.floor(r() * 5) * 3.2]);
    }
  };
  addHouses(262, 620, -232, 420, 14, (x, z) => Math.abs(((z + 220) % 46)) < 8);
  addHouses(-620, -400, 160, 420, 14, (x, z) => x > -430 + (z - 160) * -0.35 + 40);
  addHouses(-900, 900, -900, -520, 26, (x, z) => r() < 0.4);
  const hGeo = new THREE.BoxGeometry(1, 1, 1); hGeo.translate(0, 0.5, 0);
  const hIm = new THREE.InstancedMesh(hGeo, houseMat, houses.length);
  const roofIm = new THREE.InstancedMesh(hGeo, new THREE.MeshStandardMaterial({ color: 0xa04a3a, roughness: 0.9 }), houses.length);
  const pal = [0xe7dccb, 0xf0e8dc, 0xd8c7ad, 0xe2d2bc, 0xcdbba0, 0xf3efe7].map((c) => new THREE.Color(c));
  houses.forEach(([x, z, w, d, h], i) => {
    mtx.compose(new V3(x, 0, z), q.identity(), new V3(w, h, d)); hIm.setMatrixAt(i, mtx); hIm.setColorAt(i, pal[i % pal.length]);
    const hasRoof = r() < 0.45;
    mtx.compose(new V3(x, h, z), q.identity(), hasRoof ? new V3(w * 0.9, 1.4, d * 0.9) : new V3(0, 0, 0)); roofIm.setMatrixAt(i, mtx);
  });
  hIm.castShadow = hIm.receiveShadow = true; scene.add(hIm, roofIm);

  // Thành phố phía xa
  const bgCity = [];
  for (let i = 0; i < 520; i++) {
    const a = r() * Math.PI * 2, d = 950 + r() * 1700;
    const tall = r() < 0.18;
    bgCity.push([Math.cos(a) * d, Math.sin(a) * d, 14 + r() * 26, tall ? 50 + r() * 110 : 8 + r() * 30]);
  }
  const cityMat = new THREE.MeshStandardMaterial({ map: bgSets[0].map.clone(), emissiveMap: bgSets[0].emissive.clone(), emissive: 0xffd29a, roughness: 0.9 });
  [cityMat.map, cityMat.emissiveMap].forEach((t) => { t.repeat.set(0.6, 1.2); t.needsUpdate = true; });
  W.windowMats.push(cityMat);
  const cIm = new THREE.InstancedMesh(hGeo, cityMat, bgCity.length);
  bgCity.forEach(([x, z, w, h], i) => { mtx.compose(new V3(x, 0, z), q.identity(), new V3(w, h, w * 0.8)); cIm.setMatrixAt(i, mtx); });
  scene.add(cIm);

  // ---------- Cây xanh ----------
  const trees = [], palms = [];
  const tooClose = (x, z) =>
    inLake(x, z) || Math.hypot(x - AMPHI.x, z - AMPHI.z - 18) < 64 || Math.hypot(x - PLATFORM.x, z - PLATFORM.z) < 24 ||
    (Math.abs(x - PITCH.x) < 34 && Math.abs(z - PITCH.z) < 24) || Math.hypot(x + 40, z + 14) < 22;
  const distToLake = (x, z) => { let m = 1e9; for (let i = 0; i < LAKE_PTS.length; i += 2) m = Math.min(m, Math.hypot(x - LAKE_PTS[i][0], z - LAKE_PTS[i][1])); return m; };
  let tries = 0;
  while (trees.length < 1100 && tries++ < 12000) {
    const x = -262 + r() * 498, z = -150 + r() * 480;
    if (!pointInPoly(x, z, PARK_POLY) || tooClose(x, z) || distToLake(x, z) < 14) continue;
    // chừa khoảng thoáng cho đường dạo
    if (r() < 0.35 && distToLake(x, z) > 60) continue;
    trees.push([x, z, 2.6 + r() * 2.6]);
  }
  for (let s = 0; s < lakeTot; s += 13) {
    const t = s / lakeTot, p = lakeCurve.getPointAt(t), tg = lakeCurve.getTangentAt(t);
    let n = new V3(tg.z, 0, -tg.x); if (inLake(p.x + n.x * 5, p.z + n.z * 5)) n.negate();
    palms.push([p.x + n.x * 15, p.z + n.z * 15, 0.9 + r() * 0.4]);
  }
  for (let s = 0; s < bLen; s += 12) for (const off of [-26, -14, 0, 14, 26]) {
    const p = b0.clone().addScaledVector(bDir, s + (off === 0 ? 6 : 0)).addScaledVector(bN, off);
    if (off === 0 ? r() < 0.5 : true) (off === 0 ? palms : trees).push(off === 0 ? [p.x, p.z, 1] : [p.x, p.z, 2.8 + r()]);
  }
  for (let x = -170; x < 240; x += 12) trees.push([x, -138 + r() * 4, 2.4 + r()]);
  for (let i = 0; i < 900; i++) {
    const x = -900 + r() * 1800, z = -900 + r() * 1800;
    if (pointInPoly(x, z, PARK_POLY) || Math.hypot(x, z) < 300 || r() < 0.4) continue;
    trees.push([x, z, 2 + r() * 2.5]);
  }
  const treeGeo = new THREE.IcosahedronGeometry(1, 1);
  const treeIm = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), trees.length);
  const greens = [0x2f5a2c, 0x3b6b33, 0x4a7a3a, 0x2a4d2a, 0x56803d].map((c) => new THREE.Color(c));
  trees.forEach(([x, z, s], i) => { mtx.compose(new V3(x, s * 1.15, z), q.identity(), new V3(s, s * 1.25, s)); treeIm.setMatrixAt(i, mtx); treeIm.setColorAt(i, greens[i % 5]); });
  treeIm.castShadow = treeIm.receiveShadow = true; scene.add(treeIm);
  const trunkIm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 1, 5), new THREE.MeshStandardMaterial({ color: 0x8a6a4a }), palms.length);
  const crownGeo = palmCrownGeometry();
  const crownIm = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: 0x3f6e34, flatShading: true }), palms.length);
  palms.forEach(([x, z, s], i) => {
    const h = 11 * s;
    mtx.compose(new V3(x, h / 2, z), q.identity(), new V3(1, h, 1)); trunkIm.setMatrixAt(i, mtx);
    mtx.compose(new V3(x, h, z), q.setFromEuler(new THREE.Euler(0, r() * 3, 0)), new V3(s, s, s)); crownIm.setMatrixAt(i, mtx);
  });
  trunkIm.castShadow = crownIm.castShadow = true; scene.add(trunkIm, crownIm);

  placeLamps(lampMat, lampPts);
  placeLamps(lampMatOrange, lampPtsOrange);

  // nhạc nước
  W.tick.push((t) => {
    W.jets.forEach((j) => {
      const h = j.userData.big ? 10 + Math.sin(t * 1.3) * 6 : 3 + (Math.sin(t * 2 + j.userData.phase) * 0.5 + 0.5) * 6;
      j.scale.y = h; j.position.y = 0.8 + h / 2;
    });
  });

  W.lakePts = LAKE_PTS;
  return W;
}
