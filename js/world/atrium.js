import * as THREE from "three";

var stage = document.getElementById("world-stage");
var canvas = document.getElementById("hq-canvas");
if (!stage || !canvas) throw new Error("HQ world stage missing");

var reduced = function () {
  return document.documentElement.getAttribute("data-motion") === "reduce";
};

var rooms = {
  lab: {
    href: "./qa-lab.html",
    color: 0x7fd3c2,
    pos: [-7.2, 1.7, 0.4],
    size: [5.4, 3.4, 7.2],
    cam: new THREE.Vector3(-2.2, 3.2, 7.5),
    look: new THREE.Vector3(-7.2, 1.2, 0.4)
  },
  studio: {
    href: "./dev-studio.html",
    color: 0x9aa7ff,
    pos: [7.2, 1.7, 0.4],
    size: [5.4, 3.4, 7.2],
    cam: new THREE.Vector3(2.2, 3.2, 7.5),
    look: new THREE.Vector3(7.2, 1.2, 0.4)
  },
  office: {
    href: "./office.html",
    color: 0xf0b27a,
    pos: [0, 1.45, 8.2],
    size: [7.4, 2.9, 4.2],
    cam: new THREE.Vector3(0, 3.4, 3.2),
    look: new THREE.Vector3(0, 1.1, 8.2)
  },
  fame: {
    href: "./fame.html",
    color: 0xe8c07d,
    pos: [0, 1.9, -8.4],
    size: [13.5, 3.8, 3.4],
    cam: new THREE.Vector3(0, 3.6, -2.2),
    look: new THREE.Vector3(0, 1.4, -8.4)
  }
};

var overview = {
  pos: new THREE.Vector3(0, 12.2, 16.8),
  look: new THREE.Vector3(0, 0.2, -1.4)
};

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);
scene.fog = new THREE.Fog(0x0b0d12, 22, 48);

var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
camera.position.copy(overview.pos);
var look = overview.look.clone();
camera.lookAt(look);

var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.AmbientLight(0x9aa3b2, 0.38));
var sun = new THREE.DirectionalLight(0xf4efe6, 0.55);
sun.position.set(6, 14, 10);
scene.add(sun);

var floor = new THREE.Mesh(
  new THREE.PlaneGeometry(36, 36),
  new THREE.MeshStandardMaterial({ color: 0x12151c, roughness: 0.92, metalness: 0.04 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

var atrium = new THREE.Mesh(
  new THREE.BoxGeometry(6.2, 0.16, 6.2),
  new THREE.MeshStandardMaterial({ color: 0x1b2130, roughness: 0.7, metalness: 0.12 })
);
atrium.position.y = 0.08;
scene.add(atrium);

var grid = new THREE.GridHelper(36, 36, 0x2a303c, 0x181c24);
grid.position.y = 0.01;
grid.material.transparent = true;
grid.material.opacity = 0.22;
scene.add(grid);

var pickables = [];
var meshes = {};

function addRoom(id, spec) {
  var mat = new THREE.MeshStandardMaterial({
    color: 0x171b24,
    roughness: 0.58,
    metalness: 0.18,
    emissive: spec.color,
    emissiveIntensity: 0.14
  });
  var mesh = new THREE.Mesh(new THREE.BoxGeometry(spec.size[0], spec.size[1], spec.size[2]), mat);
  mesh.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
  mesh.userData.id = id;
  scene.add(mesh);
  pickables.push(mesh);
  meshes[id] = mesh;

  var lamp = new THREE.PointLight(spec.color, 2.1, 11, 2);
  lamp.position.set(spec.pos[0], spec.pos[1] + spec.size[1] * 0.45, spec.pos[2]);
  scene.add(lamp);

  var door = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.3),
    new THREE.MeshStandardMaterial({
      color: spec.color,
      emissive: spec.color,
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide
    })
  );
  door.userData.id = id;
  if (id === "lab") {
    door.position.set(-4.5, 1.15, 3.4);
  } else if (id === "studio") {
    door.position.set(4.5, 1.15, 3.4);
  } else if (id === "office") {
    door.position.set(0, 1.15, 6.05);
  } else {
    door.position.set(0, 1.2, -6.65);
  }
  scene.add(door);
  pickables.push(door);
}

Object.keys(rooms).forEach(function (id) {
  addRoom(id, rooms[id]);
});

for (var i = 0; i < 6; i += 1) {
  var frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 1.7, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x2a241c,
      emissive: 0xe8c07d,
      emissiveIntensity: 0.08,
      roughness: 0.5
    })
  );
  frame.position.set(-4.4 + i * 1.75, 1.7, -6.65);
  frame.userData.id = "fame";
  scene.add(frame);
  pickables.push(frame);
}

