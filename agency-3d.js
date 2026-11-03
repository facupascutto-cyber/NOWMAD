/* nowmad agency — fondo 3D: la Tierra, de verdad y en vivo.
   - Texturas satelitales de la NASA (Blue Marble y Black Marble, dominio público).
   - El sol está donde está ahora: la línea día/noche se calcula con la fecha y hora UTC reales.
   - Atmósfera, nubes que se mueven, reflejo del sol en los océanos, luces de ciudades,
     rayos en tormentas nocturnas, estrellas fugaces y Vía Láctea.
   - Buenos Aires marcada en sus coordenadas (34°36′S 58°22′O).
   Three.js se pide recién después del evento load. La Tierra viaja entre las anclas [data-anchor]. */

const canvas = document.querySelector("[data-scene]");
const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = matchMedia("(max-width: 760px)").matches;
const lowPower = small || (navigator.hardwareConcurrency || 8) <= 4;
const TEX = lowPower
  ? { day: "assets/earth/earth-day-2048.jpg", night: "assets/earth/earth-night-2048.jpg", clouds: "assets/earth/earth-clouds-1024.jpg" }
  : { day: "assets/earth/earth-day-4096.jpg", night: "assets/earth/earth-night-4096.jpg", clouds: "assets/earth/earth-clouds-2048.jpg" };
