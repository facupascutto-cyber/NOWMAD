/* nowmad agency — fondo 3D.
   La brújula de la marca en cromo, con giroscopio, galaxia de partículas y bloom.
   Three.js se pide recién después del evento load: la página carga primero y el 3D llega después.
   La brújula viaja entre las anclas [data-anchor] de cada sección. */

const canvas = document.querySelector("[data-scene]");
const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = matchMedia("(max-width: 760px)").matches;
const lowPower = small || (navigator.hardwareConcurrency || 8) <= 4;

const INK = 0x070b1f;
const CELESTE = 0x9aa8f5;
const COBALT = 0x3c4de6;

function start() {
  boot().catch((err) => {
    console.warn("[nowmad agency] 3D", err);
    root.classList.add("no-3d");
  });
}
if (document.readyState === "complete") setTimeout(start, 60);
else addEventListener("load", () => setTimeout(start, 60), { once: true });

async function boot() {
  if (!canvas) return;
  if (!document.createElement("canvas").getContext("webgl2")) throw new Error("sin WebGL2");

  const [THREE, { RoomEnvironment }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] =
    await Promise.all([
      import("three"),
      import("three/addons/environments/RoomEnvironment.js"),
      import("three/addons/postprocessing/EffectComposer.js"),
      import("three/addons/postprocessing/RenderPass.js"),
      import("three/addons/postprocessing/UnrealBloomPass.js"),
      import("three/addons/postprocessing/OutputPass.js"),
    ]);

  /* ---------- Render ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: "high-performance" });
  const DPR = Math.min(devicePixelRatio || 1, lowPower ? 1.25 : 1.75);
  renderer.setPixelRatio(DPR);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.FogExp2(INK, 0.012);

  const FOV = 35;
  const D = 18; // distancia de la cámara al plano z = 0
  const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 300);
  camera.position.set(0, 0, D);

  // Entorno de estudio para reflejos realistas en el cromo y el vidrio
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), lowPower ? 0.5 : 0.62, 0.42, 0.88);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- Luces ---------- */
  scene.add(new THREE.AmbientLight(0x3a4380, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(6, 9, 8);
  scene.add(key);
  const rim = new THREE.PointLight(0x6f7fff, 50, 60, 1.6);
  scene.add(rim);
  const warm = new THREE.PointLight(0xffd9b0, 18, 40, 1.8); // un toque cálido para que el cromo tenga contraste
  warm.position.set(-10, -6, 6);
  scene.add(warm);

  /* ---------- Mundo: todo se inclina apenas con el mouse ---------- */
  const world = new THREE.Group();
  scene.add(world);

  /* ---------- La brújula (rig) ---------- */
  const rig = new THREE.Group();
  world.add(rig);
  const R = 3; // radio del anillo, proporción del logo: r31 / trazo 14
  const TUBE = 0.68;
  const OUTER = R + TUBE;
  const FIT = 6.7; // radio total con el giroscopio: es lo que tiene que entrar en el ancla

  const chrome = new THREE.MeshPhysicalMaterial({
    color: 0x9ea9e0, metalness: 1, roughness: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.06,
    iridescence: 0.55, iridescenceIOR: 1.5, iridescenceThicknessRange: [180, 620],
    envMapIntensity: 1,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, TUBE, lowPower ? 48 : 96, lowPower ? 160 : 280), chrome);
  rig.add(ring);

  // Ranura luminosa en la cara frontal del anillo
  const glow = (color, intensity) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4, metalness: 0.1 });
  const groove = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 12, 240), glow(CELESTE, 1.5));
  groove.position.z = TUBE * 0.93;
  rig.add(groove);

  // Centro: núcleo que brilla dentro de una esfera de vidrio
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 32), glow(0xbac4ff, 2.2));
  rig.add(core);
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.92, 64, 48),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 1.4, ior: 1.5, clearcoat: 1, envMapIntensity: 0.8, transparent: true })
  );
  rig.add(glass);
  const coreLight = new THREE.PointLight(0x9aa8f5, 10, 9, 2);
  rig.add(coreLight);

  // Aguja: sale del centro hacia el noreste, como en el logo, y sigue al cursor
  const needlePivot = new THREE.Group();
  needlePivot.position.z = 0.2;
  rig.add(needlePivot);
  const NEEDLE = R * 2.28;
  const needleGeo = new THREE.CapsuleGeometry(0.15, NEEDLE - 0.3, 8, 20);
  needleGeo.rotateZ(-Math.PI / 2);
  needleGeo.translate((NEEDLE - 0.3) / 2 + 0.15, 0, 0);
  const needle = new THREE.Mesh(needleGeo, glow(CELESTE, 1.8));
  needlePivot.add(needle);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 16), glow(0xffffff, 2.6));
  tip.position.x = NEEDLE;
  needlePivot.add(tip);
  needlePivot.rotation.z = Math.PI / 4;

  // Giroscopio: anillos finos en ejes distintos, uno con marcas de grado
  const gyroA = new THREE.Group();
  const gyroB = new THREE.Group();
  const gyroC = new THREE.Group();
  rig.add(gyroA, gyroB, gyroC);

  gyroA.add(new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.035, 12, 280), glow(CELESTE, 1.1)));
  gyroA.rotation.x = Math.PI / 2.4;

  const thin = new THREE.MeshPhysicalMaterial({ color: 0xaab3e6, metalness: 1, roughness: 0.25, clearcoat: 1, envMapIntensity: 0.9 });
  gyroB.add(new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.06, 16, 320), thin));
  const TICKS = 144;
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 0.34, 0.045), thin, TICKS);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < TICKS; i++) {
    const a = (i / TICKS) * Math.PI * 2;
    const major = i % 12 === 0;
    const r = 5.5 + (major ? 0.36 : 0.24);
    q.setFromAxisAngle(zAxis, a - Math.PI / 2);
    sc.set(major ? 1.6 : 1, major ? 2.1 : 1, 1);
    m.compose(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0), q, sc);
    ticks.setMatrixAt(i, m);
  }
  gyroB.add(ticks);
  gyroB.rotation.y = 0.5;

  gyroC.add(new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.022, 8, 320), glow(COBALT, 1.6)));
  gyroC.rotation.set(1.1, 0.3, 0);

  // Satélites: luces chicas que orbitan la brújula en planos distintos
  const satellites = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.09 + Math.random() * 0.06, 16, 12), glow(i % 2 ? 0xffffff : CELESTE, 3));
    const orbit = new THREE.Group();
    orbit.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    orbit.add(s);
    rig.add(orbit);
    satellites.push({ s, orbit, r: 4.6 + Math.random() * 2.6, speed: 0.25 + Math.random() * 0.4, phase: Math.random() * 6.28 });
  }

  /* ---------- Partículas: galaxia, estrellas y polvo ---------- */
  const pointsMat = (size, alpha) => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: DPR }, uSize: { value: size }, uAlpha: { value: alpha } },
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uPx; uniform float uSize;
      attribute vec4 aData; attribute vec3 aColor; attribute float aScale;
      varying vec3 vColor; varying float vTw;
      void main() {
        float a = aData.x + uTime * aData.w * (6.0 / (aData.y + 2.0));
        vec3 p = vec3(cos(a) * aData.y, aData.z, sin(a) * aData.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * aScale * uPx * (20.0 / max(-mv.z, 0.5));
        vColor = aColor;
        vTw = 0.6 + 0.4 * sin(uTime * (1.0 + aData.w * 12.0) + aData.x * 37.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uAlpha; varying vec3 vColor; varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = pow(smoothstep(0.5, 0.0, d), 1.7);
        gl_FragColor = vec4(vColor * a * vTw * uAlpha, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });

  function cloud(count, make, size, alpha) {
    const data = new Float32Array(count * 4);
    const color = new Float32Array(count * 3);
    const scale = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) make(i, data, color, scale, c);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aData", new THREE.BufferAttribute(data, 4));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
    const p = new THREE.Points(g, pointsMat(size, alpha));
    p.frustumCulled = false;
    return p;
  }

  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const cWhite = new THREE.Color(0xffffff);
  const cCel = new THREE.Color(CELESTE);
  const cCob = new THREE.Color(COBALT);

  // Galaxia en espiral de tres brazos alrededor de la brújula
  const galaxy = cloud(lowPower ? 4000 : 11000, (i, d, col, s, c) => {
    const r = 4.4 + Math.pow(Math.random(), 1.7) * 19;
    const arm = (i % 3) * (Math.PI * 2 / 3);
    const spread = (Math.random() - 0.5) * (0.5 + r * 0.06);
    d[i * 4] = arm + r * 0.38 + spread;
    d[i * 4 + 1] = r + gauss() * 0.5;
    d[i * 4 + 2] = gauss() * (0.18 + r * 0.035);
    d[i * 4 + 3] = 0.04 + Math.random() * 0.08;
    const t = Math.min(1, (r - 4.4) / 16);
    c.copy(cWhite).lerp(cCel, Math.min(1, t * 1.6)).lerp(cCob, Math.max(0, t - 0.4));
    if (Math.random() < 0.06) c.copy(cWhite);
    col.set([c.r, c.g, c.b], i * 3);
    s[i] = 0.5 + Math.random() * 1.1;
  }, 1.5, 0.6);
  galaxy.rotation.set(1.12, 0, 0.25);
  world.add(galaxy);

  // Campo de estrellas lejano, en una cáscara esférica
  const stars = cloud(lowPower ? 1200 : 2600, (i, d, col, s, c) => {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const rad = 60 + Math.random() * 60;
    const x = Math.sqrt(1 - u * u) * Math.cos(th) * rad;
    const z = Math.sqrt(1 - u * u) * Math.sin(th) * rad;
    d[i * 4] = Math.atan2(z, x);
    d[i * 4 + 1] = Math.hypot(x, z);
    d[i * 4 + 2] = u * rad;
    d[i * 4 + 3] = 0.004 + Math.random() * 0.01;
    c.copy(cWhite).lerp(cCel, Math.random() * 0.6);
    col.set([c.r, c.g, c.b], i * 3);
    s[i] = 0.6 + Math.random() * 1.6;
  }, 2.4, 0.9);
  scene.add(stars);

  // Polvo cercano y desenfocado: da profundidad de cámara real
  const dust = cloud(lowPower ? 90 : 220, (i, d, col, s, c) => {
    d[i * 4] = Math.random() * Math.PI * 2;
    d[i * 4 + 1] = 3 + Math.random() * 14;
    d[i * 4 + 2] = (Math.random() - 0.5) * 16;
    d[i * 4 + 3] = 0.01 + Math.random() * 0.03;
    c.copy(cCel).lerp(cWhite, Math.random() * 0.5);
    col.set([c.r, c.g, c.b], i * 3);
    s[i] = 2 + Math.random() * 5;
  }, 3.2, 0.12);
  dust.position.z = 6;
  scene.add(dust);

  /* ---------- Coreografía: la brújula viaja entre anclas ---------- */
  const anchors = Array.from(document.querySelectorAll("[data-anchor]")).map((el) => ({
    el, pose: el.dataset.pose, section: el.closest("section") || el,
  }));

  const POSES = {
    hero: { rx: 0.42, ry: -0.62, rz: 0.12, size: 1 },
    face: { rx: 0, ry: 0, rz: 0, size: 1 },
    side: { rx: 0.35, ry: 0.95, rz: -0.1, size: 1 },
    side2: { rx: -0.5, ry: -0.8, rz: 0.2, size: 1 },
    fly: { rx: 0, ry: 0, rz: 0, size: 1 },
    rest: { rx: -0.25, ry: 0.55, rz: 0, size: 1 },
  };

  const target = { x: 0, y: 0, z: 0, s: 1, rx: 0, ry: 0, rz: 0, fly: 0 };
  const visibleH = () => 2 * D * Math.tan((FOV * Math.PI) / 360);
  let current = anchors[0];

  function pickAnchor() {
    const mid = innerHeight * 0.5;
    for (const a of anchors) {
      const r = a.section.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) return a;
    }
    return current;
  }

  function updateTarget() {
    current = pickAnchor();
    if (!current) return;
    const pose = POSES[current.pose] || POSES.face;
    const vh = visibleH();
    const vw = vh * (innerWidth / innerHeight);
    const pxToWorld = vh / innerHeight;

    if (current.pose === "fly") {
      // Proyectos: la brújula se acerca a la cámara y la atravesamos por el centro del anillo
      const r = current.section.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.25)));
      const e = t * t * (3 - 2 * t);
      target.x = 0; target.y = 0;
      target.s = (Math.min(innerWidth, innerHeight) * 0.42 * pxToWorld) / OUTER;
      target.z = e * (D + 4);
      target.rx = 0; target.ry = 0; target.rz = e * Math.PI * 0.75;
      target.fly = 1;
      return;
    }

    let r = current.el.getBoundingClientRect();
    if (!r.width) {
      // ancla oculta (p. ej. la brújula de servicios en celular): centro de la pantalla, detrás del contenido
      const w = Math.min(innerWidth, innerHeight) * 0.8;
      r = { left: (innerWidth - w) / 2, top: (innerHeight - w) / 2, width: w, height: w };
    }
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    target.x = (cx / innerWidth - 0.5) * vw;
    target.y = -(cy / innerHeight - 0.5) * vh;
    target.z = 0;
    target.s = Math.max(0.12, (r.width * 0.5 * pxToWorld) / FIT) * pose.size;
    target.rx = pose.rx; target.ry = pose.ry; target.rz = pose.rz;
    target.fly = 0;
  }

  /* ---------- Entrada: mouse y aguja ---------- */
  const mouse = { x: 0, y: 0, px: innerWidth / 2, py: innerHeight / 2 };
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / innerWidth - 0.5;
    mouse.y = e.clientY / innerHeight - 0.5;
    mouse.px = e.clientX;
    mouse.py = e.clientY;
    wake();
  }, { passive: true });

  // agency.js avisa a qué tarjeta de servicios apunta la brújula (ángulo en pantalla, o null)
  let aim = null;
  addEventListener("agency:aim", (e) => { aim = e.detail; wake(); });

  const tmpV = new THREE.Vector3();
  function needleTarget() {
    if (aim !== null && aim !== undefined) return -aim;
    rig.getWorldPosition(tmpV).project(camera);
    const sx = (tmpV.x * 0.5 + 0.5) * innerWidth;
    const sy = (-tmpV.y * 0.5 + 0.5) * innerHeight;
    return -Math.atan2(mouse.py - sy, mouse.px - sx);
  }

  /* ---------- Bucle ---------- */
  const clock = new THREE.Clock();
  let time = 0;
  let first = true;
  let running = false;
  let idleFrames = 0;
  let flyMix = 0;
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  const angleDamp = (a, b, k, dt) => {
    const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + d * (1 - Math.exp(-k * dt));
  };

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduced) time += dt;

    updateTarget();
    const k = reduced ? 1000 : 3.2;
    rig.position.x = damp(rig.position.x, target.x, k, dt);
    rig.position.y = damp(rig.position.y, target.y, k, dt);
    rig.position.z = damp(rig.position.z, target.z, k * 1.4, dt);
    const s = damp(rig.scale.x, target.s, k, dt);
    rig.scale.setScalar(s);
    const wob = reduced ? 0 : 1;
    rig.rotation.x = damp(rig.rotation.x, target.rx + Math.sin(time * 0.4) * 0.06 * wob, k, dt);
    rig.rotation.y = damp(rig.rotation.y, target.ry + Math.sin(time * 0.3) * 0.08 * wob, k, dt);
    rig.rotation.z = damp(rig.rotation.z, target.rz, k, dt);

    needlePivot.rotation.z = angleDamp(needlePivot.rotation.z, needleTarget(), reduced ? 1000 : 6, dt);

    gyroA.rotation.z += dt * 0.35 * wob;
    gyroA.rotation.x = Math.PI / 2.4 + Math.sin(time * 0.5) * 0.2 * wob;
    gyroB.rotation.y += dt * 0.22 * wob;
    gyroB.rotation.x = Math.sin(time * 0.27) * 0.35 * wob;
    gyroC.rotation.z -= dt * 0.12 * wob;
    satellites.forEach((o) => {
      const a = o.phase + time * o.speed;
      o.s.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0);
    });
    core.scale.setScalar(1 + Math.sin(time * 2.2) * 0.06 * wob);
    // Al atravesar el anillo el núcleo se apaga para que el texto de encima se lea
    flyMix = damp(flyMix, target.fly, 3, dt);
    const lit = 1 - flyMix * 0.92;
    core.material.emissiveIntensity = 2.2 * lit;
    coreLight.intensity = 10 * lit;
    glass.material.opacity = lit;
    needle.material.emissiveIntensity = 1.8 * (1 - flyMix * 0.7);
    tip.material.emissiveIntensity = 2.6 * lit;
    bloom.strength = (lowPower ? 0.5 : 0.62) * (1 - flyMix * 0.5);

    world.rotation.y = damp(world.rotation.y, mouse.x * 0.12, 2.5, dt);
    world.rotation.x = damp(world.rotation.x, mouse.y * 0.08, 2.5, dt);
    galaxy.position.x = damp(galaxy.position.x, rig.position.x * 0.45, 1.2, dt);
    galaxy.position.y = damp(galaxy.position.y, rig.position.y * 0.45, 1.2, dt);
    galaxy.rotation.y = -scrollY * 0.00035;
    stars.rotation.y = scrollY * 0.00008;
    dust.position.y = (scrollY * 0.004) % 12 - 6;

    rim.position.set(Math.cos(time * 0.6) * 12, 6, Math.sin(time * 0.6) * 12);

    [galaxy, stars, dust].forEach((p) => { p.material.uniforms.uTime.value = time; });

    if (quality > 0) composer.render();
    else renderer.render(scene, camera);
    adapt(dt);

    if (first) {
      first = false;
      root.classList.add("has-3d");
    }
    // Con movimiento reducido (o un equipo que no da más) se dibuja solo cuando algo cambia
    if ((reduced || quality < 0) && ++idleFrames > 30) { running = false; return; }
    requestAnimationFrame(frame);
  }

  // Calidad adaptativa: mide los primeros segundos y baja la exigencia si el equipo no llega
  //  1 = completo · 0 = sin bloom y resolución 1x · -1 = sin animación continua
  let quality = 1;
  let sampleTime = 0;
  let sampleFrames = 0;
  function adapt(dt) {
    if (reduced || quality < 0) return;
    sampleTime += dt;
    sampleFrames++;
    if (sampleTime < 2) return;
    const fps = sampleFrames / sampleTime;
    sampleTime = 0;
    sampleFrames = 0;
    if (fps >= 30) return;
    if (quality === 1) {
      quality = 0;
      renderer.setPixelRatio(1);
      renderer.setSize(innerWidth, innerHeight, false);
    } else if (fps < 20) {
      quality = -1;
    }
  }

  function wake() {
    idleFrames = 0;
    if (running) return;
    running = true;
    clock.getDelta();
    requestAnimationFrame(frame);
  }

  addEventListener("scroll", wake, { passive: true });
  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setSize(innerWidth, innerHeight);
    bloom.setSize(innerWidth, innerHeight);
    wake();
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(); });

  // Arranca sin animar: la brújula aparece directamente en su ancla
  updateTarget();
  rig.position.set(target.x, target.y, target.z);
  rig.scale.setScalar(target.s);
  rig.rotation.set(target.rx, target.ry, target.rz);
  wake();
}
