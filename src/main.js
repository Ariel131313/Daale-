import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import lunaModelo from "./luna.glb?inline";
import lunaBase from "./luna-base.webp?inline";
import lunaNormal from "./luna-normal.webp?inline";
import lunaMR from "./luna-mr.webp?inline";
import daaleModelo from "./daale.glb?inline";

const COLORS = {
  confetti: [0xc62828, 0x6a2c91, 0x1e7fc2, 0xe8b93b, 0x2fb55e, 0xef6ea8],
  firework: [0xf5c25b, 0x9b9be0, 0x6fa8d6, 0xffffff, 0xff8fc4],
  gold: 0xe8b93b,
};

/* Los numeros van en formato internacional para wa.me: 54 + 9 (movil) + numero. */
export const CONTACTO = {
  daale: { tel: "2644398407", wa: "5492644398407", instagram: "daaleanimacion.deco" },
  noche: { tel: "2646269681", wa: "5492646269681", instagram: "noche_magik" },
};

/* Precios para particulares. `null` se muestra como "a confirmar".
   Los nombres salen de los audios; el contenido y los precios, de
   "Precios/precios promos.txt", porque el texto escrito le gana al audio. */
export const PRECIOS = {
  basico: 65000,
  estandar: 110000,
  vip: 190000,
  globoflexia: 250, // por globo
};

/* Precios que todavía no confirmó el cliente: se muestran con la marca "estimado"
   para que nadie los tome como definitivos. Sacar el id de acá al confirmarlo. */
export const PRECIOS_ESTIMADOS = new Set(["vip"]);

const formatoPeso = new Intl.NumberFormat("es-AR");

function pintarPrecios() {
  document.querySelectorAll("[data-precio]").forEach((el) => {
    const id = el.dataset.precio;
    const valor = PRECIOS[id];
    const contenedor = el.closest(".crew-price");

    if (valor == null) {
      contenedor.textContent = "a confirmar";
      return;
    }

    el.textContent = formatoPeso.format(valor);
    if (PRECIOS_ESTIMADOS.has(id) && !contenedor.querySelector(".estimado")) {
      const marca = document.createElement("span");
      marca.className = "estimado";
      marca.textContent = "estimado";
      contenedor.append(marca);
    }
  });
}

function whatsappURL(lado, mensaje) {
  const { wa } = CONTACTO[lado];
  return `https://wa.me/${wa}?text=${encodeURIComponent(mensaje)}`;
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.querySelector("#stage");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 120);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

/* Con mapa de entorno alcanza con luces suaves: de lo contrario los colores
   planos de las letras se queman y el logo pierde saturación. */
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(-3, 5, 6);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffe6a8, 0.5);
rim.position.set(4, 2, 3);
scene.add(rim);

/* Altura visible del mundo en el plano z=0. Todo el mapeo pantalla→mundo sale de acá. */
const worldHeight = () => 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
let unitsPerPx = worldHeight() / innerHeight;

function screenToWorld(px, py) {
  return {
    x: (px - innerWidth / 2) * unitsPerPx,
    y: (innerHeight / 2 - py) * unitsPerPx,
  };
}

const bounds = () => ({
  x: (innerWidth / 2) * unitsPerPx,
  y: (innerHeight / 2) * unitsPerPx,
});

const isNarrow = () => innerWidth <= 860;

/* ---------- Logos ---------- */

const logos = { daale: null, noche: null };

/* Los dos logos son modelos 3D. Se envuelven en un grupo propio y se centran
   sobre su bounding box, para que layoutLogos pueda escalarlos por igual. */
/* El modelo viaja incrustado como data URL. Se decodifica a mano y se parsea
   directo, sin fetch ni WebAssembly: así carga también en entornos con CSP
   estricta, como el visor de previews. */
