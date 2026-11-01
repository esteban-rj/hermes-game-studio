import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { AGENT_SPOTS, CABINET } from './vector-room.js';
import { findPath, walkable } from './navigation.js';

// The original office coordinates and collision map remain authoritative.
export const toWorld = ({ x, y }) => new THREE.Vector3(x / 100 - 8.3, 0, y / 100 - 5.4);
export const toOffice = point => ({ x: (point.x + 8.3) * 100, y: (point.z + 5.4) * 100 });

const people = {
  atlas: ['#d9a77d', '#43354f', '#8a74d8', '#494967'],
  pixel: ['#a86f52', '#253349', '#578cde', '#344562'],
  prisma: ['#efbb9c', '#9d4d46', '#ec817e', '#73596f'],
  ux: ['#c68e6c', '#253b47', '#4da6a2', '#355469'],
  nodo: ['#e2b697', '#665047', '#79a77f', '#4b5d54'],
  lupa: ['#b97c59', '#3d303b', '#d5aa54', '#665569'],
  player: ['#d4a07d', '#30323a', '#e0e9db', '#485570'],
};

export function createOffice3D({ getState, selectAgent, closeChat, cabinet, showMedia, askPrisma, openUsage }) {
  const $ = selector => document.querySelector(selector);
  const viewport = $('#office-viewport');
  const status = $('#scene-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#14212b');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.domElement.className = 'office-canvas';
  renderer.domElement.setAttribute('aria-label', 'Oficina 3D de Hermes. Arrastra para girar, rueda para acercar y toca el suelo para caminar.');
  viewport.prepend(renderer.domElement);
  viewport.classList.add('is-3d');
  const camera = new THREE.OrthographicCamera(-12, 12, 8, -8, .1, 120);
  camera.position.set(13, 16, 20);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, .3, .5);
  controls.enableDamping = !reduced.matches;
  controls.dampingFactor = .09;
  controls.minZoom = .65;
  controls.maxZoom = 3.5;
  controls.minPolarAngle = .18;
  controls.maxPolarAngle = Math.PI / 2.12;
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  scene.add(new THREE.HemisphereLight('#bedde7', '#6a5646', 2.2));
  const sun = new THREE.DirectionalLight('#ffe3bd', 3.3);
  sun.position.set(-3, 14, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, near: .5, far: 40 });
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .035;
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#9bc7ff', 1.1); rim.position.set(6, 6, -8); scene.add(rim);
  const materials = new Map(), geometries = new Map();
  const interactive = [], actors = new Map(), labels = new Map(), monitors = new Map();
  const disposables = [], cleanups = [];
  function on(target, type, handler, options) { target.addEventListener(type, handler, options); cleanups.push(() => target.removeEventListener(type, handler, options)); }
  function material(color, extra = {}) {
    const key = color + JSON.stringify(extra);
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .75, ...extra }));
    return materials.get(key);
  }
  function box(parent, size, position, color, radius = .04, extra) {
    const key = size.join(',') + ':' + radius;
    if (!geometries.has(key)) geometries.set(key, radius ? new RoundedBoxGeometry(...size, 2, Math.min(radius, Math.min(...size) / 2)) : new THREE.BoxGeometry(...size));
    const mesh = new THREE.Mesh(geometries.get(key), material(color, extra));
    mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(parent, top, bottom, height, position, color, segments = 12) {
    const geometry = new THREE.CylinderGeometry(top, bottom, height, segments); disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, material(color)); mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function sphere(parent, size, position, color) {
    const geometry = new THREE.SphereGeometry(1, 12, 8); disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, material(color)); mesh.scale.set(...size); mesh.position.set(...position); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  function group(parent, position) { const result = new THREE.Group(); result.position.set(...position); parent.add(result); return result; }
  function canvasSurface(width, height, paint) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); paint(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; disposables.push(texture);
    return { canvas, ctx, texture };
  }
  function screen(parent, size, position, surface) {
    const geometry = new THREE.PlaneGeometry(...size); disposables.push(geometry);
    const mat = new THREE.MeshBasicMaterial({ map: surface.texture, toneMapped: false }); disposables.push(mat);
    const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(...position); parent.add(mesh); return mesh;
  }
  function sign(parent, text, position, width, color = '#b6d7b0', font = 50) {
    const surface = canvasSurface(1024, 160, (ctx, w, h) => {
      ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `600 ${font}px Segoe UI, sans-serif`; ctx.fillText(text, w / 2, h / 2);
    });
    const result = screen(parent, [width, width / 6.4], position, surface);
    result.material.transparent = true; return result;
  }
  function plant(parent, x, z, scale = 1, pot = '#b27f62') {
    const p = group(parent, [x, 0, z]); p.scale.setScalar(scale);
    cylinder(p, .26, .2, .4, [0, .2, 0], pot); cylinder(p, .23, .23, .03, [0, .405, 0], '#3d352c');
    cylinder(p, .025, .035, .8, [0, .78, 0], '#547358', 6);
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4, r = .24 + (i % 2) * .08;
      const leaf = sphere(p, [.16, .36, .075], [Math.sin(a) * r, .7 + i * .07, Math.cos(a) * r], i % 2 ? '#779b78' : '#436c58');
      leaf.rotation.set(Math.cos(a) * .6, a, Math.sin(a) * .6);
    }
    return p;
  }

  // A cutaway diorama, matching the six desks and lounge of the vector office.
  box(scene, [17.05, .45, 9.5], [0, -.3, .75], '#233c42', .16);
  box(scene, [16.6, .12, 9.15], [0, -.04, .77], '#a68160', .03);
  for (let row = 0; row < 25; row++) {
    const z = -3.66 + row * .365;
    for (let col = 0; col < 8; col++) {
      const x = -7.24 + col * 2.08;
      box(scene, [2.065, .018, .35], [x, .03, z], ['#ab8969', '#b89878', '#a98567', '#c09e79'][(row * 3 + col) % 4], .004);
    }
  }
  const ground = box(scene, [200, .12, 200], [0, -.64, 0], '#14212b', 0); ground.castShadow = false;
  box(scene, [16.8, 2.8, .18], [0, 1.35, -3.92], '#29464c');
  box(scene, [.18, 2.8, 9.2], [-8.4, 1.35, .7], '#365650');
  box(scene, [16.7, .13, .2], [0, 2.78, -3.9], '#b18d64');
  box(scene, [.2, .13, 9.2], [-8.4, 2.78, .7], '#b18d64');
  box(scene, [16.7, .12, .12], [0, .12, -3.78], '#c2a37a');
  box(scene, [.12, .12, 9.2], [-8.28, .12, .7], '#c2a37a');
  // Three windows, with a small skyline and warm office lights.
  for (const x of [-6.25, -3.35, -.45]) {
    box(scene, [2.45, 1.55, .08], [x, 1.78, -3.79], '#172632');
    box(scene, [2.3, 1.4, .015], [x, 1.78, -3.735], '#203c53', .01, { emissive: '#203c53', emissiveIntensity: .4 });
    for (let i = 0; i < 7; i++) {
      const h = .2 + ((i * 13 + Math.round(x * 4)) % 6 + 6) % 6 * .12;
      box(scene, [.27, h, .02], [x - .99 + i * .33, 1.1 + h / 2, -3.71], '#192c40', 0);
      for (let j = 0; j < 3; j++) box(scene, [.035, .035, .015], [x - .98 + i * .33, 1.14 + j * .16, -3.685], (i + j) % 3 ? '#a5bca5' : '#ddbb80', 0, { emissive: '#c6bb83', emissiveIntensity: .6 });
    }
    box(scene, [.05, 1.48, .08], [x, 1.78, -3.68], '#b5b4a0', 0);
    box(scene, [2.5, .08, .23], [x, 1.02, -3.69], '#b89770');
  }
  sign(scene, 'H E R M E S   /   G A M E   S T U D I O', [-3.3, 2.62, -3.79], 7.5, '#c5dbbc', 37);
  // The low glass partition leaves the central aisle open for navigation.
  for (const [z, length] of [[-2.3, 2.75], [3.38, 3.45]]) {
    box(scene, [.09, .25, length], [1.95, .16, z], '#344a48');
    box(scene, [.045, 1.35, length], [1.95, .95, z], '#a7d6cc', .005, { transparent: true, opacity: .13, depthWrite: false });
    for (const dz of [-length / 2, length / 2]) box(scene, [.07, 1.7, .07], [1.95, .85, z + dz], '#526e68', .01);
    box(scene, [.07, .07, length], [1.95, 1.7, z], '#6b8780', .01);
  }
  const rug1 = box(scene, [8.25, .025, 2.4], [-3.3, .06, -1.68], '#526b62', .08);
  const rug2 = box(scene, [8.25, .025, 2.4], [-3.3, .06, 1.72], '#526b62', .08);
  rug1.receiveShadow = rug2.receiveShadow = true;
  for (const z of [-2.79, -.56, .61, 2.84]) box(scene, [8.03, .008, .025], [-3.3, .078, z], '#98a687', 0);
  const monitorSurface = (color, variant) => canvasSurface(512, 288, (ctx, w, h) => {
    ctx.fillStyle = '#182c36'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#2c454c'; ctx.fillRect(0, 0, w, 29);
    ['#dfaa8d', '#e2cd91', '#99c79b'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(18 + i * 18, 14, 4, 0, Math.PI * 2); ctx.fill(); });
    if (variant === 2) {
      ctx.fillStyle = '#e5c59e'; ctx.fillRect(60, 58, 390, 205); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(177, 152, 63, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#668f7e'; ctx.fillRect(242, 99, 130, 114); ctx.fillStyle = '#ecc39d'; ctx.fillRect(290, 148, 100, 82);
    } else {
      for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 3 ? '#a7bbb7' : color; ctx.fillRect(38 + (i % 3) * 13, 54 + i * 20, 85 + ((i * 53) % 230), 6); }
      ctx.fillStyle = color; ctx.fillRect(355, 231, 90, 6);
    }
  });
  function desk(id, index) {
    const point = toWorld(AGENT_SPOTS[id]);
    const d = group(scene, [point.x, 0, point.z - 1.1]);
    const tint = people[id][2];
    box(d, [1.92, .13, .95], [0, .83, -.05], '#c5a57d', .08);
    box(d, [1.84, .05, .88], [0, .89, -.05], '#d0b289', .06);
    for (const x of [-.78, .78]) for (const z of [-.37, .29]) box(d, [.065, .78, .065], [x, .4, z], '#384e4a', .01);
    box(d, [.5, .03, .24], [0, .935, -.18], '#4b6160');
    box(d, [.07, .27, .07], [0, 1.05, -.22], '#415553');
    box(d, [1.03, .65, .065], [0, 1.4, -.24], '#263e42');
    const surface = monitorSurface(tint, index % 3);
    screen(d, [.94, .53], [0, 1.4, -.201], surface);
    monitors.set(id, d.children.at(-1));
    box(d, [.7, .035, .22], [-.03, .94, .28], '#c2c6b4', .02);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) box(d, [.042, .008, .027], [-.32 + c * .063, .961, .21 + r * .059], '#758880', .002);
    sphere(d, [.07, .025, .1], [.47, .94, .28], '#c4c8b6');
    cylinder(d, .085, .075, .17, [-.71, 1.01, .22], index % 2 ? '#bb7970' : '#e5d8bc');
    cylinder(d, .066, .066, .005, [-.71, 1.1, .22], '#4e392e');
    box(d, [.28, .025, .33], [.69, .945, -.08], tint, .012);
    box(d, [.23, .017, .29], [.69, .966, -.08], '#dcd8bf', .005);
    cylinder(d, .12, .12, .025, [-.76, .94, -.3], '#314b4c');
    cylinder(d, .018, .018, .46, [-.76, 1.17, -.3], '#5c7470', 8);
    cylinder(d, .16, .1, .14, [-.68, 1.38, -.28], tint);
    const bulb = box(d, [.18, .015, .18], [-.68, 1.305, -.28], '#ffe4ac', .01, { emissive: '#ffce7b', emissiveIntensity: 1 }); bulb.castShadow = false;
    // Colored upholstered swivel chair.
    cylinder(d, .04, .04, .42, [0, .3, .72], '#3d5551');
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5, leg = box(d, [.035, .035, .32], [Math.sin(a) * .14, .1, .72 + Math.cos(a) * .14], '#3d5551', .005); leg.rotation.y = a;
    }
    box(d, [.59, .12, .54], [0, .51, .72], tint, .08);
    box(d, [.58, .55, .12], [0, .82, .97], tint, .08);
    for (const x of [-.34, .34]) box(d, [.06, .08, .38], [x, .7, .74], '#3d5551');
    d.userData.action = () => selectAgent(id); interactive.push(d);
  }
  Object.keys(AGENT_SPOTS).forEach(desk);
  // Lounge: projection screen, sofa, coffee table, shelving and greenery.
  box(scene, [5.8, .025, 4.4], [4.9, .065, 1.67], '#697468', .07);
  for (const x of [2.13, 7.68]) box(scene, [.035, .008, 4.15], [x, .083, 1.67], '#a6ab8a', 0);
  const tvGroup = group(scene, [4.9, 0, -1.8]);
  box(tvGroup, [4.4, .45, .65], [0, .35, -.06], '#8d755e');
  for (const x of [-1.5, -.5, .5, 1.5]) { box(tvGroup, [.9, .33, .02], [x, .36, .278], '#aa8d6d'); box(tvGroup, [.15, .025, .03], [x, .42, .297], '#d2b88b', .005); }
  box(tvGroup, [3.92, 2.34, .14], [0, 1.99, -.08], '#1a2d32', .06);
  const tvSurface = canvasSurface(960, 540, (ctx, w, h) => { ctx.fillStyle = '#223e40'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#c3d8b2'; ctx.font = '40px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('LA PRÓXIMA GRAN IDEA', w / 2, 265); ctx.font = '22px Segoe UI'; ctx.fillText('Tu sala de proyección', w / 2, 320); });
  const tv = screen(tvGroup, [3.7, 2.08], [0, 1.99, .003], tvSurface);
  tvGroup.userData.action = () => { const state = getState(); state.media.length ? showMedia(state.tvId || state.media[0].id) : askPrisma(); }; interactive.push(tvGroup);
  sign(scene, 'S A L A   D E   P R O Y E C C I Ó N', [4.9, 2.64, -3.79], 4.8, '#d5d2b3', 38);
  const sofa = group(scene, [4.9, 0, 1.25]);
  box(sofa, [4, .43, 1], [0, .37, 0], '#516e65', .14);
  box(sofa, [4, .65, .25], [0, .85, .42], '#648579', .1);
  for (const x of [-1.86, 1.86]) box(sofa, [.3, .64, 1.05], [x, .6, 0], '#5e7d70', .1);
  for (const x of [-1.18, 0, 1.18]) { box(sofa, [1.12, .18, .75], [x, .64, -.05], '#789487', .09); box(sofa, [1.1, .45, .18], [x, .91, .26], '#779588', .08); }
  for (const x of [-1.4, 1.4]) { const pillow = box(sofa, [.47, .44, .17], [x, .92, -.04], x < 0 ? '#d6b17e' : '#ba8276', .1); pillow.rotation.z = x < 0 ? -.2 : .2; }
  const table = group(scene, [4.85, 0, 2.96]);
  box(table, [2.3, .13, .94], [0, .5, 0], '#d0b08b', .12);
  for (const x of [-.84, .84]) box(table, [.12, .45, .6], [x, .25, 0], '#435c55');
  box(table, [.55, .04, .39], [-.4, .59, 0], '#e0c99b', .01); box(table, [.5, .035, .36], [-.35, .625, 0], '#8d9e85', .01);
  cylinder(table, .1, .09, .16, [.5, .64, -.05], '#b67864');
  plant(scene, -7.6, -2.7, 1.1); plant(scene, 1.35, -2.9, .95); plant(scene, -7.35, 3.75, 1.3); plant(scene, 7.25, 3.7, 1.25);
  const shelf = group(scene, [-8.05, 0, 1.05]);
  box(shelf, [.46, 1.9, 1.9], [0, .95, 0], '#9d7d5e');
  for (const z of [-.85, .85]) box(shelf, [.55, 1.95, .08], [.03, .97, z], '#b89570');
  for (const y of [.15, .8, 1.45, 1.88]) box(shelf, [.58, .06, 1.9], [.04, y, 0], '#c1a17d');
  for (let i = 0; i < 12; i++) box(shelf, [.32, .31 + i % 3 * .05, .08], [.11, (i < 6 ? 1.65 : 1.03), -.66 + i % 6 * .17], ['#b98778', '#87a092', '#c4b58c'][i % 3], .008);
  const cabinetPos = toWorld({ x: CABINET.x + CABINET.w / 2, y: CABINET.y + CABINET.h / 2 });
  const archive = group(scene, [cabinetPos.x, 0, cabinetPos.z]);
  box(archive, [2.1, 1.1, 1.15], [0, .55, 0], '#647a68', .07);
  box(archive, [2.2, .1, 1.2], [0, 1.12, 0], '#c9ab83');
  for (const x of [-.68, 0, .68]) for (const y of [.34, .8]) { box(archive, [.61, .4, .025], [x, y, .59], '#859980', .02); box(archive, [.19, .035, .04], [x, y + .06, .62], '#dfc596', .008); }
  sign(archive, 'PROYECTOS', [0, .82, .615], 1.7, '#edf0d2', 64);
  archive.userData.action = () => cabinet.open(); interactive.push(archive);
  const usageSurface = canvasSurface(768, 320, () => {});
  const usage = group(scene, [.05, 0, -3.65]);
  box(usage, [2.65, 1.23, .1], [0, 1.97, 0], '#233b3b');
  screen(usage, [2.47, 1.05], [0, 1.97, .057], usageSurface);
  usage.userData.action = openUsage; interactive.push(usage);

  function character(id) {
    const [skin, hair, shirt, pants] = people[id] || people.player;
    const actor = group(scene, [0, 0, 0]);
    const body = group(actor, [0, 0, 0]);
    const legs = [];
    for (const x of [-.11, .11]) {
      const pivot = group(body, [x, .4, 0]);
      box(pivot, [.17, .33, .19], [0, -.12, 0], pants, .045);
      box(pivot, [.19, .105, .28], [0, -.31, .04], '#2b3b41', .04); legs.push(pivot);
    }
    box(body, [.48, .43, .27], [0, .62, 0], shirt, .09);
    cylinder(body, .075, .075, .1, [0, .88, 0], skin);
    box(body, [.39, .39, .35], [0, 1.08, 0], skin, .1);
    box(body, [.42, .16, .38], [0, 1.25, -.015], hair, .07);
    box(body, [.42, .2, .12], [0, 1.14, -.15], hair, .04);
    for (const x of [-.21, .21]) sphere(body, [.045, .07, .05], [x, 1.05, 0], skin);
    for (const x of [-.085, .085]) { sphere(body, [.028, .037, .018], [x, 1.095, .174], '#29363c'); box(body, [.06, .012, .018], [x, 1.16, .171], hair, .002); }
    box(body, [.065, .013, .012], [0, 1.0, .18], '#975e4c', .005);
    const arms = [];
    for (const x of [-.3, .3]) {
      const arm = group(body, [x, .77, 0]); box(arm, [.17, .3, .2], [0, -.12, 0], shirt, .055); sphere(arm, [.082, .1, .08], [0, -.31, 0], skin); arms.push(arm);
    }
    if (['atlas', 'lupa'].includes(id)) {
      for (const x of [-.085, .085]) box(body, [.135, .09, .018], [x, 1.095, .189], '#b7bfa7', .01, { transparent: true, opacity: .5 });
      box(body, [.045, .015, .022], [0, 1.105, .194], '#33484a', .002);
    }
    if (id === 'prisma') { const hat = cylinder(body, .27, .23, .09, [0, 1.37, 0], '#be675e'); hat.rotation.z = -.18; }
    if (id === 'pixel') { cylinder(body, .24, .24, .055, [0, 1.24, 0], '#243b51'); for (const x of [-.23, .23]) box(body, [.07, .16, .12], [x, 1.13, 0], '#6da7cb'); }
    if (id === 'ux') { box(body, [.43, .32, .17], [0, 1.09, -.15], hair, .07); }
    const ringGeo = new THREE.RingGeometry(.38, .42, 48); disposables.push(ringGeo);
    const ringMat = new THREE.MeshBasicMaterial({ color: shirt, transparent: true, opacity: .8, side: THREE.DoubleSide }); disposables.push(ringMat);
    const ring = new THREE.Mesh(ringGeo, ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = .1; actor.add(ring);
    return { root: actor, body, legs, arms, ring };
  }
  for (const id of Object.keys(AGENT_SPOTS)) {
    const actor = character(id); const point = toWorld(AGENT_SPOTS[id]); actor.root.position.copy(point); actor.root.position.z -= .05; actor.root.rotation.y = Math.PI;
    actor.root.userData.action = () => selectAgent(id); interactive.push(actor.root); actors.set(id, actor);
    const label = document.createElement('button'); label.type = 'button'; label.className = 'agent-3d-label'; label.dataset.agent3d = id;
    on(label, 'click', () => selectAgent(id)); $('#scene-labels').append(label); labels.set(id, label);
  }
  const player = { x: 500, y: 900, path: [] };
  const avatar = character('player'); avatar.root.position.copy(toWorld(player)); avatar.ring.material.color.set('#d5e3bc');
  const destination = new THREE.Mesh(new THREE.RingGeometry(.14, .2, 40), new THREE.MeshBasicMaterial({ color: '#e0deb4', transparent: true, opacity: .9, side: THREE.DoubleSide }));
  disposables.push(destination.geometry, destination.material); destination.rotation.x = -Math.PI / 2; destination.position.y = .1; destination.visible = false; scene.add(destination);
  const keys = new Set(); let follow = false, nearest = null, frame, last = 0, lastPaint = 0, mediaKey = null, imageRequest = 0;
  let cameraTween = null, disposed = false, contextLost = false, overhead = false;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), intersection = new THREE.Vector3();
  let pointerDown = null, multiTouch = false;
  const activePointers = new Set();
  function resize() {
    const { width, height } = viewport.getBoundingClientRect(); if (!width || !height) return;
    const halfH = Math.max(7.3, 11.3 / (width / height)); camera.left = -halfH * width / height; camera.right = halfH * width / height; camera.top = halfH; camera.bottom = -halfH; camera.updateProjectionMatrix(); renderer.setSize(width, height); updateZoom();
  }
  const observer = new ResizeObserver(resize); observer.observe(viewport); resize();
  function updateZoom() { $('#zoom-label').textContent = Math.round(camera.zoom * 100) + '%'; $('#camera-follow').setAttribute('aria-pressed', String(follow)); }
  function setZoom(value) { camera.zoom = THREE.MathUtils.clamp(value, .65, 3.5); camera.updateProjectionMatrix(); updateZoom(); }
  function focus(target, zoom = camera.zoom, top = false) {
    follow = false; cameraTween = { from: controls.target.clone(), to: target.clone(), zoomFrom: camera.zoom, zoomTo: zoom, t: 0 };
    if (top) { camera.position.copy(controls.target).add(new THREE.Vector3(.01, 25, .01)); } updateZoom();
  }
  function walk(target) {
    player.path = findPath(player, target);
    if (player.path.length) { destination.position.copy(toWorld(target)); destination.position.y = .1; destination.visible = true; $('#walk-tip').style.opacity = '0'; status.textContent = 'Caminando…'; }
  }
  function interact() {
    if (!nearest) return;
    if (nearest.id === 'cabinet') cabinet.open();
    else if (nearest.id === 'tv') tvGroup.userData.action();
    else selectAgent(nearest.id);
  }
  on(renderer.domElement, 'pointerdown', e => { activePointers.add(e.pointerId); if (activePointers.size > 1) multiTouch = true; if (e.button === 0) pointerDown = { x: e.clientX, y: e.clientY, id: e.pointerId }; viewport.focus({ preventScroll: true }); follow = false; cameraTween = null; });
  on(renderer.domElement, 'pointercancel', e => { activePointers.delete(e.pointerId); pointerDown = null; if (!activePointers.size) multiTouch = false; });
  on(renderer.domElement, 'pointerup', e => {
    activePointers.delete(e.pointerId);
    if (multiTouch) { pointerDown = null; if (!activePointers.size) multiTouch = false; return; }
    if (!pointerDown || e.pointerId !== pointerDown.id) return;
    const tap = Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) < 5; pointerDown = null; if (!tap) return;
    const rect = viewport.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(interactive, true);
    if (hits.length) { let object = hits[0].object; while (object && !object.userData.action) object = object.parent; object?.userData.action(); return; }
    if (raycaster.ray.intersectPlane(floor, intersection)) walk(toOffice(intersection));
  });
  on(renderer.domElement, 'webglcontextlost', e => { e.preventDefault(); contextLost = true; $('#scene-error').hidden = false; $('#scene-error-text').textContent = 'Se interrumpió el renderizado 3D. Recarga la vista para recuperarlo.'; });
  on(renderer.domElement, 'webglcontextrestored', () => { contextLost = false; $('#scene-error').hidden = true; });
  on($('#zoom-in'), 'click', () => setZoom(camera.zoom * 1.2)); on($('#zoom-out'), 'click', () => setZoom(camera.zoom / 1.2));
  on($('#camera-fit'), 'click', () => { overhead = false; camera.position.copy(controls.target).add(new THREE.Vector3(13, 16, 20)); focus(new THREE.Vector3(0, .3, .5), 1); $('#camera-top').setAttribute('aria-pressed', 'false'); });
  on($('#camera-top'), 'click', () => { overhead = !overhead; if (overhead) focus(new THREE.Vector3(0, 0, .65), 1, true); else { camera.position.copy(controls.target).add(new THREE.Vector3(13, 16, 20)); focus(new THREE.Vector3(0, .3, .5), 1); } $('#camera-top').setAttribute('aria-pressed', String(overhead)); });
  on($('#camera-follow'), 'click', () => { follow = !follow; cameraTween = null; if (follow) setZoom(1.65); updateZoom(); });
  on($('#reset-position'), 'click', () => { Object.assign(player, { x: 500, y: 900, path: [] }); keys.clear(); destination.visible = false; avatar.root.position.copy(toWorld(player)); focus(new THREE.Vector3(0, .3, .5), 1); viewport.focus(); });
  on($('#go-lounge'), 'click', () => { focus(new THREE.Vector3(4.9, .3, .8), 1.65); walk({ x: 1320, y: 540 }); });
  on($('#go-work'), 'click', () => { focus(new THREE.Vector3(-3.2, .3, .1), 1.25); walk({ x: 500, y: 850 }); });
  on($('#touch-interact'), 'click', interact);
  const movement = ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
  function blockedInput(e) { return e.target.closest('input,textarea,select,button') || document.querySelector('dialog[open]') || (innerWidth < 1100 && getState().open); }
  on(window, 'keydown', e => {
    if (e.key === 'Escape' && !document.querySelector('dialog[open]')) closeChat();
    if (blockedInput(e)) return;
    const key = e.key.toLowerCase(); if (movement.includes(key)) { e.preventDefault(); keys.add(key); }
    if (key === 'e') { e.preventDefault(); interact(); }
  });
  on(window, 'keyup', e => keys.delete(e.key.toLowerCase())); on(window, 'blur', () => keys.clear());
  on(document, 'visibilitychange', () => { keys.clear(); player.path = []; destination.visible = false; });
  for (const button of document.querySelectorAll('[data-direction]')) {
    const key = 'arrow' + button.dataset.direction;
    on(button, 'pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); keys.add(key); });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(button, type, () => keys.delete(key));
  }
  on($('#scene-fullscreen'), 'click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('#office-card').requestFullscreen(); }
    catch { status.textContent = 'Este navegador no permite pantalla completa.'; }
  });
  on(document, 'fullscreenchange', () => { $('#scene-fullscreen').setAttribute('aria-pressed', String(Boolean(document.fullscreenElement))); resize(); });
  on($('#scene-reload'), 'click', () => location.reload());
  controls.addEventListener('change', updateZoom);
  function paintData(time) {
    const state = getState();
    $('#agent-count').textContent = state.agents.length + ' AGENTES · HERMES';
    $('#scene-online').textContent = state.connected ? 'EN DIRECTO' : 'SIN CONEXIÓN';
    for (const [id, actor] of actors) {
      const agent = state.agents.find(a => a.id === id), active = agent?.status === 'running', label = labels.get(id);
      const text = (agent?.name || id) + ' · ' + (active ? 'Trabajando' : 'Disponible');
      if (label.textContent !== text) { label.textContent = text; label.setAttribute('aria-label', 'Hablar con ' + (agent?.name || id)); }
      label.classList.toggle('selected', state.selected === id); label.style.setProperty('--agent-color', agent?.color || '#c1daa3');
      actor.ring.visible = state.selected === id || active;
      actor.body.rotation.x = active && !reduced.matches ? Math.sin(time * .006) * .025 : 0;
      actor.arms.forEach((arm, i) => { arm.rotation.x = active ? -.7 + (reduced.matches ? 0 : Math.sin(time * .012 + i * Math.PI) * .1) : 0; });
    }
    const asset = state.media.find(m => m.id === state.tvId) || state.media[0];
    const nextKey = asset?.id || 'empty';
    if (mediaKey !== nextKey) {
      mediaKey = nextKey; const ticket = ++imageRequest;
      if (asset?.kind === 'image') {
        const img = new Image(); img.onload = () => {
          if (disposed || ticket !== imageRequest) return;
          const ctx = tvSurface.ctx, w = 960, h = 540, ratio = Math.min(w / img.width, h / img.height);
          ctx.fillStyle = '#172a2e'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, (w - img.width * ratio) / 2, (h - img.height * ratio) / 2, img.width * ratio, img.height * ratio); tvSurface.texture.needsUpdate = true;
        }; img.onerror = () => { status.textContent = 'La TV no pudo cargar el resultado.'; }; img.src = asset.url;
      } else {
        const ctx = tvSurface.ctx; ctx.fillStyle = '#213c3e'; ctx.fillRect(0, 0, 960, 540); ctx.textAlign = 'center'; ctx.fillStyle = '#d4e0bf'; ctx.font = '38px Segoe UI'; ctx.fillText(asset ? '▶  ' + asset.title.slice(0, 32) : 'LA PRÓXIMA GRAN IDEA', 480, 270); ctx.font = '22px Segoe UI'; ctx.fillText(asset ? 'Toca la TV para reproducir' : 'Pide un gráfico a tu equipo', 480, 320); tvSurface.texture.needsUpdate = true;
      }
    }
    const ctx = usageSurface.ctx; ctx.fillStyle = '#172b36'; ctx.fillRect(0, 0, 768, 320); ctx.fillStyle = '#a8d6bb'; ctx.font = '600 27px Segoe UI'; ctx.fillText('CODEX  /  TU CUENTA', 35, 49);
    ctx.fillStyle = '#e5eddb'; ctx.font = '600 70px Segoe UI'; ctx.fillText($('#usage-tv-number').textContent || '—', 35, 142);
    ctx.fillStyle = '#adc0be'; ctx.font = '25px Segoe UI'; ctx.fillText($('#usage-tv-caption').textContent.slice(0, 45), 35, 190); ctx.fillStyle = '#c5d5bf'; ctx.fillText($('#usage-tv-quota').textContent, 35, 250); usageSurface.texture.needsUpdate = true;
  }
  function tick(time) {
    if (disposed) return;
    frame = requestAnimationFrame(tick); if (document.hidden || contextLost) { last = time; return; }
    const dt = Math.min((time - last) / 1000 || .016, .05); last = time;
    let dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
    let dy = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
    if (document.querySelector('dialog[open]') || (innerWidth < 1100 && getState().open)) { dx = dy = 0; keys.clear(); player.path = []; }
    let moving = false;
    if (dx || dy) { player.path = []; const l = Math.hypot(dx, dy); dx *= 235 * dt / l; dy *= 235 * dt / l; }
    else if (player.path.length) { const next = player.path[0], d = Math.hypot(next.x - player.x, next.y - player.y); if (d < 4) player.path.shift(); else { dx = (next.x - player.x) / d * Math.min(d, 235 * dt); dy = (next.y - player.y) / d * Math.min(d, 235 * dt); } }
    if (dx || dy) {
      const oldX = player.x, oldY = player.y;
      if (walkable(player.x + dx, player.y)) player.x += dx;
      if (walkable(player.x, player.y + dy)) player.y += dy;
      moving = Math.hypot(player.x - oldX, player.y - oldY) > .01;
      if (!moving) player.path = [];
      avatar.root.rotation.y = Math.atan2(dx, dy);
    }
    avatar.root.position.copy(toWorld(player));
    avatar.body.position.y = moving && !reduced.matches ? Math.abs(Math.sin(time * .012)) * .055 : 0;
    avatar.legs.forEach((leg, i) => { leg.rotation.x = moving && !reduced.matches ? Math.sin(time * .012 + i * Math.PI) * .5 : 0; });
    avatar.arms.forEach((arm, i) => { arm.rotation.x = moving && !reduced.matches ? Math.sin(time * .012 - i * Math.PI) * .35 : 0; });
    destination.visible = player.path.length > 0;
    if (!player.path.length && status.textContent === 'Caminando…') status.textContent = 'Tu estudio, en otra dimensión.';
    if (follow) { const target = avatar.root.position.clone(); target.y = .35; const delta = target.sub(controls.target).multiplyScalar(Math.min(1, dt * 5)); controls.target.add(delta); camera.position.add(delta); }
    if (cameraTween) {
      cameraTween.t = Math.min(1, cameraTween.t + dt * 2.2); const k = reduced.matches ? 1 : 1 - Math.pow(1 - cameraTween.t, 3);
      const next = cameraTween.from.clone().lerp(cameraTween.to, k), delta = next.clone().sub(controls.target); controls.target.copy(next); camera.position.add(delta); setZoom(THREE.MathUtils.lerp(cameraTween.zoomFrom, cameraTween.zoomTo, k)); if (k >= .999) cameraTween = null;
    }
    controls.update();
    if (time - lastPaint > 180) { paintData(time); lastPaint = time; }
    const rect = viewport.getBoundingClientRect();
    for (const [id, actor] of actors) {
      const p = actor.root.position.clone(); p.y += 1.7; p.project(camera); const label = labels.get(id);
      label.style.transform = `translate(${(p.x * .5 + .5) * rect.width}px,${(-p.y * .5 + .5) * rect.height}px) translate(-50%,-50%)`;
      label.hidden = Math.abs(p.x) > .92 || Math.abs(p.y) > .9 || p.z > 1;
    }
    const candidates = getState().agents.filter(a => AGENT_SPOTS[a.id]).map(a => ({ ...a, distance: Math.hypot(player.x - AGENT_SPOTS[a.id].x, player.y - AGENT_SPOTS[a.id].y) }));
    candidates.push({ id: 'tv', name: 'la TV', distance: Math.hypot(player.x - 1320, player.y - 520) }, { id: 'cabinet', name: 'el archivador', distance: Math.hypot(player.x - CABINET.approach.x, player.y - CABINET.approach.y) });
    nearest = candidates.filter(a => a.distance < 130).sort((a, b) => a.distance - b.distance)[0];
    $('#touch-interact').disabled = !nearest; $('#interact-label').textContent = nearest ? nearest.id === 'cabinet' ? 'Abrir archivador' : nearest.id === 'tv' ? 'Ver la TV' : 'Hablar con ' + nearest.name : 'Acércate a una mesa';
    const lounge = player.x > 1035; $('#zone-label').textContent = lounge ? 'SALA DE PROYECCIÓN' : 'OFICINA CREATIVA'; $('#go-lounge').classList.toggle('active', lounge); $('#go-work').classList.toggle('active', !lounge);
    viewport.dataset.playerX = Math.round(player.x); viewport.dataset.playerY = Math.round(player.y);
    renderer.render(scene, camera);
  }
  status.textContent = 'Tu estudio, en otra dimensión.'; $('#scene-loading').hidden = true;
  frame = requestAnimationFrame(tick);
  return { dispose() {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); cleanups.forEach(fn => fn()); controls.dispose();
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); disposables.forEach(d => d.dispose()); renderer.dispose(); renderer.domElement.remove(); labels.forEach(label => label.remove());
  } };
}
