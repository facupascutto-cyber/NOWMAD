/* nowmad agency: fondo de pantalla en 3D.
   El logo de nowmad como escultura de metal pulido (anillo cromado, centro dorado y la aguja),
   iluminado como en un estudio: reflejos de un ambiente, luces de color por detrás, niebla y polvo
   que flota. La escultura mira suave hacia el mouse y las luces lo siguen.
   Si no hay WebGL o el visitante pidió menos movimiento, queda quieta o queda el cielo de CSS. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector("[data-wall3d]");
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05071a, 0.045);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.1;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // La escultura: el logo de nowmad
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xdfe4ff, metalness: 1, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06, iridescence: 0.35, iridescenceIOR: 1.6 });
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xf2b33a, metalness: 1, roughness: 0.22, clearcoat: 0.6 });
  const logo = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.46, 64, 220), chrome);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 64), gold);
  const needle = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 3.9, 12, 32), chrome);
  needle.rotation.z = -Math.PI / 4;
  needle.position.set(1.38, 1.38, 0);
  logo.add(ring, dot, needle);
  const holder = new THREE.Group();
  holder.add(logo);
  scene.add(holder);

  // Luces: una clave cálida, contornos de color y un relleno muy bajo
  scene.add(new THREE.AmbientLight(0x1b2690, 0.35));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.6); key.position.set(-3, 4, 6); scene.add(key);
  const rimBlue = new THREE.PointLight(0x4d5ff0, 260, 40, 1.5); rimBlue.position.set(-4, -2, 2); scene.add(rimBlue);
  const rimPink = new THREE.PointLight(0xff4fa3, 180, 40, 1.5); rimPink.position.set(6, 4, 1); scene.add(rimPink);
  const follow = new THREE.PointLight(0xffffff, 120, 22, 1.6); follow.position.set(0, 0, 5); scene.add(follow);

  // Polvo que flota, con un poco de brillo
  const N = 700, pos = new Float32Array(N * 3), speed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    speed[i] = 0.08 + Math.random() * 0.25;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xbfc8ff, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // Ubicación según el scroll: en la portada asoma abajo a la izquierda (debajo del texto) y al bajar
  // viaja a la derecha girando, donde queda para el resto de la página. En el celular va centrada abajo.
  let wide = true, prog = 0;
  function layout() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    wide = w > 900;
    holder.scale.setScalar(wide ? 1.4 : 0.85);
  }
  function place() {
    const k = prog * prog * (3 - 2 * prog);
    if (wide) holder.position.set(-3.1 + 6 * k, -3.7 + 2.6 * k, 0);
    else holder.position.set(0, -3.6 + 1.6 * k, 0);
    holder.rotation.z = (1 - k) * -0.95;
    holder.rotation.y = k * Math.PI * 0.6;
  }
  layout();
  addEventListener("resize", layout);

  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => {
    target.x = e.clientX / innerWidth * 2 - 1;
    target.y = e.clientY / innerHeight * 2 - 1;
  }, { passive: true });

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    logo.rotation.y = -0.55 + Math.sin(t * 0.25) * 0.25 + cur.x * 0.35;
    logo.rotation.x = 0.18 + Math.sin(t * 0.2) * 0.08 + cur.y * 0.25;
    logo.position.y = Math.sin(t * 0.6) * 0.12;
    prog += (Math.min(1, scrollY / (innerHeight * 0.9)) - prog) * 0.08;
    place();
    follow.position.set(cur.x * 6, -cur.y * 4, 5);
    rimPink.position.x = 5 + Math.sin(t * 0.3) * 1.5;
    for (let i = 0; i < N; i++) {
      let y = pos[i * 3 + 1] + speed[i] * 0.016;
      if (y > 7) y = -7;
      pos[i * 3 + 1] = y;
    }
    dustGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }
  canvas.classList.add("is-on");
  if (REDUCED) { frame(); return; }
  renderer.setAnimationLoop(() => { if (!document.hidden) frame(); });
}

if (canvas) start();