function bufferDesdeDataURL(dataURL) {
  const base64 = dataURL.slice(dataURL.indexOf(",") + 1);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function cargarLogo3D(dataURL, clave, ajustar) {
  const onError = (err) => console.error(`No se pudo cargar el logo ${clave}`, err);
  gltfLoader.parse(bufferDesdeDataURL(dataURL), "", (gltf) => {
    const grupo = new THREE.Group();
    grupo.add(gltf.scene);
    ajustar?.(gltf.scene);

    const caja = new THREE.Box3().setFromObject(gltf.scene);
    const centro = caja.getCenter(new THREE.Vector3());
    const tamano = caja.getSize(new THREE.Vector3());
    gltf.scene.position.sub(centro);

    grupo.userData.aspect = tamano.x / tamano.y;
    grupo.userData.altura3d = tamano.y;
    grupo.userData.es3d = true;

    scene.add(grupo);
    logos[clave] = grupo;
    layoutLogos();
  }, onError);
}

/* ---------- Logo 3D de Noche Magik ---------- */

/* Reflejos de estudio: sin esto el material plástico se ve plano y pierde
   el brillo inflado que tiene el logo de DAALE. */
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* El GLB trae el lockup entero de Noche Magik modelado: luna, chispas y texto.
   Se carga tal cual y se centra para que layoutLogos lo trate igual que a un
   plano con textura. */
const gltfLoader = new GLTFLoader();

/* Las texturas de la luna van fuera del GLB y entran por <img> con data URL.
   GLTFLoader las cargaría por blob: con fetch o createImageBitmap, y el visor
   de previews bloquea ese camino; el DAALE no lo sufre porque no tiene texturas. */
const texturaLoader = new THREE.TextureLoader();

function texturaGLTF(dataURL, { srgb = false } = {}) {
  const t = texturaLoader.load(dataURL);
  t.flipY = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

cargarLogo3D(lunaModelo, "noche", (raiz) => {
  const mapa = texturaGLTF(lunaBase, { srgb: true });
  const normal = texturaGLTF(lunaNormal);
  const metalRugosidad = texturaGLTF(lunaMR);
  raiz.traverse((o) => {
    if (!o.isMesh) return;
    const materiales = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of materiales) {
      m.map = mapa;
      m.normalMap = normal;
      m.metalnessMap = metalRugosidad;
      m.roughnessMap = metalRugosidad;
      m.needsUpdate = true;
    }
  });
});

/* Las letras vienen del FBX de realidad aumentada con materiales pensados para
   otra iluminación: se les baja el reflejo y se les sube el brillo para que
   recuperen el plástico inflado del logo impreso. */
cargarLogo3D(daaleModelo, "daale", (raiz) => {
  raiz.traverse((o) => {
    if (!o.isMesh) return;
    const materiales = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of materiales) {
      m.envMapIntensity = 0.3;
      m.roughness = 0.42;
      m.metalness = 0;
    }
  });
});

function layoutLogos() {
  const b = bounds();
  const narrow = isNarrow();

  // Cada logo se ajusta al ancho de su mitad y recién después al alto, si no
  // el lockup apaisado de DAALE se desborda hacia el centro.
  const fit = (logo, maxW, maxH) => {
    const h = Math.min(maxH, maxW / logo.userData.aspect);
    if (logo.userData.es3d) {
      logo.scale.setScalar(h / logo.userData.altura3d);
      return;
    }
    logo.geometry.dispose();
    logo.geometry = new THREE.PlaneGeometry(h * logo.userData.aspect, h);
  };

  // Cada logo va al centro exacto de su mitad y ambos a la misma altura, para
  // que el eje del hero quede simétrico respecto de la costura.
  const centroX = b.x * 0.5;
  const alturaLogo = b.y * 0.3;

  // En celular las dos mitades se apilan, así que los logos se van contra los
  // bordes de arriba y de abajo para no pisar el texto que va en el medio.
  if (logos.daale) {
    fit(logos.daale, narrow ? b.x * 1.05 : b.x * 0.82, narrow ? b.y * 0.16 : b.y * 0.34);
    logos.daale.userData.home = narrow
      ? new THREE.Vector3(0, b.y * 0.82, 0)
      : new THREE.Vector3(-centroX, alturaLogo, 0);
  }

  if (logos.noche) {
    fit(logos.noche, b.x * 0.62, narrow ? b.y * 0.24 : b.y * 0.62);
    logos.noche.userData.home = narrow
      ? new THREE.Vector3(0, -b.y * 0.77, 0)
      : new THREE.Vector3(centroX, alturaLogo, 0);
  }
}