var raycaster = new THREE.Raycaster();
var pointer = new THREE.Vector2();
var hovering = null;
var basePos = overview.pos.clone();
var baseLook = overview.look.clone();
var moving = false;
var mouse = { x: 0, y: 0 };

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function tweenCamera(toPos, toLook, then) {
  if (moving) return;
  moving = true;
  var fromPos = camera.position.clone();
  var fromLook = look.clone();
  var duration = reduced() ? 1 : 340;
  var t0 = performance.now();
  function step(now) {
    var t = Math.min(1, (now - t0) / duration);
    var e = easeOut(t);
    camera.position.lerpVectors(fromPos, toPos, e);
    look.lerpVectors(fromLook, toLook, e);
    camera.lookAt(look);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      basePos.copy(toPos);
      baseLook.copy(toLook);
      moving = false;
      if (then) then();
    }
  }
  requestAnimationFrame(step);
}

function enter(id) {
  var spec = rooms[id];
  if (!spec) return;
  tweenCamera(spec.cam, spec.look, function () {
    window.location.href = spec.href;
  });
}

function size() {
  var w = stage.clientWidth || window.innerWidth;
  var h = stage.clientHeight || Math.max(window.innerHeight - 72, 480);
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function project(id, el) {
  var mesh = meshes[id];
  if (!mesh || !el) return;
  var v = mesh.position.clone();
  v.y += 0.2;
  v.project(camera);
  if (v.z > 1) {
    el.style.visibility = "hidden";
    return;
  }
  el.style.visibility = "visible";
  el.style.left = ((v.x * 0.5 + 0.5) * stage.clientWidth) + "px";
  el.style.top = ((-v.y * 0.5 + 0.5) * stage.clientHeight) + "px";
}

function placeLabels() {
  project("lab", document.querySelector('[data-go="lab"]'));
  project("studio", document.querySelector('[data-go="studio"]'));
  project("office", document.querySelector('[data-go="office"]'));
  project("fame", document.querySelector('[data-go="fame"]'));
}

function pick(clientX, clientY) {
  var rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  var hits = raycaster.intersectObjects(pickables, false);
  return hits[0] ? hits[0].object : null;
}

canvas.addEventListener("pointermove", function (e) {
  mouse.x = e.clientX / window.innerWidth - 0.5;
  mouse.y = e.clientY / window.innerHeight - 0.5;
  var obj = pick(e.clientX, e.clientY);
  canvas.style.cursor = obj ? "pointer" : "default";
  if (hovering && hovering !== obj) hovering.material.emissiveIntensity = hovering.userData.baseEmissive || 0.14;
  if (obj && obj.material && obj.material.emissiveIntensity != null) {
    if (obj.userData.baseEmissive == null) obj.userData.baseEmissive = obj.material.emissiveIntensity;
    obj.material.emissiveIntensity = Math.min((obj.userData.baseEmissive || 0.14) + 0.22, 0.55);
  }
  hovering = obj;
});

canvas.addEventListener("click", function (e) {
  var obj = pick(e.clientX, e.clientY);
  if (obj && obj.userData.id) enter(obj.userData.id);
});

document.querySelectorAll("[data-go]").forEach(function (btn) {
  btn.addEventListener("click", function () {
    enter(btn.getAttribute("data-go"));
  });
});

var htmlMap = document.getElementById("html-map");
var skipWorld = document.querySelector("[data-skip-world]");
if (skipWorld) {
  skipWorld.addEventListener("click", function () {
    try {
      sessionStorage.setItem("hq-world", "off");
    } catch (err) {}
    document.body.classList.remove("world-on");
    stage.hidden = true;
    if (htmlMap) htmlMap.hidden = false;
    renderer.dispose();
  });
}

var enterBtn = document.querySelector("[data-enter-world]");
if (enterBtn) {
  enterBtn.addEventListener("click", function (e) {
    e.preventDefault();
    tweenCamera(new THREE.Vector3(0, 8.4, 12.2), new THREE.Vector3(0, 0.5, -1.2));
  });
}

size();
stage.hidden = false;
document.body.classList.add("world-on");
if (htmlMap) htmlMap.hidden = true;

var labels = document.querySelector(".world-labels");
if (labels) labels.hidden = false;

var last = 0;
function tick(now) {
  var w = stage.clientWidth;
  if (!moving && document.documentElement.getAttribute("data-motion") !== "reduce") {
    camera.position.x = basePos.x + mouse.x * 1.6;
    camera.position.y = basePos.y + mouse.y * -0.8;
    camera.position.z = basePos.z;
    look.x = baseLook.x + mouse.x * 0.6;
    look.y = baseLook.y;
    look.z = baseLook.z;
    camera.lookAt(look);
  }
  if (now - last > 32) {
    placeLabels();
    last = now;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.addEventListener("resize", size);
window.addEventListener("pageshow", size);
