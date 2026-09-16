import * as THREE from "three";

var stage = document.getElementById("world-stage");
var canvas = document.getElementById("hq-canvas");
if (!stage || !canvas) throw new Error("HQ world stage missing");

var reduced = function () {
  return document.documentElement.getAttribute("data-motion") === "reduce";
};

var rooms = {
  foundations: {
    href: "./journey.html#foundations",
    color: 0xc4a574,
    x: -3.2,
    z: 9.5,
    cam: new THREE.Vector3(0.2, 2.15, 9.5),
    look: new THREE.Vector3(-3.2, 1.2, 9.5)
  },
  automation: {
    href: "./journey.html#automation",
    color: 0x9aabc0,
    x: 3.2,
    z: 5.2,
    cam: new THREE.Vector3(-0.2, 2.15, 5.2),
    look: new THREE.Vector3(3.2, 1.2, 5.2)
  },
  systems: {
    href: "./journey.html#systems",
    color: 0x7fd3c2,
    x: -3.2,
    z: 0.6,
    cam: new THREE.Vector3(0.2, 2.15, 0.6),
    look: new THREE.Vector3(-3.2, 1.2, 0.6)
  },
  qe: {
    href: "./journey.html#qe",
    color: 0x7ea0c8,
    x: 3.2,
    z: -4.2,
    cam: new THREE.Vector3(-0.2, 2.15, -4.2),
    look: new THREE.Vector3(3.2, 1.2, -4.2)
  },
  ai: {
    href: "./journey.html#ai",
    color: 0x9aa7ff,
    x: -3.2,
    z: -9,
    cam: new THREE.Vector3(0.2, 2.15, -9),
    look: new THREE.Vector3(-3.2, 1.2, -9)
  },
  today: {
    href: "./journey.html#today",
    color: 0xe8c07d,
    x: 0,
    z: -14.2,
    cam: new THREE.Vector3(0, 2.35, -10.2),
    look: new THREE.Vector3(0, 1.3, -14.2)
  }
};

var overview = {
  pos: new THREE.Vector3(0, 3.7, 16.8),
  look: new THREE.Vector3(0, 1.05, -7)
};
var walk = {
  pos: new THREE.Vector3(0, 2.25, 15.6),
  look: new THREE.Vector3(0, 1.05, -9)
};

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x151922);
scene.fog = new THREE.Fog(0x151922, 28, 60);

var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 90);
camera.position.copy(overview.pos);
var look = overview.look.clone();
camera.lookAt(look);

var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.HemisphereLight(0xd9e0ec, 0x2c261c, 0.78));
scene.add(new THREE.AmbientLight(0xb7c0ce, 0.32));
var sun = new THREE.DirectionalLight(0xf7f1e6, 0.68);
sun.position.set(6, 12, 9);
scene.add(sun);

function mesh(geo, mat, x, y, z) {
  var m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

function edges(source, color) {
  var line = new THREE.LineSegments(
    new THREE.EdgesGeometry(source.geometry),
    new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.42 })
  );
  line.position.copy(source.position);
  scene.add(line);
}

var floor = mesh(
  new THREE.PlaneGeometry(16, 38),
  new THREE.MeshStandardMaterial({ color: 0x323a48, roughness: 0.9, metalness: 0.04 }),
  0,
  0,
  -2
);
floor.rotation.x = -Math.PI / 2;

mesh(
  new THREE.BoxGeometry(2.5, 0.05, 31),
  new THREE.MeshStandardMaterial({
    color: 0x5a4c34,
    roughness: 0.5,
    metalness: 0.1,
    emissive: 0x3d3018,
    emissiveIntensity: 0.22
  }),
  0,
  0.04,
  -2
);

var wallMat = new THREE.MeshStandardMaterial({ color: 0x3e4656, roughness: 0.8, metalness: 0.06 });
edges(mesh(new THREE.BoxGeometry(0.16, 4.5, 32), wallMat, -6.05, 2.25, -2), 0x8d97a8);
edges(mesh(new THREE.BoxGeometry(0.16, 4.5, 32), wallMat, 6.05, 2.25, -2), 0x8d97a8);
mesh(
  new THREE.BoxGeometry(12.2, 0.1, 32),
  new THREE.MeshStandardMaterial({ color: 0x232833, roughness: 0.92 }),
  0,
  4.52,
  -2
);
var endWall = mesh(
  new THREE.BoxGeometry(12.2, 4.5, 0.18),
  new THREE.MeshStandardMaterial({ color: 0x43392c, roughness: 0.68, emissive: 0xe8c07d, emissiveIntensity: 0.1 }),
  0,
  2.25,
  -17.2
);
edges(endWall, 0xe8c07d);

var pickables = [];
var meshes = {};