/* ---------- Confeti (lado DAALE) ---------- */

const GRAVITY = -16;

const CONFETTI_MAX = 520;
const confetti = {
  mesh: null,
  pos: new Float32Array(CONFETTI_MAX * 3),
  vel: new Float32Array(CONFETTI_MAX * 3),
  rot: new Float32Array(CONFETTI_MAX * 3),
  spin: new Float32Array(CONFETTI_MAX * 3),
  life: new Float32Array(CONFETTI_MAX),
  cursor: 0,
};

{
  const geo = new THREE.PlaneGeometry(0.13, 0.2);
  const mat = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    roughness: 0.45,
    metalness: 0.1,
    transparent: true,
  });
  confetti.mesh = new THREE.InstancedMesh(geo, mat, CONFETTI_MAX);
  confetti.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  confetti.mesh.frustumCulled = false;

  const color = new THREE.Color();
  for (let i = 0; i < CONFETTI_MAX; i++) {
    color.setHex(COLORS.confetti[i % COLORS.confetti.length]);
    confetti.mesh.setColorAt(i, color);
  }
  scene.add(confetti.mesh);
}

function burstConfetti(x, y, amount = 70, power = 1) {
  for (let i = 0; i < amount; i++) {
    const idx = confetti.cursor;
    confetti.cursor = (confetti.cursor + 1) % CONFETTI_MAX;
    const a = Math.random() * Math.PI * 2;
    const speed = (2.5 + Math.random() * 5.5) * power;
    confetti.pos.set([x, y, (Math.random() - 0.5) * 0.8], idx * 3);
    confetti.vel.set(
      [Math.cos(a) * speed, Math.sin(a) * speed + 2.5, (Math.random() - 0.5) * 2],
      idx * 3
    );
    confetti.rot.set(
      [Math.random() * 6, Math.random() * 6, Math.random() * 6],
      idx * 3
    );
    confetti.spin.set(
      [(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9],
      idx * 3
    );
    confetti.life[idx] = 2.6 + Math.random() * 1.8;
  }
}

const dummy = new THREE.Object3D();

function stepConfetti(dt) {
  const b = bounds();
  let alive = false;

  for (let i = 0; i < CONFETTI_MAX; i++) {
    if (confetti.life[i] <= 0) {
      dummy.position.set(0, 9999, 0);
      dummy.scale.setScalar(0.0001);
      dummy.updateMatrix();
      confetti.mesh.setMatrixAt(i, dummy.matrix);
      continue;
    }
    alive = true;
    const o = i * 3;

    confetti.vel[o + 1] += GRAVITY * 0.42 * dt;
    // El papel flota: mucho arrastre y un bamboleo lateral.
    confetti.vel[o] *= 1 - 1.6 * dt;
    confetti.vel[o + 1] *= 1 - 0.9 * dt;
    confetti.vel[o + 2] *= 1 - 1.6 * dt;
    confetti.vel[o] += Math.sin(performance.now() * 0.001 + i) * 1.2 * dt;

    if (pointer.active) {
      const dx = confetti.pos[o] - pointer.world.x;
      const dy = confetti.pos[o + 1] - pointer.world.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 1.6 && d2 > 0.0001) {
        const f = (1.6 - d2) * 6;
        const d = Math.sqrt(d2);
        confetti.vel[o] += (dx / d) * f * dt;
        confetti.vel[o + 1] += (dy / d) * f * dt;
      }
    }

    confetti.pos[o] += confetti.vel[o] * dt;
    confetti.pos[o + 1] += confetti.vel[o + 1] * dt;
    confetti.pos[o + 2] += confetti.vel[o + 2] * dt;

    confetti.rot[o] += confetti.spin[o] * dt;
    confetti.rot[o + 1] += confetti.spin[o + 1] * dt;
    confetti.rot[o + 2] += confetti.spin[o + 2] * dt;

    confetti.life[i] -= dt;
    if (confetti.pos[o + 1] < -b.y - 1) confetti.life[i] = 0;

    const fade = Math.min(1, confetti.life[i]);
    dummy.position.set(confetti.pos[o], confetti.pos[o + 1], confetti.pos[o + 2]);
    dummy.rotation.set(confetti.rot[o], confetti.rot[o + 1], confetti.rot[o + 2]);
    dummy.scale.setScalar(fade);
    dummy.updateMatrix();
    confetti.mesh.setMatrixAt(i, dummy.matrix);
  }

  confetti.mesh.instanceMatrix.needsUpdate = true;
  confetti.mesh.visible = alive;
}

