/* nowmad agency: fondo de pantalla en 3D.
   La brújula vintage del logo de nowmad, hecha objeto: caja de bronce oscuro con las cuatro asas
   cuadradas, bisel estriado, esfera de pergamino con grados y números, tarjeta con la rosa de ocho
   puntas en relieve (caras crema y bronce, como el logo), domo de vidrio y dos anillos de astrolabio
   que giran alrededor. Luz cálida de estudio, polvo dorado que flota.
   Interacción: la tarjeta gira para que el norte apunte al mouse (con rebote, como una brújula de verdad);
   la brújula se inclina hacia el cursor y viaja con el scroll.
   Si no hay WebGL o el visitante pidió menos movimiento, queda quieta o queda el fondo de CSS. */
import * as THREE from "three";

const canvas = document.querySelector("[data-wall3d]");
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const C = { paper: "#F3EADB", cream: "#E8DCC5", ink: "#4A3524", deep: "#2E2116", bronze: "#8A6A3F", brass: "#B08A4F", terra: "#D97757" };

// ---------- Texturas dibujadas: esfera fija (grados) y tarjeta que gira (rosa y cardinales) ----------
function paper(ctx, S) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, S, S);
  // manchas suaves de papel viejo
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = S * (0.05 + Math.random() * 0.18);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(176,138,79,.10)"); g.addColorStop(1, "rgba(176,138,79,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  }
  const v = ctx.createRadialGradient(S / 2, S / 2, S * 0.25, S / 2, S / 2, S * 0.52);
  v.addColorStop(0, "rgba(74,53,36,0)"); v.addColorStop(1, "rgba(74,53,36,.28)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, S, S);
  // grano
  const img = ctx.getImageData(0, 0, S, S), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  ctx.putImageData(img, 0, 0);
}
function dialTexture() {
  const S = 2048, cv = document.createElement("canvas"); cv.width = cv.height = S;
  const ctx = cv.getContext("2d"), c = S / 2;
  paper(ctx, S);
  const ao = ctx.createRadialGradient(c, c, c * 0.86, c, c, c);
  ao.addColorStop(0, "rgba(46,33,22,0)"); ao.addColorStop(1, "rgba(46,33,22,.55)");
  ctx.fillStyle = ao; ctx.fillRect(0, 0, S, S);
  ctx.translate(c, c);
  ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink;
  ring(ctx, c * 0.985, 14); ring(ctx, c * 0.94, 3);
  for (let a = 0; a < 360; a++) {
    const big = a % 10 === 0, mid = a % 5 === 0;
    const r1 = c * 0.94, r2 = c * (big ? 0.855 : mid ? 0.885 : 0.905);
    ctx.lineWidth = big ? 6 : mid ? 4 : 2.2;
    line(ctx, a, r1, r2);
  }
  ctx.font = "500 46px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (let a = 0; a < 360; a += 30) {
    ctx.save(); ctx.rotate(a * Math.PI / 180); ctx.fillText(String(a), 0, -c * 0.8); ctx.restore();
  }
  ring(ctx, c * 0.755, 3);
  ctx.setLineDash([10, 14]); ring(ctx, c * 0.735, 3); ctx.setLineDash([]);
  return new THREE.CanvasTexture(cv);
}
function cardTexture() {
  const S = 2048, cv = document.createElement("canvas"); cv.width = cv.height = S;
  const ctx = cv.getContext("2d"), c = S / 2;
  paper(ctx, S);
  ctx.translate(c, c);
  ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink;
  // rosa de 32 vientos en línea fina, debajo de la rosa en relieve
  for (let i = 0; i < 32; i++) {
    ctx.lineWidth = i % 4 === 0 ? 3 : 1.5; ctx.globalAlpha = i % 4 === 0 ? 0.55 : 0.3;
    line(ctx, i * 11.25, c * 0.06, c * (i % 4 === 0 ? 0.92 : 0.8));
  }
  ctx.globalAlpha = 1;
  ring(ctx, c * 0.96, 8); ring(ctx, c * 0.9, 2.5);
  ctx.setLineDash([6, 10]); ring(ctx, c * 0.62, 2.5); ctx.setLineDash([]);
  // cardinales
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const L = [["N", 0], ["E", 90], ["S", 180], ["O", 270]];
  L.forEach(([t, a]) => {
    ctx.save(); ctx.rotate(a * Math.PI / 180);
    ctx.font = "800 150px Unbounded, 'Arial Black', sans-serif";
    ctx.fillStyle = t === "N" ? C.terra : C.ink;
    ctx.fillText(t, 0, -c * 0.76);
    ctx.restore();
  });
  ctx.font = "600 64px Unbounded, 'Arial Black', sans-serif"; ctx.fillStyle = C.bronze;
  [["NE", 45], ["SE", 135], ["SO", 225], ["NO", 315]].forEach(([t, a]) => { ctx.save(); ctx.rotate(a * Math.PI / 180); ctx.fillText(t, 0, -c * 0.74); ctx.restore(); });
  // texto grabado en círculo
  ctx.font = "500 40px 'JetBrains Mono', monospace"; ctx.fillStyle = C.ink;
  const txt = "NOWMAD · BUENOS AIRES · NUEVA GENERACIÓN, EN MOVIMIENTO · ";
  const R = c * 0.53, step = (Math.PI * 2) / txt.length;
  for (let i = 0; i < txt.length; i++) { ctx.save(); ctx.rotate(Math.PI + i * step); ctx.fillText(txt[i], 0, R); ctx.restore(); }
  return new THREE.CanvasTexture(cv);
}
// Estudio de fotografía para los reflejos: cuarto oscuro con un softbox grande, una tira lateral,
// un rebote cálido abajo y un contraluz. Es lo que hace que el metal se vea como en una foto de producto.
function studioScene() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.038, 0.03), side: THREE.BackSide })));
  const panel = (w, h, c, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(10, 6, new THREE.Color(6, 5, 3.8), -8, 8, 8);
  panel(2, 14, new THREE.Color(3.4, 2.6, 1.8), 11, 0, 4);
  panel(9, 2, new THREE.Color(1.5, 0.85, 0.55), 0, -10, 3);
  panel(6, 6, new THREE.Color(1.3, 0.85, 0.5), 2, 5, -12);
  return s;
}
// Desgaste del metal: grano, manchas y rayones finos (se usa para la rugosidad y el relieve)
function wearTexture() {
  const S = 1024, cv = document.createElement("canvas"); cv.width = cv.height = S;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "rgb(190,190,190)"; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 20 + Math.random() * 90, g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, Math.random() < 0.5 ? "rgba(120,120,120,.22)" : "rgba(235,235,235,.18)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  }
  ctx.lineCap = "round";
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * S, y = Math.random() * S, a = Math.random() * Math.PI, l = 8 + Math.random() * 70;
    ctx.strokeStyle = "rgba(255,255,255," + (0.15 + Math.random() * 0.35) + ")"; ctx.lineWidth = 0.6 + Math.random() * 1.1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (Math.random() - 0.5) * 6, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
  const img = ctx.getImageData(0, 0, S, S), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 30; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1);
  return t;
}
function softDot(inner, outer) {
  const S = 128, cv = document.createElement("canvas"); cv.width = cv.height = S;
  const ctx = cv.getContext("2d"), g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function ring(ctx, r, w) { ctx.lineWidth = w; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
function line(ctx, deg, r1, r2) { const a = deg * Math.PI / 180, s = Math.sin(a), co = -Math.cos(a); ctx.beginPath(); ctx.moveTo(s * r1, co * r1); ctx.lineTo(s * r2, co * r2); ctx.stroke(); }

// Rosa en relieve: cada punta son dos caras (una crema y una de bronce) que suben hacia el centro
function roseGeometry(points) {
  const light = [], dark = [];
  points.forEach(([ang, len, half]) => {
    const a = ang * Math.PI / 180, tip = [Math.sin(a) * len, Math.cos(a) * len, 0.02];
    const l = [Math.sin(a - Math.PI / 2) * half, Math.cos(a - Math.PI / 2) * half, 0.02];
    const r = [Math.sin(a + Math.PI / 2) * half, Math.cos(a + Math.PI / 2) * half, 0.02];
    const top = [0, 0, 0.26];
    light.push(...top, ...l, ...tip);
    dark.push(...top, ...tip, ...r);
  });
  const mk = (arr) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); return g; };
  return [mk(light), mk(dark)];
}

