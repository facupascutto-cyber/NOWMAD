/* nowmad agency — fondo 3D.
   Render de producto en el espacio: la brújula de la marca en titanio cepillado, bronce y cristal,
   iluminada por un HDR de estudio real, con nebulosa procedural, estrellas con temperatura de color,
   estelas de hiperespacio al scrollear rápido, linterna en el cursor y post-proceso de cine.
   Three.js se pide recién después del evento load. La brújula viaja entre las anclas [data-anchor]. */

const canvas = document.querySelector("[data-scene]");
const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = matchMedia("(max-width: 760px)").matches;
const lowPower = small || (navigator.hardwareConcurrency || 8) <= 4;
const HDR_URL = "assets/hdr/studio_small_09_1k.hdr"; // Poly Haven, CC0

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

  const [THREE, { RoomEnvironment }, { RGBELoader }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, { ShaderPass }] =
    await Promise.all([
      import("three"),
      import("three/addons/environments/RoomEnvironment.js"),
      import("three/addons/loaders/RGBELoader.js"),
      import("three/addons/postprocessing/EffectComposer.js"),
      import("three/addons/postprocessing/RenderPass.js"),
      import("three/addons/postprocessing/UnrealBloomPass.js"),
      import("three/addons/postprocessing/OutputPass.js"),
      import("three/addons/postprocessing/ShaderPass.js"),
    ]);

  /* ================= Render ================= */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  let DPR = Math.min(devicePixelRatio || 1, lowPower ? 1.25 : 1.75);
  renderer.setPixelRatio(DPR);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.AgXToneMapping; // tono fílmico: nada de colores de caricatura
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03050f, 0.008);

  const FOV = 35;
  const D = 18; // distancia de la cámara al plano z = 0
  const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 400);
  camera.position.set(0, 0, D);

  // Antialiasing real dentro del post-proceso (MSAA en el render target)
  const target = new THREE.WebGLRenderTarget(innerWidth * DPR, innerHeight * DPR, {
    type: THREE.HalfFloatType,
    samples: lowPower ? 0 : 4,
  });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(DPR);
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  const BLOOM = lowPower ? 0.28 : 0.38;
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), BLOOM, 0.5, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Lente de cine: aberración cromática en los bordes, viñeta y grano de película
  const lens = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(innerWidth, innerHeight) },
      uCA: { value: lowPower ? 0.0 : 0.006 },
      uGrain: { value: 0.05 },
      uWarp: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; uniform float uCA; uniform float uGrain; uniform float uWarp;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c);
        vec2 off = c * (uCA + uWarp * 0.02) * d;
        vec3 col;
        col.r = texture2D(tDiffuse, vUv + off).r;
        col.g = texture2D(tDiffuse, vUv).g;
        col.b = texture2D(tDiffuse, vUv - off).b;
        col *= mix(1.0, smoothstep(0.95, 0.25, d), 0.6);
        float g = hash(vUv * uRes + fract(uTime * 7.13) * 91.7) - 0.5;
        col += g * uGrain;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  composer.addPass(lens);

  /* ================= Luz: HDR de estudio real ================= */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; // provisoria hasta que llega el HDR
  scene.environmentIntensity = 0.6;
  new RGBELoader().load(HDR_URL, (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    scene.environmentIntensity = 0.85;
    hdr.dispose();
    wake();
  }, undefined, () => { /* si falla queda el entorno provisorio */ });

  const key = new THREE.DirectionalLight(0xfff3e6, 0.7);
  key.position.set(6, 9, 8);
  scene.add(key);
  const rim = new THREE.PointLight(0x7f9cff, 35, 60, 1.6);
  scene.add(rim);
  // La linterna: una luz cálida que sigue al cursor y barre el metal
  const torch = new THREE.PointLight(0xfff1e0, 70, 26, 2);
  scene.add(torch);

  /* ================= Fondo: nebulosa procedural ================= */
  const nebula = new THREE.Mesh(
    new THREE.SphereGeometry(180, 48, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      defines: { OCT: lowPower ? 3 : 5 },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime; varying vec3 vDir;
        float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float noise(vec3 x) {
          vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < OCT; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
        void main() {
          vec3 d = normalize(vDir);
          float n = fbm(d * 2.1 + vec3(0.0, 0.0, uTime * 0.008));
          float n2 = fbm(d * 4.3 - vec3(uTime * 0.005, 0.0, 0.0) + n * 1.6);
          float cloud = smoothstep(0.42, 0.95, n2) * smoothstep(0.28, 0.78, n);
          vec3 base = vec3(0.006, 0.008, 0.024);
          vec3 c1 = vec3(0.07, 0.12, 0.36);
          vec3 c2 = vec3(0.22, 0.08, 0.26);
          vec3 c3 = vec3(0.03, 0.20, 0.26);
          vec3 neb = mix(c1, c2, smoothstep(0.35, 0.75, n));
          neb = mix(neb, c3, smoothstep(0.55, 0.9, n2) * 0.45);
          vec3 col = base + neb * cloud * 0.5;
          col *= 0.65 + 0.35 * smoothstep(0.25, 0.65, fbm(d * 9.0 + 3.0));
          gl_FragColor = vec4(col, 1.0);
        }`,
    })
  );
  nebula.renderOrder = -10;
  scene.add(nebula);

  /* ================= La brújula ================= */
  const world = new THREE.Group(); // todo se inclina apenas con el mouse
  scene.add(world);
  const rig = new THREE.Group(); // pose por sección
  world.add(rig);
  const body = new THREE.Group(); // giro con inercia cuando la arrastrás
  rig.add(body);

  const R = 3; // proporción del logo: r31 / trazo 14
  const TUBE = 0.68;
  const OUTER = R + TUBE;
  const FIT = 6.7; // radio total con el giroscopio: es lo que entra en el ancla

  const titanium = new THREE.MeshPhysicalMaterial({
    color: 0x9a9fad, metalness: 1, roughness: 0.27,
    anisotropy: 0.75, anisotropyRotation: Math.PI / 2, // metal cepillado siguiendo el anillo
    clearcoat: 0.5, clearcoatRoughness: 0.14,
    iridescence: 0.16, iridescenceIOR: 1.6, iridescenceThicknessRange: [300, 800],
  });
  const brass = new THREE.MeshPhysicalMaterial({ color: 0xc9a46b, metalness: 1, roughness: 0.3, anisotropy: 0.5, clearcoat: 0.3 });
  const steel = new THREE.MeshPhysicalMaterial({ color: 0x5d6374, metalness: 1, roughness: 0.38 });
  const polished = new THREE.MeshPhysicalMaterial({ color: 0xdde1ea, metalness: 1, roughness: 0.08, clearcoat: 1 });
  const led = (color, intensity) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, TUBE, lowPower ? 48 : 96, lowPower ? 180 : 320), titanium);
  body.add(ring);

  // Ranura grabada con una tira de luz fina adentro
  const groove = new THREE.Mesh(new THREE.TorusGeometry(R, 0.075, 12, 260), steel);
  groove.position.z = TUBE * 0.9;
  body.add(groove);
  const strip = new THREE.Mesh(new THREE.TorusGeometry(R, 0.024, 8, 260), led(0x9aa8f5, 2.2));
  strip.position.z = TUBE * 0.97;
  body.add(strip);

  // Centro: plasma blanco dentro de una esfera de cristal con dispersión (separa la luz como un prisma)
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, 48, 32), led(0xe4eaff, 5));
  body.add(core);
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 96, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.02,
      transmission: 1, thickness: 1.6, ior: 1.5, dispersion: lowPower ? 0 : 6,
      attenuationColor: new THREE.Color(0xc6d2ff), attenuationDistance: 3,
      clearcoat: 1, specularIntensity: 1, transparent: true,
    })
  );
  body.add(glass);
  const coreLight = new THREE.PointLight(0xcfd8ff, 14, 10, 2);
  body.add(coreLight);

  // Aguja de acero pulido con un led en la punta; apunta al cursor o a la tarjeta activa
  const needlePivot = new THREE.Group();
  needlePivot.position.z = 0.25;
  body.add(needlePivot);
  const NEEDLE = R * 2.28;
  const needleGeo = new THREE.CapsuleGeometry(0.13, NEEDLE - 0.26, 8, 24);
  needleGeo.rotateZ(-Math.PI / 2);
  needleGeo.translate((NEEDLE - 0.26) / 2 + 0.13, 0, 0);
  const needle = new THREE.Mesh(needleGeo, polished);
  needlePivot.add(needle);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 16), led(0xdfe6ff, 7));
  tip.position.x = NEEDLE;
  needlePivot.add(tip);
  needlePivot.rotation.z = Math.PI / 4;

  // Giroscopio: bronce, titanio con marcas de grado y acero oscuro, con sus pernos
  const gyroA = new THREE.Group();
  const gyroB = new THREE.Group();
  const gyroC = new THREE.Group();
  body.add(gyroA, gyroB, gyroC);

  gyroA.add(new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.075, 16, 300), brass));
  gyroB.add(new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.085, 16, 340), titanium));
  gyroC.add(new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.04, 10, 340), steel));

  const pinGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.5, 20);
  [[gyroA, 4.6], [gyroB, 5.5], [gyroC, 6.6]].forEach(([g, r]) => {
    [-1, 1].forEach((side) => {
      const pin = new THREE.Mesh(pinGeo, brass);
      pin.rotation.z = Math.PI / 2;
      pin.position.x = side * r;
      g.add(pin);
    });
  });

  const TICKS = 144;
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.3, 0.04), steel, TICKS - TICKS / 12);
  const majors = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), brass, TICKS / 12);
  const m4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const zAxis = new THREE.Vector3(0, 0, 1);
  let mi = 0;
  let ti = 0;
  for (let i = 0; i < TICKS; i++) {
    const a = (i / TICKS) * Math.PI * 2;
    const major = i % 12 === 0;
    const r = 5.5 + (major ? 0.42 : 0.26);
    quat.setFromAxisAngle(zAxis, a - Math.PI / 2);
    m4.compose(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0), quat, one);
    if (major) majors.setMatrixAt(mi++, m4);
    else ticks.setMatrixAt(ti++, m4);
  }
  gyroB.add(ticks, majors);

  // Destellos que orbitan: chicos y nítidos, como reflejos de satélites
  const satellites = [];
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), led(0xffffff, 9));
    const orbit = new THREE.Group();
    orbit.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    orbit.add(s);
    body.add(orbit);
    satellites.push({ s, r: 4.8 + Math.random() * 2.4, speed: 0.2 + Math.random() * 0.35, phase: Math.random() * 6.28 });
  }

  /* ================= Partículas ================= */
  // Estrella real: núcleo nítido + halo suave. Bokeh: disco con borde apenas más brillante.
  const pointsMat = (size, alpha, bokeh) => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: DPR }, uSize: { value: size }, uAlpha: { value: alpha } },
    defines: { BOKEH: bokeh ? 1 : 0 },
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
        vTw = 0.78 + 0.22 * sin(uTime * (0.7 + aData.w * 9.0) + aData.x * 37.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uAlpha; varying vec3 vColor; varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        #if BOKEH
          float a = pow(smoothstep(0.5, 0.0, d), 2.2);
        #else
          float a = exp(-d * d * 140.0) + exp(-d * d * 16.0) * 0.18;
        #endif
        gl_FragColor = vec4(vColor * a * vTw * uAlpha, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });

  function cloud(count, make, size, alpha, bokeh) {
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
    const p = new THREE.Points(g, pointsMat(size, alpha, bokeh));
    p.frustumCulled = false;
    return p;
  }

  // Temperaturas de color de estrellas reales: azul-blanco, blanco, amarillento, naranja
  const TEMPS = [0xaabfff, 0xcad7ff, 0xf3f5ff, 0xffffff, 0xfff4e8, 0xffe2bf, 0xffcc96].map((h) => new THREE.Color(h));
  const starColor = (c) => c.copy(TEMPS[Math.floor(Math.pow(Math.random(), 1.4) * TEMPS.length)]);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  // Brazo de polvo estelar alrededor de la brújula: fino y tenue
  const galaxy = cloud(lowPower ? 4000 : 12000, (i, d, col, s, c) => {
    const r = 4.6 + Math.pow(Math.random(), 1.6) * 20;
    const arm = (i % 2) * Math.PI;
    d[i * 4] = arm + r * 0.34 + (Math.random() - 0.5) * (0.4 + r * 0.05);
    d[i * 4 + 1] = r + gauss() * 0.6;
    d[i * 4 + 2] = gauss() * (0.12 + r * 0.03);
    d[i * 4 + 3] = 0.03 + Math.random() * 0.06;
    starColor(c);
    col.set([c.r, c.g, c.b], i * 3);
    s[i] = 0.35 + Math.pow(Math.random(), 3) * 1.4;
  }, 1.4, 0.55, false);
  galaxy.rotation.set(1.15, 0, 0.3);
  world.add(galaxy);

  const stars = cloud(lowPower ? 1800 : 4200, (i, d, col, s, c) => {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const rad = 70 + Math.random() * 90;
    const x = Math.sqrt(1 - u * u) * Math.cos(th) * rad;
    const z = Math.sqrt(1 - u * u) * Math.sin(th) * rad;
    d[i * 4] = Math.atan2(z, x);
    d[i * 4 + 1] = Math.hypot(x, z);
    d[i * 4 + 2] = u * rad;
    d[i * 4 + 3] = 0.002 + Math.random() * 0.006;
    starColor(c);
    col.set([c.r, c.g, c.b], i * 3);
    s[i] = 0.5 + Math.pow(Math.random(), 4) * 3.5;
  }, 2.6, 1, false);
  scene.add(stars);

  const dust = cloud(lowPower ? 60 : 140, (i, d, col, s, c) => {
    d[i * 4] = Math.random() * Math.PI * 2;
    d[i * 4 + 1] = 3 + Math.random() * 14;
    d[i * 4 + 2] = (Math.random() - 0.5) * 16;
    d[i * 4 + 3] = 0.01 + Math.random() * 0.02;
    c.set(0xb8c4ff);
    col.set([c.r, c.g, c.b], i * 3);
    s[i] = 3 + Math.random() * 6;
  }, 3.2, 0.035, true);
  dust.position.z = 7;
  scene.add(dust);

  // Hiperespacio: estelas que aparecen y se estiran con la velocidad del scroll
  const WARP = lowPower ? 260 : 600;
  const wBase = new Float32Array(WARP * 2 * 3);
  const wTail = new Float32Array(WARP * 2);
  for (let i = 0; i < WARP; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.5 + Math.pow(Math.random(), 0.7) * 26;
    const z = -80 + Math.random() * 90;
    for (let k = 0; k < 2; k++) {
      wBase.set([Math.cos(a) * r, Math.sin(a) * r, z], (i * 2 + k) * 3);
      wTail[i * 2 + k] = k;
    }
  }
  const warpGeo = new THREE.BufferGeometry();
  warpGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(WARP * 2 * 3), 3));
  warpGeo.setAttribute("aBase", new THREE.BufferAttribute(wBase, 3));
  warpGeo.setAttribute("aTail", new THREE.BufferAttribute(wTail, 1));
  const warp = new THREE.LineSegments(warpGeo, new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uVel: { value: 0 } },
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uVel;
      attribute vec3 aBase; attribute float aTail;
      varying float vA;
      void main() {
        float z = mod(aBase.z + uTime * 4.0 + 80.0, 90.0) - 80.0;
        vec3 p = vec3(aBase.xy, z + aTail * uVel * 26.0);
        vA = (1.0 - aTail) * clamp(abs(uVel) * 1.4, 0.0, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying float vA;
      void main() { gl_FragColor = vec4(vec3(0.78, 0.84, 1.0) * vA * 1.6, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  warp.frustumCulled = false;
  scene.add(warp);

  /* ================= Coreografía por anclas ================= */
  const anchors = Array.from(document.querySelectorAll("[data-anchor]")).map((el) => ({
    el, pose: el.dataset.pose, section: el.closest("section") || el,
  }));

  const POSES = {
    hero: { rx: 0.38, ry: -0.6, rz: 0.1 },
    face: { rx: 0, ry: 0, rz: 0 },
    side: { rx: 0.35, ry: 0.95, rz: -0.1 },
    side2: { rx: -0.5, ry: -0.8, rz: 0.2 },
    fly: { rx: 0, ry: 0, rz: 0 },
    rest: { rx: -0.25, ry: 0.55, rz: 0 },
  };

  const goal = { x: 0, y: 0, z: 0, s: 1, rx: 0, ry: 0, rz: 0, fly: 0 };
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

  function updateGoal() {
    current = pickAnchor();
    if (!current) return;
    const pose = POSES[current.pose] || POSES.face;
    const vh = visibleH();
    const vw = vh * (innerWidth / innerHeight);
    const pxToWorld = vh / innerHeight;

    if (current.pose === "fly") {
      // Proyectos: la brújula viene hacia la cámara y la atravesamos por el centro del anillo
      const r = current.section.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.25)));
      const e = t * t * (3 - 2 * t);
      goal.x = 0; goal.y = 0;
      goal.s = (Math.min(innerWidth, innerHeight) * 0.42 * pxToWorld) / OUTER;
      goal.z = e * (D + 4);
      goal.rx = 0; goal.ry = 0; goal.rz = e * Math.PI * 0.75;
      goal.fly = 1;
      return;
    }

    let r = current.el.getBoundingClientRect();
    if (!r.width) {
      const w = Math.min(innerWidth, innerHeight) * 0.8;
      r = { left: (innerWidth - w) / 2, top: (innerHeight - w) / 2, width: w, height: w };
    }
    goal.x = ((r.left + r.width / 2) / innerWidth - 0.5) * vw;
    goal.y = -((r.top + r.height / 2) / innerHeight - 0.5) * vh;
    goal.z = 0;
    goal.s = Math.max(0.12, (r.width * 0.5 * pxToWorld) / FIT);
    goal.rx = pose.rx; goal.ry = pose.ry; goal.rz = pose.rz;
    goal.fly = 0;
  }

  /* ================= Entrada ================= */
  const mouse = { x: 0, y: 0, px: innerWidth * 0.7, py: innerHeight * 0.3 };
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / innerWidth - 0.5;
    mouse.y = e.clientY / innerHeight - 0.5;
    mouse.px = e.clientX;
    mouse.py = e.clientY;
    wake();
  }, { passive: true });

  let aim = null;
  addEventListener("agency:aim", (e) => { aim = e.detail; wake(); });

  // Agarrala y tirala: en el ancla del hero se puede arrastrar la brújula y gira con inercia
  const spin = { x: 0, y: 0, vx: 0, vy: 0, dragging: false, lx: 0, ly: 0, moved: 0 };
  const grab = document.querySelector(".ag-anchor-hero");
  if (grab && !reduced) {
    grab.addEventListener("pointerdown", (e) => {
      spin.dragging = true; spin.lx = e.clientX; spin.ly = e.clientY; spin.moved = 0;
      try { grab.setPointerCapture(e.pointerId); } catch (_) { /* sin captura igual funciona */ }
      root.classList.add("ag-grabbing");
      wake();
    });
    grab.addEventListener("pointermove", (e) => {
      if (!spin.dragging) return;
      const dx = e.clientX - spin.lx;
      const dy = e.clientY - spin.ly;
      spin.lx = e.clientX; spin.ly = e.clientY;
      spin.moved += Math.abs(dx) + Math.abs(dy);
      spin.vy = dx * 0.6;
      spin.vx = dy * 0.6;
      spin.y += dx * 0.012;
      spin.x += dy * 0.012;
    });
    const release = () => {
      if (!spin.dragging) return;
      spin.dragging = false;
      if (spin.moved < 4) spin.vy += 9; // un toque: le das un empujón
      root.classList.add("ag-dragged");
      root.classList.remove("ag-grabbing");
    };
    grab.addEventListener("pointerup", release);
    grab.addEventListener("pointercancel", release);
  }

  const tmpV = new THREE.Vector3();
  function needleGoal() {
    if (aim !== null && aim !== undefined) return -aim;
    rig.getWorldPosition(tmpV).project(camera);
    const sx = (tmpV.x * 0.5 + 0.5) * innerWidth;
    const sy = (-tmpV.y * 0.5 + 0.5) * innerHeight;
    return -Math.atan2(mouse.py - sy, mouse.px - sx);
  }

  // Linterna: proyecta el cursor a un plano delante de la brújula
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const torchPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const torchPos = new THREE.Vector3();
  function placeTorch() {
    ndc.set((mouse.px / innerWidth) * 2 - 1, -(mouse.py / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    torchPlane.constant = -(rig.position.z + 5);
    if (ray.ray.intersectPlane(torchPlane, torchPos)) torch.position.lerp(torchPos, 0.2);
  }

  /* ================= Bucle ================= */
  const clock = new THREE.Clock();
  let time = 0;
  let intro = reduced ? 1 : 0; // ensamble inicial: 0 → 1
  const introStart = performance.now();
  let first = true;
  let running = false;
  let idleFrames = 0;
  let flyMix = 0;
  let vel = 0;
  let lastScroll = scrollY;
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  const angleDamp = (a, b, k, dt) => {
    const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + d * (1 - Math.exp(-k * dt));
  };
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 4);

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduced) time += dt;
    if (intro < 1) intro = Math.min(1, (performance.now() - introStart) / 3000);
    const it = intro * 3; // segundos de intro

    // Velocidad del scroll → hiperespacio
    const v = (scrollY - lastScroll) / Math.max(dt, 0.001);
    lastScroll = scrollY;
    vel = damp(vel, reduced ? 0 : Math.max(-1.3, Math.min(1.3, v / 2600)), 5, dt);
    warp.material.uniforms.uVel.value = vel;
    lens.uniforms.uWarp.value = Math.abs(vel);
    camera.fov = FOV + Math.abs(vel) * 9;
    camera.updateProjectionMatrix();

    updateGoal();
    const k = reduced ? 1000 : 3.2;
    rig.position.x = damp(rig.position.x, goal.x, k, dt);
    rig.position.y = damp(rig.position.y, goal.y, k, dt);
    rig.position.z = damp(rig.position.z, goal.z, k * 1.4, dt);
    rig.scale.setScalar(damp(rig.scale.x, goal.s, k, dt));
    const wob = reduced ? 0 : 1;
    rig.rotation.x = damp(rig.rotation.x, goal.rx + Math.sin(time * 0.4) * 0.05 * wob, k, dt);
    rig.rotation.y = damp(rig.rotation.y, goal.ry + Math.sin(time * 0.3) * 0.07 * wob, k, dt);
    rig.rotation.z = damp(rig.rotation.z, goal.rz, k, dt);

    // Giro con inercia (arrastre) y ensamble de entrada
    if (!spin.dragging) {
      spin.y += spin.vy * dt * 0.02;
      spin.x += spin.vx * dt * 0.02;
      spin.vy *= Math.exp(-1.1 * dt);
      spin.vx *= Math.exp(-1.1 * dt);
      spin.x = damp(spin.x, 0, 0.6, dt); // de a poco vuelve a mirar al frente
    }
    const eRing = easeOut((it - 0.0) / 1.6);
    const eA = easeOut((it - 0.35) / 1.8);
    const eB = easeOut((it - 0.6) / 1.9);
    const eC = easeOut((it - 0.85) / 1.9);
    const eCore = easeOut((it - 1.4) / 1.2);
    body.rotation.set(spin.x, spin.y + (1 - eRing) * Math.PI * 2.5, 0);
    ring.scale.setScalar(0.55 + 0.45 * eRing);
    gyroA.scale.setScalar(Math.max(0.001, eA));
    gyroB.scale.setScalar(Math.max(0.001, eB));
    gyroC.scale.setScalar(Math.max(0.001, eC));

    needlePivot.rotation.z = angleDamp(needlePivot.rotation.z, needleGoal(), reduced ? 1000 : 6, dt);

    gyroA.rotation.set(Math.PI / 2.4 + Math.sin(time * 0.5) * 0.2 * wob + (1 - eA) * 5, 0, time * 0.35 * wob);
    gyroB.rotation.set(Math.sin(time * 0.27) * 0.35 * wob, 0.5 + time * 0.22 * wob + (1 - eB) * 6, 0);
    gyroC.rotation.set(1.1, 0.3 + (1 - eC) * -5, -time * 0.12 * wob);
    satellites.forEach((o) => {
      const a = o.phase + time * o.speed;
      o.s.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0);
    });

    // Al atravesar el anillo el núcleo se apaga para que el texto de encima se lea
    flyMix = damp(flyMix, goal.fly, 3, dt);
    const lit = (1 - flyMix * 0.9) * eCore;
    core.material.emissiveIntensity = 5 * lit * (1 + Math.sin(time * 2.4) * 0.08 * wob);
    coreLight.intensity = 14 * lit;
    tip.material.emissiveIntensity = 7 * lit;
    strip.material.emissiveIntensity = 2.2 * (0.25 + 0.75 * lit);
    bloom.strength = BLOOM * (1 - flyMix * 0.5);

    world.rotation.y = damp(world.rotation.y, mouse.x * 0.1, 2.5, dt);
    world.rotation.x = damp(world.rotation.x, mouse.y * 0.06, 2.5, dt);
    galaxy.position.x = damp(galaxy.position.x, rig.position.x * 0.45, 1.2, dt);
    galaxy.position.y = damp(galaxy.position.y, rig.position.y * 0.45, 1.2, dt);
    galaxy.rotation.y = -scrollY * 0.0003;
    stars.rotation.y = scrollY * 0.00006 + time * 0.002;
    nebula.rotation.y = scrollY * 0.00004;
    dust.position.y = (scrollY * 0.004) % 12 - 6;
    scene.environmentRotation.y = time * 0.05 + mouse.x * 0.6; // las luces del estudio barren el metal

    placeTorch();
    rim.position.set(Math.cos(time * 0.5) * 13, 7, Math.sin(time * 0.5) * 13);

    nebula.material.uniforms.uTime.value = time;
    warp.material.uniforms.uTime.value = time;
    lens.uniforms.uTime.value = time;
    [galaxy, stars, dust].forEach((p) => { p.material.uniforms.uTime.value = time; });

    if (quality > 0) composer.render();
    else renderer.render(scene, camera);
    adapt(dt);

    if (first) {
      first = false;
      root.classList.add("has-3d");
    }
    const settling = intro < 1 || spin.dragging || Math.abs(spin.vy) > 0.05 || Math.abs(vel) > 0.01;
    // Con movimiento reducido (o un equipo que no da más) se dibuja solo cuando algo cambia
    if ((reduced || quality < 0) && !settling && ++idleFrames > 30) { running = false; return; }
    requestAnimationFrame(frame);
  }

  // Calidad adaptativa: 1 = completo · 0 = sin post-proceso y resolución 1x · -1 = sin animación continua
  let quality = 1;
  let sampleTime = 0;
  let sampleFrames = 0;
  function adapt(dt) {
    if (reduced || quality < 0) return;
    sampleTime += dt;
    sampleFrames++;
    if (sampleTime < 2.5) return;
    const fps = sampleFrames / sampleTime;
    sampleTime = 0;
    sampleFrames = 0;
    if (fps >= 30) return;
    if (quality === 1) {
      quality = 0;
      DPR = 1;
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
    lens.uniforms.uRes.value.set(innerWidth, innerHeight);
    wake();
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(); });

  // Arranca en su ancla, sin viajar
  updateGoal();
  rig.position.set(goal.x, goal.y, goal.z);
  rig.scale.setScalar(goal.s);
  rig.rotation.set(goal.rx, goal.ry, goal.rz);
  wake();
}