function addStation(id, spec) {
  var wide = id === "today" ? 4.6 : 2.7;
  var deep = id === "today" ? 2.5 : 2.3;
  var body = mesh(
    new THREE.BoxGeometry(wide, 2.55, deep),
    new THREE.MeshStandardMaterial({
      color: 0x2d3442,
      roughness: 0.5,
      metalness: 0.15,
      emissive: spec.color,
      emissiveIntensity: 0.22
    }),
    spec.x,
    1.3,
    spec.z
  );
  body.userData.id = id;
  body.userData.baseEmissive = 0.22;
  pickables.push(body);
  meshes[id] = body;
  edges(body, spec.color);

  var lamp = new THREE.PointLight(spec.color, 2.8, 8, 1.8);
  lamp.position.set(spec.x, 3.1, spec.z);
  scene.add(lamp);

  var door;
  if (id === "today") {
    door = mesh(
      new THREE.PlaneGeometry(1.55, 2.1),
      new THREE.MeshStandardMaterial({
        color: spec.color,
        emissive: spec.color,
        emissiveIntensity: 0.58,
        roughness: 0.3,
        side: THREE.DoubleSide
      }),
      spec.x,
      1.15,
      spec.z + deep / 2 + 0.03
    );
  } else {
    var side = spec.x < 0 ? 1 : -1;
    door = mesh(
      new THREE.PlaneGeometry(1.45, 2.05),
      new THREE.MeshStandardMaterial({
        color: spec.color,
        emissive: spec.color,
        emissiveIntensity: 0.58,
        roughness: 0.3,
        side: THREE.DoubleSide
      }),
      spec.x + side * (wide / 2 + 0.03),
      1.15,
      spec.z
    );
    door.rotation.y = Math.PI / 2;
  }
  door.userData.id = id;
  door.userData.baseEmissive = 0.58;
  pickables.push(door);
}

Object.keys(rooms).forEach(function (id) {
  addStation(id, rooms[id]);
});

for (var i = 0; i < 6; i += 1) {
  var frame = mesh(
    new THREE.BoxGeometry(0.58, 0.82, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x2a241c, emissive: 0xe8c07d, emissiveIntensity: 0.24 }),
    -1.45 + i * 0.58,
    2.2,
    -17.08
  );
  frame.userData.id = "today";
  pickables.push(frame);
}

var raycaster = new THREE.Raycaster();
var pointer = new THREE.Vector2();
var hovering = null;
var basePos = overview.pos.clone();
var baseLook = overview.look.clone();
var moving = false;
var tweenGen = 0;
var mouse = { x: 0, y: 0 };
var labels = document.querySelector(".world-labels");

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function tweenCamera(toPos, toLook, then) {
  var gen = (tweenGen += 1);
  moving = true;
  var fromPos = camera.position.clone();
  var fromLook = look.clone();
  var duration = reduced() ? 1 : 360;
  var t0 = performance.now();
  function step(now) {
    if (gen !== tweenGen) return;
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

function showLabels() {
  if (labels) labels.hidden = false;
}

function enter(id) {
  var spec = rooms[id];
  if (!spec) return;
  document.body.classList.add("world-walk");
  showLabels();
  tweenCamera(spec.cam, spec.look, function () {
    window.location.href = spec.href;
  });
}

function size() {
  var w = stage.clientWidth || window.innerWidth;
  var h = stage.clientHeight || Math.max(window.innerHeight - 52, 480);
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function project(id, el) {
  var target = meshes[id];
  if (!target || !el) return;
  var v = target.position.clone();
  v.y += 1.7;
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
  if (!labels || labels.hidden) return;
  ["foundations", "automation", "systems", "qe", "ai", "today"].forEach(function (id) {
    project(id, document.querySelector('[data-go="' + id + '"]'));
  });
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
  if (hovering && hovering !== obj && hovering.material && hovering.material.emissiveIntensity != null) {
    hovering.material.emissiveIntensity = hovering.userData.baseEmissive || 0.22;
  }
  if (obj && obj.material && obj.material.emissiveIntensity != null) {
    if (obj.userData.baseEmissive == null) obj.userData.baseEmissive = obj.material.emissiveIntensity;
    obj.material.emissiveIntensity = Math.min((obj.userData.baseEmissive || 0.22) + 0.2, 0.78);
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
  });
}

var enterBtn = document.querySelector("[data-enter-world]");
if (enterBtn) {
  enterBtn.addEventListener("click", function (e) {
    e.preventDefault();
    document.body.classList.add("world-walk");
    showLabels();
    tweenCamera(walk.pos, walk.look);
  });
}

size();
stage.hidden = false;
document.body.classList.add("world-on");
if (htmlMap) htmlMap.hidden = true;
if (labels) labels.hidden = false;

var last = 0;
function tick(now) {
  if (!moving && document.documentElement.getAttribute("data-motion") !== "reduce") {
    camera.position.x = basePos.x + mouse.x * 0.9;
    camera.position.y = basePos.y + mouse.y * -0.4;
    camera.position.z = basePos.z;
    look.x = baseLook.x + mouse.x * 0.35;
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
