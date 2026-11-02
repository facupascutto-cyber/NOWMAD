/* nowmad agency — respaldo del viaje cuando no hay Google 3D (sin API key, sin cupo o error).
   Solo imagen real: Sentinel-2 cloudless 2016 de EOX (CC BY 4.0, datos Copernicus modificados)
   sobre Buenos Aires. La cámara baja hasta donde la foto se sigue viendo nítida y no más. */

export async function createSatellite(THREE, { renderer, lowPower, creditEl }) {
  const { Sky } = await import("three/addons/objects/Sky.js");
  const texUrl = lowPower ? "assets/ba/ba-sentinel-1024.jpg" : "assets/ba/ba-sentinel-2048.jpg";
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
  scene.add(ground);

  if (creditEl) creditEl.textContent = "Imagen satelital: Sentinel-2 cloudless 2016 de EOX (datos Copernicus modificados)";

  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * x * (x * (x * 6 - 15) + 10); };
  const target = new THREE.Vector3();

  function update({ q, sun, mouse }) {
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
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }

  return { scene, camera, update, resize, altitude: () => camera.position.y };
}