const BA = { lat: -34.6037, lon: -58.3816 };

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

  const [THREE, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, { ShaderPass }] = await Promise.all([
    import("three"),
    import("three/addons/postprocessing/EffectComposer.js"),
    import("three/addons/postprocessing/RenderPass.js"),
    import("three/addons/postprocessing/UnrealBloomPass.js"),
    import("three/addons/postprocessing/OutputPass.js"),
    import("three/addons/postprocessing/ShaderPass.js"),
  ]);

  const D2R = Math.PI / 180;
  // Misma convención que SphereGeometry: u = 0 en longitud -180
  const latLon = (lat, lon, r = 1) => {
    const la = lat * D2R;
    const ph = (lon + 180) * D2R;
    return new THREE.Vector3(-Math.cos(ph) * Math.cos(la) * r, Math.sin(la) * r, Math.sin(ph) * Math.cos(la) * r);
  };

  // Posición real del sol: declinación por día del año + ecuación del tiempo
  // ?hora=HH (hora de Buenos Aires) permite ver el viaje de día o de noche sin esperar
  const forcedHour = new URLSearchParams(location.search).get("hora");
  function sunNow(date = new Date()) {
    if (forcedHour !== null && forcedHour !== "" && !isNaN(+forcedHour)) {
      date = new Date(date);
      date.setUTCHours(Math.floor(+forcedHour) + 3, Math.round((+forcedHour % 1) * 60), 0, 0);
    }
    const day = (date - Date.UTC(date.getUTCFullYear(), 0, 0)) / 864e5;
    const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (day + 10));
    const B = (2 * Math.PI * (day - 81)) / 364;
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    return latLon(decl, -15 * (hours - 12 + eot / 60)).normalize();
  }

  /* ================= Render ================= */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  let DPR = Math.min(devicePixelRatio || 1, lowPower ? 1.25 : 1.75);
  renderer.setPixelRatio(DPR);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  const FOV = 35;
  const D = 18;
  const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.05, 600);
  camera.position.set(0, 0, D);

  const rt = new THREE.WebGLRenderTarget(innerWidth * DPR, innerHeight * DPR, { type: THREE.HalfFloatType, samples: lowPower ? 0 : 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(DPR);
  composer.setSize(innerWidth, innerHeight);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.45, 0.55, 0.85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const lens = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(innerWidth, innerHeight) }, uCA: { value: lowPower ? 0 : 0.004 }, uFade: { value: 0 }, uFadeCol: { value: new THREE.Vector3(0.82, 0.86, 0.93) } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; uniform float uCA; uniform float uFade; uniform vec3 uFadeCol; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 c = vUv - 0.5; float d = length(c); vec2 off = c * uCA * d;
        vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
        col *= mix(1.0, smoothstep(0.95, 0.3, d), 0.45);
        col = mix(col, uFadeCol * (0.9 + 0.1 * smoothstep(0.7, 0.0, d)), uFade);
        col += (hash(vUv * uRes + fract(uTime * 7.13) * 91.7) - 0.5) * 0.035;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  composer.addPass(lens);

  /* ================= Texturas NASA ================= */
  const loader = new THREE.TextureLoader();
  const load = (url, srgb) => new Promise((res, rej) => loader.load(url, (t) => {
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.wrapS = THREE.RepeatWrapping;
    res(t);
  }, undefined, rej));
  const [dayMap, nightMap, cloudMap] = await Promise.all([load(TEX.day, true), load(TEX.night, true), load(TEX.clouds, false)]);

  /* ================= La Tierra ================= */
  const sunObj = sunNow(); // dirección del sol en coordenadas de la Tierra
  const sunView = new THREE.Vector3();
  const MAX_FLASH = 4;

  const earthMat = new THREE.ShaderMaterial({
    uniforms: {
      uDay: { value: dayMap }, uNight: { value: nightMap }, uClouds: { value: cloudMap },
      uSun: { value: sunObj }, uSunView: { value: sunView },
      uCloudShift: { value: 0 }, uTime: { value: 0 },
      uFlash: { value: Array.from({ length: MAX_FLASH }, () => new THREE.Vector4(0, 0, 0, 0)) },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN; varying vec3 vNv; varying vec3 vPos;
      void main() {
        vUv = uv; vN = normal;
        vNv = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vPos = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uDay; uniform sampler2D uNight; uniform sampler2D uClouds;
      uniform vec3 uSun; uniform vec3 uSunView; uniform float uCloudShift; uniform float uTime;
      uniform vec4 uFlash[${MAX_FLASH}];
      varying vec2 vUv; varying vec3 vN; varying vec3 vNv; varying vec3 vPos;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main() {
        vec3 n = normalize(vN);
        float ndl = dot(n, uSun);
        float dayMix = smoothstep(-0.10, 0.20, ndl);

        vec3 day = texture2D(uDay, vUv).rgb;
        vec3 night = texture2D(uNight, vUv).rgb;
        vec2 cuv = vUv + vec2(uCloudShift, 0.0);
        float clouds = smoothstep(0.08, 0.9, texture2D(uClouds, cuv).r);
        // sombra de las nubes, corrida hacia el lado contrario al sol
        float shadow = smoothstep(0.08, 0.9, texture2D(uClouds, cuv + uSun.xz * 0.0025).r);

        vec3 V = normalize(-vPos);
        vec3 Nv = normalize(vNv);
        float ocean = smoothstep(0.015, 0.09, day.b - max(day.r, day.g) * 0.85);

        // Día: luz difusa
        float diff = clamp(ndl * 1.05 + 0.05, 0.0, 1.0);
        vec3 lit = day * diff * (1.0 - shadow * 0.45);
        lit = mix(lit, vec3(0.96, 0.97, 1.0) * (0.06 + diff), clouds);

        // Reflejo del sol en el agua
        vec3 H = normalize(uSunView + V);
        float nh = max(dot(Nv, H), 0.0);
        float spec = pow(nh, 90.0) * 2.6 + pow(nh, 12.0) * 0.12;
        lit += vec3(1.0, 0.93, 0.82) * spec * ocean * (1.0 - clouds) * smoothstep(0.0, 0.2, ndl);

        // Noche: luces de ciudades con un titileo mínimo, apagadas bajo las nubes
        float flick = 0.92 + 0.08 * hash(floor(vUv * 900.0) + floor(uTime * 6.0));
        vec3 city = pow(night, vec3(1.4)) * vec3(1.0, 0.78, 0.48) * 3.2 * flick * (1.0 - clouds * 0.75);
        vec3 nightSide = city + day * 0.012 + clouds * 0.010;

        // Rayos: destellos breves dentro de las nubes de tormenta del lado nocturno
        vec3 flash = vec3(0.0);
        for (int i = 0; i < ${MAX_FLASH}; i++) {
          vec4 f = uFlash[i];
          if (f.z <= 0.0) continue;
          vec2 dv = vUv - f.xy;
          dv.x = mod(dv.x + 0.5, 1.0) - 0.5;
          dv.x *= 2.0;
          flash += vec3(0.75, 0.82, 1.0) * f.z * exp(-dot(dv, dv) / (f.w * f.w)) * (0.35 + clouds);
        }

        vec3 col = mix(nightSide + flash, lit, dayMix);

        // Atardecer: la línea día/noche se tiñe de naranja
        float dusk = smoothstep(-0.12, 0.02, ndl) * smoothstep(0.22, 0.02, ndl);
        col += vec3(1.0, 0.42, 0.12) * dusk * 0.05 * (0.4 + clouds);

        // Bruma de la atmósfera en el borde del disco
        float fres = pow(1.0 - max(dot(Nv, V), 0.0), 3.5);
        col += vec3(0.30, 0.52, 1.0) * fres * smoothstep(-0.2, 0.5, ndl) * 0.9;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });

  const SEG = lowPower ? 96 : 192;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, SEG, SEG / 2), earthMat);

  // Atmósfera: una cáscara apenas más grande, brillante en el limbo
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(1.06, SEG / 2, SEG / 4),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uSunView: { value: sunView } },
      vertexShader: /* glsl */`
        varying vec3 vNv; varying vec3 vPos;
        void main() { vNv = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vPos = mv.xyz; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunView; varying vec3 vNv; varying vec3 vPos;
        void main() {
          vec3 N = normalize(vNv); vec3 V = normalize(-vPos);
          float d = abs(dot(N, V));
          float glow = pow(clamp(d / 0.33, 0.0, 1.0), 3.0);
          float sunSide = dot(-N, uSunView);
          float lit = smoothstep(-0.45, 0.35, sunSide);
          vec3 c = mix(vec3(1.0, 0.45, 0.18), vec3(0.32, 0.58, 1.0), smoothstep(-0.15, 0.35, sunSide));
          gl_FragColor = vec4(c * glow * lit * 1.5, 1.0);
        }`,
    })
  );

  // Buenos Aires: una luz cálida y una onda que se expande
  const baPos = latLon(BA.lat, BA.lon, 1.002);
  const baDot = new THREE.Mesh(new THREE.SphereGeometry(0.006, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.4, 2.4) }));
  baDot.position.copy(baPos);
  const baRing = new THREE.Mesh(
    new THREE.RingGeometry(0.010, 0.0125, 64),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.9, 1.4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  baRing.position.copy(baPos);
  baRing.lookAt(baPos.clone().multiplyScalar(2));
  earth.add(baDot, baRing);

  // Jerarquía: rig (lugar y tamaño) → tilt (inclinación de cámara) → spin (qué punto mira) → Tierra
  const rig = new THREE.Group();
  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  scene.add(rig);
  rig.add(tilt);
  tilt.add(spin);
  spin.add(earth, atmo);

  /* ================= El sol ================= */
  const glare = document.createElement("canvas");
  glare.width = glare.height = 256;
  const g2 = glare.getContext("2d");
  const grad = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.05, "rgba(255,250,235,0.95)");
  grad.addColorStop(0.15, "rgba(255,225,180,0.35)");
  grad.addColorStop(0.45, "rgba(255,190,140,0.07)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g2.fillStyle = grad;
  g2.fillRect(0, 0, 256, 256);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(glare), color: new THREE.Color(3, 2.85, 2.6),
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true,
  }));
  sun.scale.setScalar(48);
  scene.add(sun);

  /* ================= Cielo: Vía Láctea y estrellas ================= */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 48, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      defines: { OCT: lowPower ? 3 : 5 },
      vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        varying vec3 vDir;
        float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float noise(vec3 x) { vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
        float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < OCT; i++) { s += a * noise(p); p *= 2.07; a *= 0.5; } return s; }
        void main() {
          vec3 d = normalize(vDir);
          vec3 bandN = normalize(vec3(0.35, 0.85, -0.4));
          float band = exp(-pow(dot(d, bandN), 2.0) * 22.0);
          float dust = fbm(d * 6.0);
          float lanes = smoothstep(0.35, 0.7, fbm(d * 11.0 + 4.0));
          vec3 milky = mix(vec3(0.55, 0.52, 0.48), vec3(0.42, 0.48, 0.62), dust) * band * (0.35 + dust) * (1.0 - lanes * 0.6);
          gl_FragColor = vec4(vec3(0.002, 0.003, 0.007) + milky * 0.05, 1.0);
        }`,
    })
  );
  scene.add(sky);

  const TEMPS = [0xaabfff, 0xcad7ff, 0xf3f5ff, 0xffffff, 0xfff4e8, 0xffe2bf, 0xffcc96].map((h) => new THREE.Color(h));
  const STARS = lowPower ? 2200 : 5000;
  const sPos = new Float32Array(STARS * 3);
  const sCol = new Float32Array(STARS * 3);
  const sSize = new Float32Array(STARS);
  for (let i = 0; i < STARS; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = 200 + Math.random() * 80;
    sPos.set([Math.sqrt(1 - u * u) * Math.cos(th) * r, u * r, Math.sqrt(1 - u * u) * Math.sin(th) * r], i * 3);
    const c = TEMPS[Math.floor(Math.pow(Math.random(), 1.4) * TEMPS.length)];
    const b = 0.35 + Math.pow(Math.random(), 6) * 2.4;
    sCol.set([c.r * b, c.g * b, c.b * b], i * 3);
    sSize[i] = 0.7 + Math.pow(Math.random(), 5) * 2.2;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  starGeo.setAttribute("aColor", new THREE.BufferAttribute(sCol, 3));
  starGeo.setAttribute("aSize", new THREE.BufferAttribute(sSize, 1));
  const stars = new THREE.Points(starGeo, new THREE.ShaderMaterial({
    uniforms: { uPx: { value: DPR }, uTime: { value: 0 } },
    vertexShader: /* glsl */`
      uniform float uPx; uniform float uTime; attribute vec3 aColor; attribute float aSize; varying vec3 vC;
      void main() {
        vC = aColor * (0.85 + 0.15 * sin(uTime * 1.7 + position.x * 0.37 + position.y));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPx * 2.2;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vC;
      void main() { float d = length(gl_PointCoord - 0.5); float a = exp(-d * d * 60.0) + exp(-d * d * 12.0) * 0.15; gl_FragColor = vec4(vC * a, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  stars.frustumCulled = false;
  scene.add(stars);

  // Estrellas fugaces
  const meteorGeo = new THREE.BufferGeometry();
  meteorGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  meteorGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array([2.2, 2.2, 2.4, 0, 0, 0]), 3));
  const meteor = new THREE.Line(meteorGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  meteor.frustumCulled = false;
  meteor.visible = false;
  scene.add(meteor);
  const met = { life: 0, next: 3 + Math.random() * 4, a: new THREE.Vector3(), dir: new THREE.Vector3() };

  /* ================= Coreografía por anclas ================= */
  const anchors = Array.from(document.querySelectorAll("[data-anchor]")).map((el) => ({ el, pose: el.dataset.pose, section: el.closest("section") || el }));
  // lat/lon: punto que mira a la cámara · tx/tz: inclinación · size: radio relativo al ancla · drift: giro lento
  const POSES = {
    hero: { lat: BA.lat + 9, lon: BA.lon + 22, tx: 0, tz: 0.32, size: 1, drift: 0 },
    face: { lat: BA.lat, lon: BA.lon - 10, tx: -1.32, tz: 0.08, size: 1, drift: 1.4, horizon: true },
    fly: { lat: BA.lat, lon: BA.lon, tx: 0, tz: 0.2, size: 1, drift: 0 },
    journey: { lat: BA.lat, lon: BA.lon, tx: 0, tz: 0, size: 1, drift: 0, journey: true },
    side: { lat: 12, lon: -20, tx: 0, tz: 0.4, size: 1.05, drift: 2.2 },
    side2: { lat: 30, lon: 60, tx: 0, tz: -0.3, size: 1.05, drift: 2.2 },
    rest: { lat: BA.lat + 6, lon: BA.lon + 8, tx: 0, tz: 0.3, size: 1.1, drift: 0 },
  };

  const goal = { x: 0, y: 0, s: 1, lat: 0, lon: 0, tx: 0, tz: 0 };
  const visibleH = () => 2 * D * Math.tan((FOV * Math.PI) / 360);
  let current = anchors[0];
  let driftLon = 0;
  let journeyP = 0;
  const CITY_AT = 0.3; // a partir de acá del viaje se pasa a la ciudad

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
    const pose = POSES[current.pose] || POSES.side;
    const vh = visibleH();
    const vw = vh * (innerWidth / innerHeight);
    const pxToWorld = vh / innerHeight;
    goal.lat = pose.lat; goal.lon = pose.lon + driftLon * pose.drift; goal.tx = pose.tx; goal.tz = pose.tz;

    if (pose.journey) {
      // Viaje a Buenos Aires, primera parte: zoom a la Tierra hasta casi tocarla
      const r = current.section.getBoundingClientRect();
      journeyP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      const e = Math.min(1, journeyP / CITY_AT);
      const s0 = Math.min(vw, vh) * 0.42;
      goal.x = 0; goal.y = 0;
      goal.s = s0 * Math.pow((D - 1.1) / s0, e * e);
      return;
    }
    if (pose.horizon) {
      // Vista desde órbita: la Tierra es un horizonte curvo abajo de todo
      goal.s = Math.max(vw, vh) * 0.95;
      goal.x = 0;
      goal.y = -vh / 2 - goal.s * 0.8;
      return;
    }
    if (current.pose === "fly") {
      // Proyectos: bajamos hacia Buenos Aires
      const r = current.section.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.25)));
      const e = t * t * (3 - 2 * t);
      goal.x = 0; goal.y = 0;
      goal.s = Math.min(vw, vh) * (0.42 + e * 1.1);
      goal.tz = 0.2 * (1 - e);
      return;
    }
    let r = current.el.getBoundingClientRect();
    if (!r.width) {
      const w = Math.min(innerWidth, innerHeight) * 0.8;
      r = { left: (innerWidth - w) / 2, top: (innerHeight - w) / 2, width: w, height: w };
    }
    goal.x = ((r.left + r.width / 2) / innerWidth - 0.5) * vw;
    goal.y = -((r.top + r.height / 2) / innerHeight - 0.5) * vh;
    goal.s = r.width * 0.5 * pxToWorld * pose.size;
  }

  /* ================= Entrada ================= */
  const mouse = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / innerWidth - 0.5;
    mouse.y = e.clientY / innerHeight - 0.5;
    wake();
  }, { passive: true });

  // Arrastrar la Tierra en el hero: gira con inercia y de a poco vuelve a Buenos Aires
  const drag = { lon: 0, lat: 0, v: 0, on: false, lx: 0, ly: 0, moved: 0 };
  const grab = document.querySelector(".ag-anchor-hero");
  if (grab && !reduced) {
    grab.addEventListener("pointerdown", (e) => {
      drag.on = true; drag.lx = e.clientX; drag.ly = e.clientY; drag.moved = 0;
      try { grab.setPointerCapture(e.pointerId); } catch (_) { /* igual funciona */ }
      root.classList.add("ag-grabbing");
      wake();
    });
    grab.addEventListener("pointermove", (e) => {
      if (!drag.on) return;
      const dx = e.clientX - drag.lx;
      const dy = e.clientY - drag.ly;
      drag.lx = e.clientX; drag.ly = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.lon -= dx * 0.25;
      drag.lat = Math.max(-40, Math.min(40, drag.lat + dy * 0.18));
      drag.v = -dx * 12;
    });
    const release = () => {
      if (!drag.on) return;
      drag.on = false;
      if (drag.moved < 4) drag.v -= 160;
      root.classList.add("ag-dragged");
      root.classList.remove("ag-grabbing");
    };
    grab.addEventListener("pointerup", release);
    grab.addEventListener("pointercancel", release);
  }

  // Leyenda en vivo: ¿es de día o de noche en Buenos Aires ahora?
  const caption = document.querySelector("[data-earth-caption]");
  const baDir = latLon(BA.lat, BA.lon).normalize();
  function updateCaption() {
    if (!caption) return;
    const k = sunNow().dot(baDir);
    const hour = Number(new Intl.DateTimeFormat("es-AR", { hour: "numeric", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).format(new Date()));
    const state = k > 0.1 ? "es de día" : k < -0.1 ? "es de noche" : hour < 12 ? "está amaneciendo" : "está atardeciendo";
    caption.textContent = "La Tierra ahora mismo · en Buenos Aires " + state;
  }
  updateCaption();

  /* ================= Buenos Aires real (se carga cuando hace falta) =================
     Foto satelital Sentinel-2 de EOX (agency-satellite.js): gratis y sin API key. */
  const VER = new URL(import.meta.url).search;
  const creditEl = document.querySelector("[data-city-credit]");
  let city = null;
  let cityLoading = false;
  function ensureCity() {
    if (cityLoading) return;
    cityLoading = true;
    import(new URL("agency-satellite.js" + VER, import.meta.url).href)
      .then((m) => m.createSatellite(THREE, { renderer, lowPower, creditEl }))
      .then((c) => { city = c; root.classList.add("city-satellite"); wake(); })
      .catch((err) => console.warn("[nowmad agency] satélite", err));
  }
  const journeyEl = document.querySelector('[data-pose="journey"]');
  if (journeyEl) {
    new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) ensureCity(); }, { rootMargin: "150% 0px" }).observe(journeyEl);
  }
  // Marco local en Buenos Aires: este, arriba, norte (para pasar el sol real a la ciudad)
  const up = latLon(BA.lat, BA.lon).normalize();
  const east = new THREE.Vector3(0, 1, 0).cross(up).normalize();
  const north = up.clone().cross(east).normalize();
  const sunCity = new THREE.Vector3();
  let mode = "earth";
  let swapping = false;
  let fadeT = 0;
  let cityQ = 0;
  const altEl = document.querySelector("[data-altitude]");
  let altTxt = "";

  /* ================= Bucle ================= */
  const clock = new THREE.Clock();
  let time = 0;
  let running = false;
  let first = true;
  let idleFrames = 0;
  let sunClock = performance.now();
  const intro0 = performance.now();
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  const angDamp = (a, b, k, dt) => a + ((((b - a) % 360) + 540) % 360 - 180) * (1 - Math.exp(-k * dt));
  const flashes = earthMat.uniforms.uFlash.value;
  const flashLife = new Array(MAX_FLASH).fill(0);
  let nextFlash = 1;
  const mv = new THREE.Matrix4();
  const nm = new THREE.Matrix3();
  const tmp = new THREE.Vector3();
  const face = { lat: POSES.hero.lat, lon: POSES.hero.lon + 70 };

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduced) time += dt;
    const intro = reduced ? 1 : Math.min(1, (performance.now() - intro0) / 3200);
    const ie = 1 - Math.pow(1 - intro, 3);

    // El sol se recalcula cada minuto: la línea día/noche avanza en tiempo real
    if (performance.now() - sunClock > 60000) {
      sunClock = performance.now();
      sunObj.copy(sunNow());
      updateCaption();
    }

    if (!reduced) driftLon += dt;
    updateGoal();
    const k = reduced ? 1000 : 2.6;
    rig.position.x = damp(rig.position.x, goal.x, k, dt);
    rig.position.y = damp(rig.position.y, goal.y, k, dt);
    rig.position.z = (1 - ie) * -14; // entrada: la Tierra llega desde el fondo
    rig.scale.setScalar(damp(rig.scale.x, goal.s, k, dt));
    tilt.rotation.x = damp(tilt.rotation.x, goal.tx, k, dt);
    tilt.rotation.z = damp(tilt.rotation.z, goal.tz, k, dt);

    // Inercia del arrastre; sin arrastre vuelve suave a la pose
    if (!drag.on) {
      drag.lon += drag.v * dt * 0.02;
      drag.v *= Math.exp(-1.4 * dt);
      if (Math.abs(drag.v) < 2) { drag.lon = damp(drag.lon, 0, 0.35, dt); drag.lat = damp(drag.lat, 0, 0.6, dt); }
    }
    face.lat = damp(face.lat, goal.lat + drag.lat, k, dt);
    face.lon = angDamp(face.lon, goal.lon + drag.lon, reduced ? 1000 : 1.8, dt);
    const p = latLon(face.lat, face.lon);
    spin.rotation.set(face.lat * D2R, Math.atan2(-p.x, p.z), 0);

    // Sol en vista (reflejo y atmósfera) y en el mundo (el destello)
    rig.updateMatrixWorld(true);
    mv.multiplyMatrices(camera.matrixWorldInverse, earth.matrixWorld);
    nm.getNormalMatrix(mv);
    sunView.copy(sunObj).applyMatrix3(nm).normalize();
    tmp.copy(sunObj).transformDirection(earth.matrixWorld);
    sun.position.copy(rig.position).addScaledVector(tmp, 240);

    earthMat.uniforms.uCloudShift.value = time * 0.0009;
    earthMat.uniforms.uTime.value = time;

    // Onda de Buenos Aires
    // tamaño constante en pantalla, sea cual sea el tamaño de la Tierra
    const mk = Math.min(1, 2.4 / rig.scale.x);
    baDot.scale.setScalar(mk);
    const ph = (time * 0.5) % 1;
    baRing.scale.setScalar((1 + ph * 3.5) * mk);
    baRing.material.opacity = (1 - ph) * 0.9;

    if (!reduced) {
      // Rayos en tormentas del lado de la noche
      nextFlash -= dt;
      if (nextFlash <= 0) {
        nextFlash = 0.25 + Math.random() * 1.6;
        for (let tries = 0; tries < 8; tries++) {
          const lat = (Math.random() * 2 - 1) * 35;
          const lon = Math.random() * 360 - 180;
          if (latLon(lat, lon).dot(sunObj) > -0.15) continue;
          const i = flashLife.indexOf(Math.min(...flashLife));
          flashes[i].set((lon + 180) / 360, (lat + 90) / 180, 0, 0.004 + Math.random() * 0.006);
          flashLife[i] = 0.35;
          break;
        }
      }
      for (let i = 0; i < MAX_FLASH; i++) {
        flashLife[i] = Math.max(0, flashLife[i] - dt);
        const t = flashLife[i] / 0.35;
        flashes[i].z = t > 0 ? (Math.sin(t * 40) > 0 ? 1 : 0.35) * t * 3.5 : 0;
      }

      // Estrella fugaz
      met.next -= dt;
      if (met.next <= 0 && met.life <= 0) {
        met.next = 5 + Math.random() * 8;
        met.life = 0.9;
        met.a.set((Math.random() - 0.5) * 160, 30 + Math.random() * 50, -150);
        met.dir.set(-0.8 - Math.random() * 0.4, -0.45 - Math.random() * 0.3, 0).normalize();
        meteor.visible = true;
      }
      if (met.life > 0) {
        met.life -= dt;
        const head = met.a.clone().addScaledVector(met.dir, (0.9 - met.life) * 140);
        const tail = head.clone().addScaledVector(met.dir, -18);
        meteorGeo.attributes.position.array.set([head.x, head.y, head.z, tail.x, tail.y, tail.z]);
        meteorGeo.attributes.position.needsUpdate = true;
        meteor.material.opacity = Math.min(1, met.life * 3);
        if (met.life <= 0) meteor.visible = false;
      }
    }

    // La cámara respira apenas con el mouse
    camera.position.x = damp(camera.position.x, mouse.x * 0.6, 2, dt);
    camera.position.y = damp(camera.position.y, -mouse.y * 0.4, 2, dt);
    camera.lookAt(0, 0, 0);
    stars.rotation.y = scrollY * 0.00005 + time * 0.001;
    sky.rotation.y = stars.rotation.y;
    stars.material.uniforms.uTime.value = time;
    lens.uniforms.uTime.value = time;

    // ¿Tierra o ciudad? El cambio se hace "atravesando las nubes"
    const inJourney = current && current.pose === "journey";
    const desired = city && inJourney && journeyP > CITY_AT ? "city" : "earth";
    if (desired !== mode) swapping = true;
    if (swapping) {
      fadeT = Math.min(1, fadeT + dt / 0.3);
      if (fadeT >= 1) {
        mode = desired;
        swapping = false;
        if (mode === "earth") { renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.25; }
      }
    } else fadeT = Math.max(0, fadeT - dt / 0.5);
    const haze = inJourney ? Math.exp(-Math.pow((journeyP - CITY_AT) / 0.045, 2)) : 0;
    lens.uniforms.uFade.value = Math.max(fadeT, haze * 0.92);
    sunCity.set(sunObj.dot(east), sunObj.dot(up), -sunObj.dot(north));
    const dayBA = Math.min(1, Math.max(0, (sunCity.y + 0.08) / 0.2));
    lens.uniforms.uFadeCol.value.set(0.03 + 0.8 * dayBA, 0.04 + 0.83 * dayBA, 0.08 + 0.85 * dayBA);

    if (mode === "city" && city) {
      if (inJourney) cityQ = Math.min(1, Math.max(0, (journeyP - CITY_AT) / (0.9 - CITY_AT)));
      city.update({ q: cityQ, time, dt, sun: sunCity, mouse, wide: innerWidth > 900 });
      renderPass.scene = city.scene;
      renderPass.camera = city.camera;
      bloom.strength = 0.12;
    } else {
      renderPass.scene = scene;
      renderPass.camera = camera;
      bloom.strength = 0.45;
    }

    // Altura real de la cámara sobre la superficie
    if (altEl && inJourney) {
      const m = mode === "city" && city ? city.altitude() : ((D - rig.scale.x) / rig.scale.x) * 6371000;
      const txt = m >= 10000 ? Math.round(m / 1000).toLocaleString("es-AR") + " km" : m >= 1000 ? (m / 1000).toFixed(1).replace(".", ",") + " km" : Math.round(m) + " m";
      if (txt !== altTxt) { altEl.textContent = txt; altTxt = txt; }
    }

    if (quality > 0) composer.render();
    else renderer.render(renderPass.scene, renderPass.camera);
    adapt(dt);

    if (first) { first = false; root.classList.add("has-3d"); }
    const busy = intro < 1 || drag.on || Math.abs(drag.v) > 2 || swapping || fadeT > 0;
    if ((reduced || quality < 0) && !busy && ++idleFrames > 30) { running = false; return; }
    requestAnimationFrame(frame);
  }

  // Calidad adaptativa: 1 completo · 0 sin post-proceso y 1x · -1 sin animación continua
  let quality = 1;
  let sT = 0;
  let sF = 0;
  function adapt(dt) {
    if (reduced || quality < 0) return;
    sT += dt; sF++;
    if (sT < 2.5) return;
    const fps = sF / sT;
    sT = 0; sF = 0;
    if (fps >= 30) return;
    if (quality === 1) {
      quality = 0;
      DPR = 1;
      renderer.setPixelRatio(1);
      renderer.setSize(innerWidth, innerHeight, false);
    } else if (fps < 20) quality = -1;
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
    if (city) city.resize();
    wake();
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(); });

  updateGoal();
  rig.position.set(goal.x, goal.y, -14);
  rig.scale.setScalar(goal.s);
  tilt.rotation.set(goal.tx, 0, goal.tz);
  wake();
}