/* ---------- Fuegos artificiales (lado Noche Magik) ---------- */

const SPARK_MAX = 1400;
const fw = {
  points: null,
  pos: new Float32Array(SPARK_MAX * 3),
  vel: new Float32Array(SPARK_MAX * 3),
  base: new Float32Array(SPARK_MAX * 3),
  life: new Float32Array(SPARK_MAX),
  maxLife: new Float32Array(SPARK_MAX),
  cursor: 0,
};

function sparkTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.75)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

{
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(fw.pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(SPARK_MAX * 3), 3));
  geo.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(SPARK_MAX), 1));

  const mat = new THREE.PointsMaterial({
    size: 0.16,
    map: sparkTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    // Aditivo solo en color: el alfa del canvas no se acumula. Si se acumulara,
    // las chispas ya apagadas quedarían como puntos oscuros sobre el cielo al
    // componerse el canvas transparente encima de la página.
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
  });
  fw.points = new THREE.Points(geo, mat);
  fw.points.frustumCulled = false;
  scene.add(fw.points);
}

const fwColors = () => fw.points.geometry.getAttribute("color");
const fwPositions = () => fw.points.geometry.getAttribute("position");

function burstFirework(x, y, amount = 150) {
  const base = new THREE.Color(
    COLORS.firework[Math.floor(Math.random() * COLORS.firework.length)]
  );
  const ring = 3 + Math.random() * 3;

  for (let i = 0; i < amount; i++) {
    const idx = fw.cursor;
    fw.cursor = (fw.cursor + 1) % SPARK_MAX;
    const o = idx * 3;

    // Distribución esférica para que el estallido se vea redondo, no plano.
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = ring * (0.55 + Math.random() * 0.65);

    fw.pos[o] = x;
    fw.pos[o + 1] = y;
    fw.pos[o + 2] = (Math.random() - 0.5) * 0.5;

    fw.vel[o] = Math.sin(phi) * Math.cos(theta) * speed;
    fw.vel[o + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    fw.vel[o + 2] = Math.cos(phi) * speed * 0.4;

    fw.base[o] = base.r;
    fw.base[o + 1] = base.g;
    fw.base[o + 2] = base.b;

    fw.maxLife[idx] = 1.1 + Math.random() * 1.1;
    fw.life[idx] = fw.maxLife[idx];
  }
}

function stepFireworks(dt) {
  const colors = fwColors();

  for (let i = 0; i < SPARK_MAX; i++) {
    const o = i * 3;

    if (fw.life[i] <= 0) {
      colors.array[o] = 0;
      colors.array[o + 1] = 0;
      colors.array[o + 2] = 0;
      continue;
    }

    fw.vel[o + 1] += GRAVITY * 0.2 * dt;
    const drag = 1 - 1.15 * dt;
    fw.vel[o] *= drag;
    fw.vel[o + 1] *= drag;
    fw.vel[o + 2] *= drag;

    fw.pos[o] += fw.vel[o] * dt;
    fw.pos[o + 1] += fw.vel[o + 1] * dt;
    fw.pos[o + 2] += fw.vel[o + 2] * dt;

    fw.life[i] -= dt;

    // En aditivo, bajar el color hasta negro ES el fundido de la chispa.
    const t = Math.max(0, fw.life[i] / fw.maxLife[i]);
    const f = t * t;
    colors.array[o] = fw.base[o] * f;
    colors.array[o + 1] = fw.base[o + 1] * f;
    colors.array[o + 2] = fw.base[o + 2] * f;
  }

  fwPositions().needsUpdate = true;
  colors.needsUpdate = true;
}

/* ---------- Giro al tocar los logos ---------- */

/* Al pasar el puntero, el logo arranca una vuelta entera sobre su eje vertical
   y tarda 6 segundos en volver al punto de partida. La curva es exponencial:
   sale rápido y se va frenando, que es de donde viene la sensación de inercia. */
const GIRO_DURACION = 6000;
const raycaster = new THREE.Raycaster();
const giros = new Map();

function empezarGiro(logo) {
  const actual = giros.get(logo);
  if (actual && performance.now() - actual.desde < GIRO_DURACION * 0.92) return;
  giros.set(logo, { desde: performance.now() });
}

function pasoGiros(ahora) {
  for (const [logo, giro] of giros) {
    const t = (ahora - giro.desde) / GIRO_DURACION;
    if (t >= 1) {
      logo.rotation.y = 0;
      giros.delete(logo);
      continue;
    }
    // easeOutExpo sobre una vuelta completa: termina donde empezó.
    const suave = t === 1 ? 1 : 1 - Math.pow(2, -9 * t);
    logo.rotation.y = suave * Math.PI * 2;
  }
}

const ndcPuntero = new THREE.Vector2();
const cajaLogo = new THREE.Box3();

/* Se prueba contra la caja del logo y no contra su geometría: un logo tiene
   huecos entre la luna y las letras, y pedirle puntería fina a alguien que
   navega desde el celular es perder la interacción. */
function revisarHover() {
  if (!pointer.active) return;
  ndcPuntero.set(
    (pointer.screen.x / innerWidth) * 2 - 1,
    -(pointer.screen.y / innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(ndcPuntero, camera);

  for (const logo of [logos.daale, logos.noche]) {
    if (!logo) continue;
    cajaLogo.setFromObject(logo);
    if (raycaster.ray.intersectsBox(cajaLogo)) empezarGiro(logo);
  }
}

/* ---------- Puntero ---------- */

const pointer = {
  active: false,
  world: new THREE.Vector2(),
  screen: new THREE.Vector2(),
};

addEventListener(
  "pointermove",
  (e) => {
    pointer.active = true;
    pointer.screen.set(e.clientX, e.clientY);
    const w = screenToWorld(e.clientX, e.clientY);
    pointer.world.set(w.x, w.y);
  },
  { passive: true }
);

addEventListener("pointerleave", () => {
  pointer.active = false;
});

function sideAt(clientX, clientY) {
  if (isNarrow()) return clientY < innerHeight * 0.5 ? "daale" : "noche";
  return clientX < innerWidth * 0.5 ? "daale" : "noche";
}

addEventListener("pointerdown", (e) => {
  if (e.target.closest("button, a")) return;
  const w = screenToWorld(e.clientX, e.clientY);
  if (sideAt(e.clientX, e.clientY) === "daale") {
    burstConfetti(w.x, w.y, 90, 1.15);
  } else {
    burstFirework(w.x, w.y, 170);
  }
});

/* ---------- Ficha de contratación ---------- */

const PLANES = {
  basico: { nombre: "Básico", detalle: "1 hora, presencia en fotos, velitas y piñata" },
  estandar: { nombre: "Estándar", detalle: "1 hora con juegos, tatuajes, pelos locos y brillos" },
  vip: { nombre: "VIP", detalle: "2 horas, 2 personajes, títeres y globoflexia" },
};

const PERSONAJES = [
  {
    id: "hombre-arana",
    nombre: "Hombre Araña",
    foto: "personajes/hombre-arana.jpg",
    donde: "El más pedido en cumpleaños de 3 a 8.",
    franjas: ["mañana", "tarde"],
  },
  {
    id: "stitch",
    nombre: "Stitch",
    foto: "personajes/stitch.jpg",
    donde: "Ideal en jardines y escuelas: los chicos lo abrazan.",
    franjas: ["mañana", "tarde"],
  },
  {
    id: "toy-story",
    nombre: "Toy Story",
    foto: "personajes/toy-story.jpg",
    donde: "Jessie y el alien inflable, perfectos para las fotos.",
    franjas: ["mañana", "tarde"],
  },
  {
    id: "munecos",
    nombre: "Muñecos y payasos",
    foto: "personajes/munecos.jpg",
    donde: "Para animar toda la fiesta, no solo un momento.",
    franjas: ["mañana", "tarde"],
  },
  {
    id: "deadpool",
    nombre: "Deadpool",
    foto: "personajes/deadpool.jpg",
    donde: "Loco y versátil, va bien de tarde y de noche.",
    franjas: ["tarde", "noche"],
  },
  {
    id: "willy-wonka",
    nombre: "Willy Wonka",
    foto: "personajes/willy-wonka.jpg",
    donde: "Espectacular en la mesa dulce de 15 y 18.",
    franjas: ["tarde", "noche"],
  },
  {
    id: "hombre-espejo",
    nombre: "Hombre Espejo",
    foto: "personajes/hombre-espejo.jpg",
    donde: "Recepción de bodas y boliches: no pasa desapercibido.",
    franjas: ["noche"],
  },
  {
    id: "terror",
    nombre: "Noche de terror",
    foto: "personajes/terror.jpg",
    donde: "Halloween completo, con ambientación y personajes.",
    franjas: ["noche"],
  },
  {
    id: "boliche",
    nombre: "Performers de boliche",
    foto: "personajes/boliche.jpg",
    donde: "Para arriba del escenario, con humo y luces.",
    franjas: ["noche"],
  },
];

const ficha = document.querySelector("#ficha-form");

if (ficha) {
  const lista = document.querySelector("#personajes");
  const elegidos = new Set();

  const horarioActual = () => ficha.querySelector('input[name="horario"]:checked').value;
  const planActual = () => ficha.querySelector('input[name="plan"]:checked').value;
  const marcaActual = () => (horarioActual() === "noche" ? "noche" : "daale");

  function pintarPersonajes() {
    const franja = horarioActual();
    lista.innerHTML = "";
    for (const p of PERSONAJES) {
      const recomendado = p.franjas.includes(franja);
      const li = document.createElement("li");
      li.className = "personaje" + (recomendado ? "" : " personaje--otro");

      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = p.id;
      input.checked = elegidos.has(p.id);
      input.addEventListener("change", () => {
        if (input.checked) elegidos.add(p.id);
        else elegidos.delete(p.id);
        li.classList.toggle("personaje--elegido", input.checked);
        pintarEquipo();
      });

      const img = document.createElement("img");
      img.src = p.foto;
      img.alt = p.nombre;
      img.loading = "lazy";

      const cuerpo = document.createElement("div");
      cuerpo.className = "personaje-cuerpo";
      const h = document.createElement("span");
      h.className = "personaje-nombre";
      h.textContent = p.nombre;
      const d = document.createElement("span");
      d.className = "personaje-donde";
      d.textContent = p.donde;
      cuerpo.append(h, d);

      label.append(input, img, cuerpo);
      li.append(label);
      li.classList.toggle("personaje--elegido", input.checked);
      lista.append(li);
    }
  }

  /* La regla del negocio: 1 coordinador cada 2 personajes, redondeando para arriba. */
  const coordinadoresPara = (personajes) => Math.max(1, Math.ceil(personajes / 2));

  function pintarEquipo() {
    const n = elegidos.size;
    const nota = document.querySelector("#nota-equipo");
    if (n === 0) {
      nota.textContent = "Elegí al menos uno. Si no sabés cuál, te recomendamos por WhatsApp.";
      return;
    }
    const co = coordinadoresPara(n);
    nota.textContent = `${n} ${n === 1 ? "personaje" : "personajes"} y ${co} ${
      co === 1 ? "coordinador" : "coordinadores"
    }, porque cada coordinador se hace cargo de hasta dos personajes.`;
  }

  function pintarNotas() {
    const marca = marcaActual();
    document.querySelector("#nota-horario").textContent =
      marca === "noche"
        ? "De noche la fiesta la toma Noche Magik, nuestra marca para eventos adultos."
        : "";

    const id = planActual();
    const plan = PLANES[id];
    const precio = PRECIOS[id];
    const estimado = PRECIOS_ESTIMADOS.has(id) ? " (estimado)" : "";
    document.querySelector("#nota-plan").textContent =
      plan.detalle +
      (precio ? `. $${formatoPeso.format(precio)}${estimado}` : ". Precio a confirmar");

    document.querySelector("#nota-envio").textContent =
      marca === "noche"
        ? "Se envía al WhatsApp de Noche Magik."
        : "Se envía al WhatsApp de DAALE!! Animaciones.";
  }

  ficha.addEventListener("change", (e) => {
    if (e.target.name === "horario") pintarPersonajes();
    if (e.target.name === "horario" || e.target.name === "plan") pintarNotas();
  });

  ficha.addEventListener("submit", (e) => {
    e.preventDefault();

    const marca = marcaActual();
    const plan = PLANES[planActual()];
    const precio = PRECIOS[planActual()];
    const nombres = PERSONAJES.filter((p) => elegidos.has(p.id)).map((p) => p.nombre);

    const fecha = ficha.fecha.value;
    const fechaLinda = fecha
      ? new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", {
          day: "numeric",
          month: "long",
        })
      : null;

    const lineas = [
      `Hola! Soy ${ficha.nombre.value || "—"} y quiero armar mi evento.`,
      "",
      `Plan: ${plan.nombre}${
        precio
          ? ` ($${formatoPeso.format(precio)}${
              PRECIOS_ESTIMADOS.has(planActual()) ? " estimado, a confirmar" : ""
            })`
          : ""
      }`,
      `Cuándo: ${fechaLinda || "a confirmar"}, a la ${horarioActual()}`,
    ];

    if (nombres.length) {
      const co = coordinadoresPara(nombres.length);
      lineas.push(`Personajes: ${nombres.join(", ")}`);
      lineas.push(`Equipo: ${nombres.length} personajes y ${co} coordinador${co > 1 ? "es" : ""}`);
    }
    if (ficha.lugar.value) lineas.push(`Dónde: ${ficha.lugar.value}`);
    if (ficha.chicos.value) lineas.push(`Cuántos chicos: ${ficha.chicos.value}`);

    window.open(whatsappURL(marca, lineas.join("\n")), "_blank", "noopener");
  });

  pintarPersonajes();
  pintarEquipo();
  pintarNotas();
}

/* ---------- Costura: arrastrar o scrollear para elegir lado ---------- */

const seam = document.querySelector("#seam");
let pan = 0;
let panTarget = 0;

function goTo(side) {
  panTarget = side === "daale" ? -1 : side === "noche" ? 1 : 0;
  const target = document.querySelector(side === "noche" ? "#promos-noche" : "#promos-daale");
  target?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}

document.querySelectorAll("[data-goto]").forEach((btn) => {
  btn.addEventListener("click", () => goTo(btn.dataset.goto));
});

/* ---------- Precios y WhatsApp ---------- */

pintarPrecios();

document.querySelectorAll("[data-wa]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lado = btn.dataset.wa;
    const nombre = btn.closest(".crew")?.querySelector(".crew-name")?.textContent.trim();
    const mensaje =
      lado === "noche"
        ? `Hola! Quería consultar por ${nombre} para mi evento.`
        : `Hola! Me interesa el combo ${nombre}. ¿Me pasás disponibilidad y precio?`;
    window.open(whatsappURL(lado, mensaje), "_blank", "noopener");
  });
});

