/* nowmad agency: fondo de pantalla en 3D.
   Una brújula de bolsillo de metal (bisel cromado, esfera azul noche con marcas, rosa de los vientos,
   aguja de dos colores y domo de vidrio), iluminada como en un estudio: reflejos de un ambiente,
   contraluces de color, niebla y polvo que flota. La aguja apunta al mouse como si fuera un imán,
   con rebote; la brújula viaja con el scroll y gira apenas hacia el cursor.
   Si no hay WebGL o el visitante pidió menos movimiento, queda quieta o queda el cielo de CSS. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector("[data-wall3d]");
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

function star(points, outer, inner) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer, a = Math.PI / 2 + (i * Math.PI) / points;
    if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}
function tri(ax, ay, bx, by, cx, cy) {
  const s = new THREE.Shape();
  s.moveTo(ax, ay); s.lineTo(bx, by); s.lineTo(cx, cy); s.closePath();
  return s;
}
const bevel = (depth, size) => ({ depth, bevelEnabled: true, bevelThickness: size, bevelSize: size, bevelSegments: 3, curveSegments: 24 });

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
  scene.fog = new THREE.FogExp2(0x05071a, 0.04);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.1;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // Materiales
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xe3e8ff, metalness: 1, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.3, iridescenceIOR: 1.6 });
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xf2b33a, metalness: 1, roughness: 0.2, clearcoat: 0.7 });
  const brushed = new THREE.MeshPhysicalMaterial({ color: 0xaab4f0, metalness: 1, roughness: 0.32 });
  const dial = new THREE.MeshPhysicalMaterial({ color: 0x0b1140, metalness: 0.5, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.15 });
  const north = new THREE.MeshPhysicalMaterial({ color: 0xff9a2e, emissive: 0xff6a1a, emissiveIntensity: 0.55, metalness: 0.6, roughness: 0.25, clearcoat: 1 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.25, ior: 1.5, clearcoat: 1, transparent: true, opacity: 1 });

  // La brújula (de frente mira hacia +z)
  const compass = new THREE.Group();
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.24, 48, 220), chrome);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.055, 24, 200), gold); lip.position.z = 0.1;
  const back = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.32, 160), brushed); back.rotation.x = Math.PI / 2; back.position.z = -0.18;
  const face = new THREE.Mesh(new THREE.CylinderGeometry(1.86, 1.86, 0.1, 160), dial); face.rotation.x = Math.PI / 2; face.position.z = 0.02;
  compass.add(bezel, lip, back, face);
  // Argolla de bolsillo arriba
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.36, 32), chrome); stem.position.y = 2.42;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 32), gold); crown.position.y = 2.66;
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.075, 20, 80), chrome); bow.position.y = 3.15;
  compass.add(stem, crown, bow);
  // Marcas: 72 finas y 4 cardinales doradas
  const tickGeo = new THREE.BoxGeometry(0.028, 0.15, 0.03), bigGeo = new THREE.BoxGeometry(0.06, 0.32, 0.04);
  const ticks = new THREE.InstancedMesh(tickGeo, brushed, 72), bigs = new THREE.InstancedMesh(bigGeo, gold, 8);
  const m = new THREE.Object3D();
  let b = 0;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2, card = i % 9 === 0;
    const r = card ? 1.56 : 1.64;
    m.position.set(Math.sin(a) * r, Math.cos(a) * r, 0.1);
    m.rotation.set(0, 0, -a);
    m.updateMatrix();
    if (card) bigs.setMatrixAt(b++, m.matrix); else ticks.setMatrixAt(i, m.matrix);
  }
  ticks.count = 72; bigs.count = b;
  compass.add(ticks, bigs);
  // Triangulito del norte
  const nMark = new THREE.Mesh(new THREE.ExtrudeGeometry(tri(0, 1.4, 0.12, 1.2, -0.12, 1.2), bevel(0.02, 0.01)), north); nMark.position.z = 0.08;
  compass.add(nMark);
  // Rosa de los vientos: estrella de 4 puntas grande y otra de 4 rotada, más chica
  const rose1 = new THREE.Mesh(new THREE.ExtrudeGeometry(star(4, 1.2, 0.2), bevel(0.03, 0.025)), brushed); rose1.position.z = 0.08;
  const rose2 = new THREE.Mesh(new THREE.ExtrudeGeometry(star(4, 0.78, 0.16), bevel(0.03, 0.02)), chrome); rose2.rotation.z = Math.PI / 4; rose2.position.z = 0.1;
  compass.add(rose1, rose2);
  // Aguja: mitad norte ámbar (brilla) y mitad sur cromada, con tapón dorado
  const needle = new THREE.Group();
  const nHalf = new THREE.Mesh(new THREE.ExtrudeGeometry(tri(0, 1.45, 0.15, 0, -0.15, 0), bevel(0.035, 0.02)), north);
  const sHalf = new THREE.Mesh(new THREE.ExtrudeGeometry(tri(0, -1.3, 0.15, 0, -0.15, 0), bevel(0.035, 0.02)), chrome);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), gold); cap.position.z = 0.07;
  needle.add(nHalf, sHalf, cap);
  needle.position.z = 0.3;
  compass.add(needle);
  // Domo de vidrio
  const R = 4.2, th = Math.asin(1.84 / R);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 24, 0, Math.PI * 2, 0, th), glass);
  dome.rotation.x = Math.PI / 2; dome.position.z = -R * Math.cos(th) + 0.16;
  compass.add(dome);

  const holder = new THREE.Group();
  holder.add(compass);
  scene.add(holder);

  // Luces: una clave cálida, contornos de color y una luz que sigue al mouse
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
  // viaja a la derecha, donde queda para el resto de la página. En el celular va centrada abajo.
  let wide = true, prog = 0;
  function layout() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    wide = w > 900;
    holder.scale.setScalar(wide ? 1.25 : 0.8);
  }
  function place() {
    const k = prog * prog * (3 - 2 * prog);
    if (wide) holder.position.set(-3.1 + 6.1 * k, -3.9 + 3 * k, 0);
    else holder.position.set(0, -3.4 + 1.4 * k, 0);
    holder.rotation.z = (1 - k) * -0.8 - k * 0.15;
    holder.rotation.y = -0.3 + k * 0.55;
  }
  layout();
  addEventListener("resize", layout);

  const ptr = { x: 0, y: 0, seen: false }, cur = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => {
    ptr.x = e.clientX / innerWidth * 2 - 1;
    ptr.y = e.clientY / innerHeight * 2 - 1;
    ptr.seen = true;
  }, { passive: true });

  // La aguja: un resorte que busca al mouse (o al norte, con un vaivén, si no hay mouse)
  let na = 0, nv = 0;
  const center = new THREE.Vector3();
  function wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    cur.x += (ptr.x - cur.x) * 0.05; cur.y += (ptr.y - cur.y) * 0.05;
    prog += (Math.min(1, scrollY / (innerHeight * 0.9)) - prog) * 0.08;
    place();
    compass.rotation.y = Math.sin(t * 0.25) * 0.12 + cur.x * 0.3;
    compass.rotation.x = 0.12 + Math.sin(t * 0.2) * 0.06 + cur.y * 0.22;
    compass.position.y = Math.sin(t * 0.6) * 0.1;

    compass.getWorldPosition(center).project(camera);
    let goal;
    if (ptr.seen) goal = Math.atan2(-ptr.y - center.y, (ptr.x - center.x) * camera.aspect) - Math.PI / 2 - holder.rotation.z;
    else goal = Math.sin(t * 0.7) * 0.5 + Math.sin(t * 1.9) * 0.12;
    nv += wrap(goal - na) * 0.012;
    nv *= 0.93;
    na += nv;
    needle.rotation.z = na;

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