function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const aniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x120c07, 0.035);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studioScene(), 0.02).texture;
  scene.environmentIntensity = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // Materiales
  const wear = wearTexture();
  const brass = new THREE.MeshPhysicalMaterial({ color: 0xd2ab6c, metalness: 1, roughness: 0.32, roughnessMap: wear, bumpMap: wear, bumpScale: 0.6, clearcoat: 0.35, clearcoatRoughness: 0.25 });
  const darkBronze = new THREE.MeshPhysicalMaterial({ color: 0x3b2a1d, metalness: 0.85, roughness: 0.5, roughnessMap: wear, bumpMap: wear, bumpScale: 0.8, clearcoat: 0.5, clearcoatRoughness: 0.35 });
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xe0b862, metalness: 1, roughness: 0.2, roughnessMap: wear, clearcoat: 1, clearcoatRoughness: 0.1 });
  const ruby = new THREE.MeshPhysicalMaterial({ color: 0xe0284a, emissive: 0x4a0012, metalness: 0, roughness: 0.04, transmission: 0.3, thickness: 0.1, ior: 1.77, clearcoat: 1 });
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0xe8dcc5, metalness: 0, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1, flatShading: true });
  const bronzeFace = new THREE.MeshPhysicalMaterial({ color: 0x8a6a3f, metalness: 0.9, roughness: 0.3, clearcoat: 0.8, flatShading: true });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.06, transmission: 1, thickness: 0.25, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.08, specularIntensity: 0.6, transparent: true });
  const dialTex = dialTexture(), cardTex = cardTexture();
  [dialTex, cardTex].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; });
  const dialMat = new THREE.MeshPhysicalMaterial({ map: dialTex, color: 0xc9b493, roughness: 0.62, clearcoat: 0.25, envMapIntensity: 0.5 });
  const cardMat = new THREE.MeshPhysicalMaterial({ map: cardTex, color: 0xd6c3a2, roughness: 0.58, clearcoat: 0.3, envMapIntensity: 0.5 });
  // Cuando terminan de cargar las tipografías de la página, se vuelven a dibujar con ellas
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
    dialMat.map = dialTexture(); cardMat.map = cardTexture();
    [dialMat.map, cardMat.map].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; });
    dialMat.needsUpdate = cardMat.needsUpdate = true;
  });

  const compass = new THREE.Group();
  // Caja: anillo grueso de bronce oscuro (el aro del logo) y fondo
  // Caja torneada con su perfil real: tapa trasera, canto, chaflanes y el escalón donde apoya el vidrio
  const prof = [[0, -0.5], [2.0, -0.5], [2.18, -0.46], [2.32, -0.34], [2.4, -0.16], [2.42, 0.02], [2.38, 0.16], [2.28, 0.26], [2.14, 0.31], [2.0, 0.3], [1.93, 0.24], [1.9, 0.1], [1.86, 0.02], [1.84, 0]];
  const caseBody = new THREE.Mesh(new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), 240), darkBronze);
  caseBody.rotation.x = Math.PI / 2;
  compass.add(caseBody);
  // Aro de latón que retiene el vidrio y moleteado en el canto, como una moneda
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.97, 0.06, 24, 240), brass); bezel.position.z = 0.29;
  const knurl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.032, 0.05, 0.2), brass, 220);
  const o = new THREE.Object3D();
  for (let i = 0; i < 220; i++) {
    const a = (i / 220) * Math.PI * 2;
    o.position.set(Math.sin(a) * 2.43, Math.cos(a) * 2.43, 0.0); o.rotation.set(0, 0, -a); o.updateMatrix();
    knurl.setMatrixAt(i, o.matrix);
  }
  compass.add(bezel, knurl);
  // Esfera fija con grados
  const dial = new THREE.Mesh(new THREE.CircleGeometry(1.84, 160), dialMat); dial.position.z = 0.0;
  compass.add(dial);
  // Las cuatro asas cuadradas del logo, con su marco interior y la pestaña
  for (let k = 0; k < 4; k++) {
    const lug = new THREE.Group();
    const sq = new THREE.Shape(); sq.moveTo(-0.24, -0.26); sq.lineTo(0.24, -0.26); sq.lineTo(0.24, 0.26); sq.lineTo(-0.24, 0.26); sq.closePath();
    const block = new THREE.Mesh(new THREE.ExtrudeGeometry(sq, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4 }), darkBronze);
    block.position.z = -0.15;
    const frameT = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.04), gold), frameB = frameT.clone(), frameL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.34, 0.04), gold), frameR = frameL.clone();
    frameT.position.set(0, 0.155, 0.21); frameB.position.set(0, -0.155, 0.21); frameL.position.set(-0.135, 0, 0.21); frameR.position.set(0.135, 0, 0.21);
    const tab = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.26, 24), brass); tab.position.y = 0.4;
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 24), gold); gem.position.set(0, 0, 0.2);
    lug.add(block, frameT, frameB, frameL, frameR, tab, gem);
    lug.position.y = 2.36; lug.position.z = 0;
    const holderLug = new THREE.Group(); holderLug.add(lug); holderLug.rotation.z = -k * Math.PI / 2;
    compass.add(holderLug);
  }
  // Tarjeta que gira: papel con cardinales + rosa en relieve + tapón dorado
  const card = new THREE.Group();
  const cardDisc = new THREE.Mesh(new THREE.CircleGeometry(1.42, 160), cardMat); cardDisc.position.z = 0.04;
  const P = [];
  for (let i = 0; i < 4; i++) P.push([i * 90, 1.3, 0.12]);
  for (let i = 0; i < 4; i++) P.push([45 + i * 90, 0.9, 0.1]);
  const [gl, gd] = roseGeometry(P);
  const roseL = new THREE.Mesh(gl, enamel), roseD = new THREE.Mesh(gd, bronzeFace);
  roseL.position.z = roseD.position.z = 0.05;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 32), gold); pin.rotation.x = Math.PI / 2; pin.position.z = 0.31;
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.065, 32, 32), ruby); jewel.position.z = 0.37;
  const northTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 24), new THREE.MeshPhysicalMaterial({ color: 0xd97757, roughness: 0.3, clearcoat: 1 }));
  northTip.position.set(0, 1.38, 0.08);
  card.add(cardDisc, roseL, roseD, pin, jewel, northTip);
  compass.add(card);
  // Domo de vidrio
  const R = 4.6, th = Math.asin(1.86 / R);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 24, 0, Math.PI * 2, 0, th), glass);
  dome.rotation.x = Math.PI / 2; dome.position.z = -R * Math.cos(th) + 0.22;
  compass.add(dome);

  // Anillos de astrolabio que giran alrededor
  const gimbal = new THREE.Group();
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.04, 16, 260), brass);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.026, 16, 260), gold);
  const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.14, 0.02), brass, 72);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    o.position.set(Math.sin(a) * 2.85, Math.cos(a) * 2.85, 0); o.rotation.set(0, 0, -a); o.updateMatrix();
    marks.setMatrixAt(i, o.matrix);
  }
  const pivotL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 24), gold), pivotR = pivotL.clone();
  pivotL.position.x = -2.85; pivotR.position.x = 2.85;
  const ringAg = new THREE.Group(); ringAg.add(ringA, marks, pivotL, pivotR);
  const ringBg = new THREE.Group(); ringBg.add(ringB);
  gimbal.add(ringAg, ringBg);

  // Halo cálido detrás, para que la brújula se despegue del fondo
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot("rgba(255,200,130,.55)", "rgba(255,200,130,0)"), depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
  halo.scale.set(10, 10, 1); halo.position.z = -1.6;

  const holder = new THREE.Group();
  holder.add(halo, compass, gimbal);
  scene.add(holder);
  compass.traverse((m) => { if (m.isMesh) { m.castShadow = m !== dome && m !== dial && m !== cardDisc; m.receiveShadow = m !== dome; } });
  gimbal.traverse((m) => { if (m.isMesh) m.castShadow = true; });

  // Luces cálidas de estudio
  scene.add(new THREE.AmbientLight(0x4a3524, 0.5));
  const key = new THREE.DirectionalLight(0xffe2b0, 2.6); key.position.set(-3, 4, 6); scene.add(key, key.target);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 1, far: 30 });
  key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
  const hp = new THREE.Vector3();
  const rimTerra = new THREE.PointLight(0xd97757, 220, 40, 1.5); rimTerra.position.set(6, 3, 1); scene.add(rimTerra);
  const rimBrass = new THREE.PointLight(0xffc27a, 200, 40, 1.5); rimBrass.position.set(-5, -3, 2); scene.add(rimBrass);
  const follow = new THREE.PointLight(0xfff1dc, 70, 22, 1.6); follow.position.set(0, 0, 5); scene.add(follow);

  // Polvo dorado
  const N = 600, pos = new Float32Array(N * 3), speed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22; pos[i * 3 + 1] = (Math.random() - 0.5) * 14; pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    speed[i] = 0.06 + Math.random() * 0.2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dotTex = softDot("rgba(255,230,190,1)", "rgba(255,230,190,0)");
  scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: dotTex, color: 0xffd9a0, size: 0.07, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending })));
  const BN = 40, bpos = new Float32Array(BN * 3);
  for (let i = 0; i < BN; i++) { bpos[i * 3] = (Math.random() - 0.5) * 16; bpos[i * 3 + 1] = (Math.random() - 0.5) * 10; bpos[i * 3 + 2] = 3 + Math.random() * 4; }
  const bokehGeo = new THREE.BufferGeometry(); bokehGeo.setAttribute("position", new THREE.BufferAttribute(bpos, 3));
  const bokeh = new THREE.Points(bokehGeo, new THREE.PointsMaterial({ map: dotTex, color: 0xffc27a, size: 0.55, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(bokeh);

  // Ubicación según el scroll (portada: abajo a la izquierda; después: a la derecha)
  let wide = true, prog = 0;
  function layout() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    wide = w > 900;
    holder.scale.setScalar(wide ? 1.05 : 0.7);
  }
  function place() {
    const k = prog * prog * (3 - 2 * prog);
    if (wide) holder.position.set(-3.3 + 6.4 * k, -4.0 + 3.2 * k, 0);
    else holder.position.set(0, -3.4 + 1.4 * k, 0);
    holder.rotation.z = (1 - k) * -0.35 - k * 0.12;
    holder.rotation.y = -0.25 + k * 0.5;
  }
  layout();
  addEventListener("resize", layout);

  const ptr = { x: 0, y: 0, seen: false }, cur = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => {
    ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; ptr.seen = true;
  }, { passive: true });

  let na = 0, nv = 0;
  const center = new THREE.Vector3();
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    cur.x += (ptr.x - cur.x) * 0.05; cur.y += (ptr.y - cur.y) * 0.05;
    prog += (Math.min(1, scrollY / (innerHeight * 0.9)) - prog) * 0.08;
    place();
    // Entrada: la brújula sube y gira hasta su lugar en los primeros dos segundos
    const e = Math.min(1, t / 2.2), ee = 1 - Math.pow(1 - e, 3);
    holder.position.y -= (1 - ee) * 2.5;
    holder.rotation.z += (1 - ee) * 1.2;
    halo.material.opacity = 0.55 + Math.sin(t * 0.8) * 0.12;
    holder.getWorldPosition(hp);
    key.position.set(hp.x - 3 + Math.sin(t * 0.18) * 3, hp.y + 4, 7);
    key.target.position.copy(hp);
    bokeh.rotation.z = Math.sin(t * 0.05) * 0.1;
    compass.rotation.y = Math.sin(t * 0.25) * 0.1 + cur.x * 0.28;
    compass.rotation.x = 0.1 + Math.sin(t * 0.2) * 0.05 + cur.y * 0.2;
    compass.position.y = Math.sin(t * 0.6) * 0.08;
    ringAg.rotation.y = t * 0.25; ringAg.rotation.x = 0.4 + Math.sin(t * 0.15) * 0.2;
    ringBg.rotation.x = t * 0.18 + 1.1; ringBg.rotation.y = 0.6;
    // La tarjeta busca al mouse con un resorte; sin mouse, oscila buscando el norte
    compass.getWorldPosition(center).project(camera);
    const goal = ptr.seen
      ? Math.atan2(-ptr.y - center.y, (ptr.x - center.x) * camera.aspect) - Math.PI / 2 - holder.rotation.z
      : Math.sin(t * 0.6) * 0.45 + Math.sin(t * 1.7) * 0.1;
    nv += wrap(goal - na) * 0.01; nv *= 0.93; na += nv;
    card.rotation.z = na;
    follow.position.set(cur.x * 6, -cur.y * 4, 5);
    rimTerra.position.x = 5 + Math.sin(t * 0.3) * 1.5;
    for (let i = 0; i < N; i++) { let y = pos[i * 3 + 1] + speed[i] * 0.016; if (y > 7) y = -7; pos[i * 3 + 1] = y; }
    dustGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }
  canvas.classList.add("is-on");
  if (REDUCED) { frame(); return; }
  // Calidad adaptativa: si la compu no llega, baja la resolución y el vidrio pasa a ser un brillo simple
  let last = performance.now(), slow = 0, checked = 0, lowered = false;
  renderer.setAnimationLoop(() => {
    if (document.hidden) { last = performance.now(); return; }
    frame();
    const now = performance.now(), dt = now - last; last = now;
    if (!lowered && clock.elapsedTime > 2.5 && checked < 120) {
      checked++; if (dt > 28) slow++;
      if (checked === 120 && slow > 60) {
        lowered = true;
        renderer.setPixelRatio(1); layout();
        glass.transmission = 0; glass.opacity = 0.12; glass.needsUpdate = true;
        key.castShadow = false; ruby.transmission = 0;
      }
    }
  });
}

if (canvas) start();