const MENSAJE_BASE = {
  daale: "Hola! Quería consultar por una animación para mi evento.",
  noche: "Hola! Quería consultar por Noche Magik para mi evento.",
};

document.querySelectorAll("[data-wa-link]").forEach((a) => {
  const lado = a.dataset.waLink;
  a.href = whatsappURL(lado, MENSAJE_BASE[lado]);
  a.target = "_blank";
  a.rel = "noopener";
});

/* El boton flotante apunta a la marca de la seccion que estas mirando. */
const flotante = document.querySelector("#wa-flotante");
const seccionNoche = document.querySelector("#promos-noche");
const seccionDia = document.querySelector("#promos-daale");

function actualizarFlotante() {
  // En el hero no aparece: ahí la decisión todavía es qué marca mirar.
  const visible = seccionDia.getBoundingClientRect().top <= innerHeight * 0.6;
  flotante.classList.toggle("wa-flotante--visible", visible);

  const enNoche = seccionNoche.getBoundingClientRect().top < innerHeight * 0.5;
  const lado = enNoche ? "noche" : "daale";
  if (flotante.dataset.waLink === lado) return;
  flotante.dataset.waLink = lado;
  flotante.href = whatsappURL(lado, MENSAJE_BASE[lado]);
  flotante.style.background = enNoche ? "#f5c25b" : "#25d366";
  flotante.style.color = enNoche ? "#2a1c00" : "#042a14";
}

