/* nowmad agency — Buenos Aires real en 3D: Google Photorealistic 3D Tiles.
   Fotogrametría real (la misma de Google Earth) dibujada con 3DTilesRendererJS (NASA-AMMOS, Apache 2.0).
   Requiere una API key de Google Maps Platform con Map Tiles API habilitada, restringida por dominio.
   Condiciones de Google: mostrar su logo y las atribuciones de datos mientras se ven las teselas. */

const LAT = -34.603722; // Obelisco
const LON = -58.381592;
const OBELISK_H = 67.5;
const GOOGLE_LOGO = "https://maps.gstatic.com/mapfiles/api-3/images/google_white5_hdpi.png";
const DRACO = "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/";

export async function createGoogleCity(THREE, { renderer, lowPower, apiKey, creditEl, onFail }) {
  const [{ TilesRenderer }, plugins, { DRACOLoader }, { Sky }] = await Promise.all([
    import("3d-tiles-renderer"),
    import("3d-tiles-renderer/plugins"),
    import("three/addons/loaders/DRACOLoader.js"),
    import("three/addons/objects/Sky.js"),
  ]);
  const { GoogleCloudAuthPlugin, GLTFExtensionsPlugin, TileCompressionPlugin, TilesFadePlugin, ReorientationPlugin } = plugins;
  const D2R = Math.PI / 180;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 1, 2e6);
  scene.fog = new THREE.FogExp2(0xc4d2e2, 0.00003);

  // Cielo real; la fotogrametría tiene la luz de día con la que se fotografió
  const sky = new Sky();
  sky.scale.setScalar(900000);
  const su = sky.material.uniforms;
  su.turbidity.value = 4; su.rayleigh.value = 1.2; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.8;
  su.sunPosition.value.set(0.35, 0.55, -0.75).normalize().multiplyScalar(1000);
  scene.add(sky);

  const draco = new DRACOLoader().setDecoderPath(DRACO);
  const tiles = new TilesRenderer();
  tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: apiKey, autoRefreshToken: true, logoUrl: GOOGLE_LOGO }));
  tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader: draco }));
  tiles.registerPlugin(new TileCompressionPlugin());
  tiles.registerPlugin(new TilesFadePlugin());
  // El Obelisco queda en el origen, con +Y hacia arriba (X oeste, Z norte)
  tiles.registerPlugin(new ReorientationPlugin({ lat: LAT * D2R, lon: LON * D2R, height: 0, recenter: true }));
  tiles.errorTarget = lowPower ? 14 : 6; // más bajo = más detalle
  tiles.setCamera(camera);
  tiles.setResolutionFromRenderer(camera, renderer);
  scene.add(tiles.group);

  let failed = false;
  tiles.addEventListener("load-error", (e) => {
    // Si falla la raíz (key inválida, sin cupo, dominio no autorizado) se vuelve al respaldo satelital
    const url = String((e && (e.url || (e.tile && e.tile.content && e.tile.content.uri))) || "");
    if (!failed && (url.includes("root.json") || !url)) {
      failed = true;
      console.warn("[nowmad agency] Google 3D Tiles no cargó", e && e.error);
      if (onFail) onFail();
    }
  });

  /* ---------- Altura real del suelo en el Obelisco (se mide con un rayo sobre las teselas) ---------- */
  let groundY = 25;
  let groundFound = false;
  const ray = new THREE.Raycaster();
  ray.firstHitOnly = true;
  let probe = 0;
  function measureGround() {
    if (groundFound || ++probe % 15) return;
    ray.set(new THREE.Vector3(0, 4000, 0), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(tiles.group, true)[0];
    if (hit && camera.position.y - hit.point.y < 3000) { groundY = hit.point.y; groundFound = true; }
  }

  /* ---------- Atribución de Google (logo + datos), obligatoria ---------- */
  let lastCredit = "";
  let creditClock = 0;
  function updateCredit(dt) {
    if (!creditEl || (creditClock += dt) < 1) return;
    creditClock = 0;
    const list = tiles.getAttributions([]);
    const hasLogo = list.some((a) => a.type === "image");
    const text = list.filter((a) => a.type === "string").map((a) => String(a.value)).join(" · ");
    const key = (hasLogo ? "logo|" : "") + text;
    if (key === lastCredit) return;
    lastCredit = key;
    // Nodos del DOM, nunca innerHTML: el texto viene de un servidor externo
    const nodes = [];
    if (hasLogo) {
      const img = document.createElement("img");
      img.className = "ag-google-logo";
      img.src = GOOGLE_LOGO;
      img.alt = "Google";
      img.width = 66;
      img.height = 26;
      nodes.push(img);
    }
    if (text) {
      const span = document.createElement("span");
      span.textContent = text;
      nodes.push(span);
    }
    creditEl.replaceChildren(...nodes);
  }

  /* ---------- Recorrido de cámara: de 9 km de altura a dar la vuelta al Obelisco ---------- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * x * (x * (x * 6 - 15) + 10); };
  const target = new THREE.Vector3();
  const look = new THREE.Vector3();
  const right = new THREE.Vector3();
  let orbit = 0;
  // La 9 de Julio corre más o menos de norte a sur: arrancamos mirándola de frente
  const AZ0 = 200 * D2R;

  function update({ q, dt, mouse, wide }) {
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;

    const e = smooth(0, 1, q);
    const dist = Math.exp(lerp(Math.log(9500), Math.log(lowPower ? 320 : 240), e));
    const pitch = lerp(86, 16, smooth(0.1, 0.95, q)) * D2R;
    orbit += dt * smooth(0.82, 1, q) * 0.06;
    const az = AZ0 + lerp(0, 2.4, smooth(0, 1, q)) + orbit + mouse.x * 0.15 * smooth(0.75, 1, q);
    target.set(0, groundY + lerp(0, OBELISK_H * 0.5, smooth(0.5, 1, q)), 0);
    camera.position.set(
      target.x + dist * Math.cos(pitch) * Math.sin(az),
      target.y + dist * Math.sin(pitch) - mouse.y * 6 * smooth(0.75, 1, q),
      target.z + dist * Math.cos(pitch) * Math.cos(az)
    );
    camera.lookAt(target);
    if (wide) {
      // en pantallas anchas el Obelisco queda a la derecha y el texto a la izquierda
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      look.copy(target).addScaledVector(right, -dist * 0.2 * smooth(0.6, 1, q));
      camera.lookAt(look);
    }
    camera.near = Math.max(0.5, dist * 0.002);
    camera.far = 2e6;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    scene.fog.density = lerp(0.000012, 0.00011, smooth(0.2, 1, q));
    tiles.update();
    measureGround();
    updateCredit(dt);
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    tiles.setResolutionFromRenderer(camera, renderer);
  }

  return {
    scene, camera, update, resize,
    altitude: () => camera.position.y - groundY,
    get failed() { return failed; },
  };
}
