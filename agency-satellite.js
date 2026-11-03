/* nowmad agency — tramo final del viaje: bajada sobre Buenos Aires hasta el Obelisco.
   Solo imagen real: Sentinel-2 cloudless 2016 de EOX (CC BY 4.0, datos Copernicus modificados)
   sobre Buenos Aires. La cámara baja hasta donde la foto se sigue viendo nítida y no más. */

export async function createSatellite(THREE, { renderer, lowPower, creditEl }) {
  const { Sky } = await import("three/addons/objects/Sky.js");
  // 2048 px también en celular: se baja recién al llegar al viaje y con 1024 la ciudad se ve lavada
  const texUrl = "assets/ba/ba-sentinel-2048.jpg";
  const [meta, sat] = await Promise.all([
    fetch("assets/ba/ba-sentinel.json").then((r) => r.json()),
    new Promise((res, rej) => new THREE.TextureLoader().load(texUrl, res, undefined, rej)),
  ]);
  sat.colorSpace = THREE.SRGBColorSpace;
  sat.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 10, 200000);
  scene.fog = new THREE.FogExp2(0xc4d2e2, 0.00004);
  const sky = new Sky();
  sky.scale.setScalar(150000);
  const su = sky.material.uniforms;
  su.turbidity.value = 4; su.rayleigh.value = 1.2; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.8;
  scene.add(sky);

  // x este, z sur, en metros alrededor del Obelisco
  const s = meta.sentinel;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(s.x1 - s.x0, s.z1 - s.z0),
    new THREE.MeshBasicMaterial({ map: sat, color: new THREE.Color(1, 1, 1) })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((s.x0 + s.x1) / 2, 0, (s.z0 + s.z1) / 2);
  // Leve enfoque (máscara de desenfoque) para que la trama de manzanas se lea a 10 m por píxel
  ground.material.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <map_fragment>",
      `vec4 sampledDiffuseColor = texture2D( map, vMapUv );
      vec2 ts = 1.0 / vec2( textureSize( map, 0 ) );
      vec3 blur = ( texture2D( map, vMapUv + vec2( ts.x, 0.0 ) ).rgb + texture2D( map, vMapUv - vec2( ts.x, 0.0 ) ).rgb
                  + texture2D( map, vMapUv + vec2( 0.0, ts.y ) ).rgb + texture2D( map, vMapUv - vec2( 0.0, ts.y ) ).rgb ) * 0.25;
      sampledDiffuseColor.rgb = clamp( sampledDiffuseColor.rgb + ( sampledDiffuseColor.rgb - blur ) * 0.7, 0.0, 1.0 );
      diffuseColor *= sampledDiffuseColor;`
    );
  };
  scene.add(ground);

  // El Obelisco: cruce de la 9 de Julio con la Diagonal Norte, medido sobre la misma foto
  const OBELISCO = new THREE.Vector3(45, 2, 20);
  const pinMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, depthTest: false, fog: false, toneMapped: false });
  const pin = new THREE.Group();
  pin.position.copy(OBELISCO);
  pin.renderOrder = 10;
  const pinDot = new THREE.Mesh(new THREE.CircleGeometry(1, 32), pinMat(new THREE.Color(1, 0.92, 0.78)));
  const pinHalo = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 48), pinMat(new THREE.Color(1, 0.92, 0.78)));
  const pinWave = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.25, 64), pinMat(new THREE.Color(1, 0.85, 0.6)));
  for (const m of [pinDot, pinHalo, pinWave]) { m.rotation.x = -Math.PI / 2; m.renderOrder = 10; pin.add(m); }
  scene.add(pin);

  if (creditEl) creditEl.textContent = "Imagen satelital: Sentinel-2 cloudless 2016 de EOX (datos Copernicus modificados)";

  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * x * (x * (x * 6 - 15) + 10); };
  const target = new THREE.Vector3();

  let offsetW = -1;
  function update({ q, time = 0, sun, mouse, wide }) {
    // El título ocupa la izquierda (ancho) o el medio (angosto): el Obelisco se corre a un lado libre
    const ox = wide ? Math.round(innerWidth * 0.16) : 0;
    const oy = wide ? 0 : Math.round(innerHeight * 0.2);
    if (ox * 10000 + oy !== offsetW) {
      offsetW = ox * 10000 + oy;
      camera.setViewOffset(innerWidth, innerHeight, -ox, -oy, innerWidth, innerHeight);
    }
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    su.sunPosition.value.copy(sun).multiplyScalar(1000);
    // Mientras sea de noche en Buenos Aires la foto se oscurece, como se vería desde arriba
    const night = 1 - smooth(-0.1, 0.06, sun.y);
    ground.material.color.setScalar(1 - night * 0.82);
    const e = smooth(0, 1, q);
    const dist = Math.exp(lerp(Math.log(9500), Math.log(5200), e));
    const pitch = lerp(88, 64, e) * (Math.PI / 180);
    const az = lerp(-0.3, 0.6, e) + mouse.x * 0.08;
    target.set(0, 0, 0);
    camera.position.set(dist * Math.cos(pitch) * Math.sin(az), dist * Math.sin(pitch), dist * Math.cos(pitch) * Math.cos(az));
    camera.lookAt(target);
    camera.updateMatrixWorld();

    // Marcador de tamaño constante en pantalla; aparece cuando el texto nombra al Obelisco
    const px = camera.position.distanceTo(OBELISCO) * 0.0011;
    pin.scale.setScalar(px * 4.5);
    const show = smooth(0.48, 0.6, q);
    const ph = (time * 0.45) % 1;
    pinDot.material.opacity = show;
    pinHalo.material.opacity = show * 0.55;
    pinWave.scale.setScalar(1 + ph * 5);
    pinWave.material.opacity = show * (1 - ph) * 0.9;
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    offsetW = -1; // el próximo update recalcula el corrimiento con el tamaño nuevo
    camera.clearViewOffset();
  }

  return { scene, camera, update, resize, altitude: () => camera.position.y };
}