addEventListener("scroll", actualizarFlotante, { passive: true });
actualizarFlotante();

let dragging = false;
let dragStart = 0;
let dragBase = 0;

seam.addEventListener("pointerdown", (e) => {
  dragging = true;
  dragStart = isNarrow() ? e.clientY : e.clientX;
  dragBase = panTarget;
  seam.setPointerCapture(e.pointerId);
});

seam.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const now = isNarrow() ? e.clientY : e.clientX;
  const span = isNarrow() ? innerHeight : innerWidth;
  panTarget = Math.max(-1, Math.min(1, dragBase + ((now - dragStart) / span) * 3));
});

function endDrag() {
  if (!dragging) return;
  dragging = false;
  if (panTarget < -0.45) goTo("daale");
  else if (panTarget > 0.45) goTo("noche");
  else panTarget = 0;
}

seam.addEventListener("pointerup", endDrag);
seam.addEventListener("pointercancel", endDrag);

seam.addEventListener(
  "wheel",
  (e) => {
    panTarget = Math.max(-1, Math.min(1, panTarget + e.deltaY * 0.0022));
  },
  { passive: true }
);

/* ---------- Resize ---------- */

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  unitsPerPx = worldHeight() / innerHeight;
  layoutLogos();
}

addEventListener("resize", resize);

/* ---------- Loop ---------- */

let last = performance.now();
let nextFirework = 900;
let ambientConfetti = 600;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const b = bounds();

  // Los fuegos suben solos; el click agrega de más.
  nextFirework -= dt * 1000;
  if (nextFirework <= 0 && !reduceMotion) {
    const x = isNarrow() ? (Math.random() - 0.5) * b.x * 1.2 : b.x * (0.25 + Math.random() * 0.6);
    const y = isNarrow() ? -b.y * (0.1 + Math.random() * 0.5) : b.y * (0.05 + Math.random() * 0.55);
    burstFirework(x, y, 130);
    nextFirework = 1200 + Math.random() * 1600;
  }

  ambientConfetti -= dt * 1000;
  if (ambientConfetti <= 0 && !reduceMotion) {
    const x = isNarrow() ? (Math.random() - 0.5) * b.x * 1.2 : -b.x * (0.25 + Math.random() * 0.6);
    const y = isNarrow() ? b.y * (0.15 + Math.random() * 0.45) : -b.y * (0.1 + Math.random() * 0.4);
    burstConfetti(x, y, 45, 0.85);
    ambientConfetti = 900 + Math.random() * 1100;
  }

  stepConfetti(dt);
  stepFireworks(dt);
  revisarHover();
  pasoGiros(now);

  // Parallax: la cámara acompaña la elección y cada capa se mueve distinto.
  pan += (panTarget - pan) * Math.min(1, dt * 5);
  camera.position.x = pan * 1.6;
  camera.position.y = -scrollY * unitsPerPx * 0.35;

  const t = now * 0.001;
  for (const k of ["daale", "noche"]) {
    const logo = logos[k];
    if (!logo?.userData.home) continue;
    const home = logo.userData.home;
    const depth = k === "daale" ? 0.5 : 0.85;
    logo.position.set(
      home.x + pan * depth * -1.1,
      home.y + Math.sin(t * (k === "daale" ? 0.9 : 0.6) + 1) * 0.09,
      home.z
    );
    logo.rotation.z = Math.sin(t * 0.5) * 0.015;
  }

  renderer.render(scene, camera);
}

resize();

// Bienvenida: la página estalla apenas entrás, de los dos lados a la vez.
if (!reduceMotion) {
  const b0 = bounds();
  const narrow0 = isNarrow();
  burstConfetti(narrow0 ? 0 : -b0.x * 0.5, narrow0 ? b0.y * 0.3 : -b0.y * 0.2, 150, 1.35);
  burstFirework(narrow0 ? 0 : b0.x * 0.5, narrow0 ? -b0.y * 0.35 : b0.y * 0.25, 200);
}

requestAnimationFrame(frame);
