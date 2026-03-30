import * as THREE from "three";

const GAME_STATES = {
  START: "START",
  EXPLORING: "EXPLORING",
  INTERACTING: "INTERACTING",
  POPUP: "POPUP",
  COMPLETED: "COMPLETED",
};

const WORLD_HALF_SIZE = 24;
const PLAYER_SPEED = 8.4;
const INTERACTION_DISTANCE = 6.8;
const CAMERA_DISTANCE = 8.2;
const CAMERA_HEIGHT = 2.1;
const CAMERA_SMOOTHING = 8.5;
const LOOK_SENSITIVITY = 0.005;
const TOUCH_SENSITIVITY = 0.006;
const JOYSTICK_RADIUS = 36;

const animals = [
  {
    id: "elephant",
    name: "Ellie",
    species: "Elephant",
    emoji: "🐘",
    position: { x: -12, z: -4 },
    rotationY: -Math.PI / 2,
    zoneColor: 0x9bc7ea,
    learned: false,
    interactions: [
      {
        id: "hello",
        label: "Say Hello",
        response: "Ellie flaps her ears and waves her trunk hello.",
        learning: false,
      },
      {
        id: "trunk",
        label: "What can you do with your trunk?",
        response:
          "An elephant uses its trunk to smell, breathe, grab food, and splash water.",
        learning: true,
      },
      {
        id: "food",
        label: "What do you eat?",
        response: "Ellie eats plants like grass, leaves, bark, and fruit.",
        learning: true,
      },
      {
        id: "fact",
        label: "Fun Fact",
        response: "Ellie can use her trunk like a giant straw to drink water.",
        learning: true,
      },
    ],
  },
  {
    id: "lion",
    name: "Leo",
    species: "Lion",
    emoji: "🦁",
    position: { x: 12, z: -4 },
    rotationY: Math.PI / 2,
    zoneColor: 0xf0b36d,
    learned: false,
    interactions: [
      {
        id: "hello",
        label: "Say Hello",
        response: "Leo gives a brave roar and swishes his tail.",
        learning: false,
      },
      {
        id: "home",
        label: "Where do you live?",
        response: "Lions live in grasslands and open woodlands, mostly in Africa.",
        learning: true,
      },
      {
        id: "pride",
        label: "What is a pride?",
        response: "A pride is a lion family that rests, protects cubs, and hunts together.",
        learning: true,
      },
      {
        id: "fact",
        label: "Fun Fact",
        response: "Leo's roar can travel far across the savanna.",
        learning: true,
      },
    ],
  },
];

const ui = {
  sceneRoot: document.querySelector("#scene-root"),
  startScreen: document.querySelector("#start-screen"),
  startButton: document.querySelector("#start-button"),
  hud: document.querySelector("#hud"),
  progressCount: document.querySelector("#progress-count"),
  minimap: document.querySelector("#minimap"),
  mapPlayer: document.querySelector("#map-player"),
  controlHint: document.querySelector("#control-hint"),
  interactionHint: document.querySelector("#interaction-hint"),
  touchControls: document.querySelector("#touch-controls"),
  joystickArea: document.querySelector("#joystick-area"),
  joystickKnob: document.querySelector("#joystick-knob"),
  panelBackdrop: document.querySelector("#panel-backdrop"),
  panelTitle: document.querySelector("#panel-title"),
  panelKicker: document.querySelector("#panel-kicker"),
  interactionButtons: document.querySelector("#interaction-buttons"),
  responseArea: document.querySelector("#response-area"),
  closePanel: document.querySelector("#close-panel"),
  popupBackdrop: document.querySelector("#popup-backdrop"),
  rewardPopup: document.querySelector("#reward-popup"),
  rewardTitle: document.querySelector("#reward-title"),
  rewardMessage: document.querySelector("#reward-message"),
  rewardClose: document.querySelector("#reward-close"),
  completionPopup: document.querySelector("#completion-popup"),
  completionMessage: document.querySelector("#completion-message"),
  completionClose: document.querySelector("#completion-close"),
};

const state = {
  gameState: GAME_STATES.START,
  isTouchDevice:
    window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window,
  playerPosition: new THREE.Vector3(0, 0, 14),
  currentAnimalId: null,
  nearestAnimalId: null,
  learnedAnimals: new Set(),
  hasCompleted: false,
  pendingCompletion: false,
  activePopup: null,
  popupTimer: null,
  keyboard: {
    forward: false,
    back: false,
    left: false,
    right: false,
  },
  joystick: {
    active: false,
    pointerId: null,
    x: 0,
    y: 0,
  },
  pointer: {
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    moved: false,
    type: "mouse",
  },
  look: {
    yaw: 0,
    pitch: 0.46,
  },
};

const runtime = {
  timer: new THREE.Timer(),
  renderer: null,
  scene: null,
  camera: null,
  raycaster: new THREE.Raycaster(),
  pointerNdc: new THREE.Vector2(),
  player: null,
  playerHead: null,
  animalObjects: new Map(),
  mapMarkers: new Map(),
  tempVector: new THREE.Vector3(),
  tempVector2: new THREE.Vector3(),
  targetCameraPosition: new THREE.Vector3(),
};

init();

function init() {
  runtime.timer.connect(document);
  buildScene();
  buildMinimap();
  bindEvents();
  updateTouchControls();
  updateProgress();
  onResize();
  animate();
}

function buildScene() {
  const sceneRoot = document.querySelector("#scene-root");

  runtime.scene = new THREE.Scene();
  runtime.scene.background = new THREE.Color(0xa7e3ff);
  runtime.scene.fog = new THREE.Fog(0xa7e3ff, 26, 54);

  runtime.camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    140,
  );

  runtime.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  runtime.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  runtime.renderer.setSize(window.innerWidth, window.innerHeight);
  runtime.renderer.shadowMap.enabled = true;
  runtime.renderer.shadowMap.type = THREE.PCFShadowMap;
  sceneRoot.appendChild(runtime.renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xfff5d5, 0x5a8d52, 1.35);
  runtime.scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff0be, 1.8);
  sunLight.position.set(14, 20, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -28;
  sunLight.shadow.camera.right = 28;
  sunLight.shadow.camera.top = 28;
  sunLight.shadow.camera.bottom = -28;
  runtime.scene.add(sunLight);

  addGround();
  addBoundaryFence();
  addPath();
  addSun();
  addTrees();
  addAnimals();
  addPlayer();
}

function addGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x83d56e, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  runtime.scene.add(ground);

  const innerYard = new THREE.Mesh(
    new THREE.CircleGeometry(17.5, 48),
    new THREE.MeshStandardMaterial({
      color: 0x98dc77,
      transparent: true,
      opacity: 0.78,
    }),
  );
  innerYard.rotation.x = -Math.PI / 2;
  innerYard.position.y = 0.01;
  innerYard.receiveShadow = true;
  runtime.scene.add(innerYard);
}

function addBoundaryFence() {
  const postMaterial = new THREE.MeshStandardMaterial({
    color: 0x865f42,
    roughness: 0.9,
  });

  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x9f7856,
    roughness: 0.85,
  });

  const postGeometry = new THREE.BoxGeometry(0.35, 1.3, 0.35);
  const railGeometryLong = new THREE.BoxGeometry(3.5, 0.18, 0.18);
  const railGeometryWide = new THREE.BoxGeometry(0.18, 0.18, 3.5);
  const limit = WORLD_HALF_SIZE - 1.6;

  for (let x = -limit; x <= limit; x += 3.5) {
    addFencePost(x, -limit, postGeometry, postMaterial);
    addFencePost(x, limit, postGeometry, postMaterial);
    addFenceRail(x, -limit, railGeometryLong, railMaterial);
    addFenceRail(x, limit, railGeometryLong, railMaterial);
  }

  for (let z = -limit; z <= limit; z += 3.5) {
    addFencePost(-limit, z, postGeometry, postMaterial);
    addFencePost(limit, z, postGeometry, postMaterial);
    addFenceRail(-limit, z, railGeometryWide, railMaterial);
    addFenceRail(limit, z, railGeometryWide, railMaterial);
  }
}

function addFencePost(x, z, geometry, material) {
  const post = new THREE.Mesh(geometry, material);
  post.position.set(x, 0.65, z);
  post.castShadow = true;
  post.receiveShadow = true;
  runtime.scene.add(post);
}

function addFenceRail(x, z, geometry, material) {
  const rail = new THREE.Mesh(geometry, material);
  rail.position.set(x, 0.95, z);
  rail.castShadow = true;
  rail.receiveShadow = true;
  runtime.scene.add(rail);
}

function addPath() {
  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4cf8c,
    roughness: 1,
  });

  const entrancePath = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 24),
    pathMaterial,
  );
  entrancePath.rotation.x = -Math.PI / 2;
  entrancePath.position.set(0, 0.02, 12);
  entrancePath.receiveShadow = true;
  runtime.scene.add(entrancePath);

  const centerCircle = new THREE.Mesh(
    new THREE.CircleGeometry(5.5, 32),
    pathMaterial,
  );
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.set(0, 0.03, 0);
  centerCircle.receiveShadow = true;
  runtime.scene.add(centerCircle);

  const signPost = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 2.1, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x865f42, roughness: 0.9 }),
  );
  signPost.position.set(0, 1.15, 22.1);
  signPost.castShadow = true;
  runtime.scene.add(signPost);

  const signLabel = createLabelSprite("Zoo Explorer", {
    background: "#fff8dd",
    border: "#d28143",
    textColor: "#214336",
    fontSize: 38,
  });
  signLabel.position.set(0, 2.6, 22.25);
  signLabel.scale.set(5.2, 2.1, 1);
  runtime.scene.add(signLabel);
}

function addSun() {
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe08c }),
  );
  sun.position.set(-22, 24, -26);
  runtime.scene.add(sun);
}

function addTrees() {
  const treePositions = [
    [-19, -14, 1.05],
    [-16, 11, 0.95],
    [-7, -18, 0.82],
    [7, -18, 0.82],
    [17, 11, 0.95],
    [20, -13, 1.08],
    [-21, 3, 0.88],
    [21, 3, 0.88],
  ];

  treePositions.forEach(([x, z, scale]) => {
    runtime.scene.add(createTree(x, z, scale));
  });
}

function createTree(x, z, scale) {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24 * scale, 0.32 * scale, 1.8 * scale, 10),
    new THREE.MeshStandardMaterial({ color: 0x7b593c, roughness: 0.9 }),
  );
  trunk.position.y = 0.9 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d8241,
    roughness: 0.85,
  });

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.95 * scale, 18, 18),
    leafMaterial,
  );
  canopy.position.set(0, 2.05 * scale, 0);
  canopy.castShadow = true;
  group.add(canopy);

  const canopy2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.75 * scale, 18, 18),
    leafMaterial.clone(),
  );
  canopy2.position.set(0.55 * scale, 2.15 * scale, -0.15 * scale);
  canopy2.castShadow = true;
  group.add(canopy2);

  const canopy3 = new THREE.Mesh(
    new THREE.SphereGeometry(0.7 * scale, 18, 18),
    leafMaterial.clone(),
  );
  canopy3.position.set(-0.45 * scale, 1.95 * scale, 0.25 * scale);
  canopy3.castShadow = true;
  group.add(canopy3);

  group.position.set(x, 0, z);
  return group;
}

function addAnimals() {
  animals.forEach((animal) => {
    const zone = new THREE.Mesh(
      new THREE.CircleGeometry(4.7, 36),
      new THREE.MeshStandardMaterial({
        color: animal.zoneColor,
        transparent: true,
        opacity: 0.28,
        roughness: 0.85,
      }),
    );
    zone.rotation.x = -Math.PI / 2;
    zone.position.set(animal.position.x, 0.025, animal.position.z);
    zone.receiveShadow = true;
    runtime.scene.add(zone);

    const zoneFenceMaterial = new THREE.MeshStandardMaterial({
      color: 0xa57b54,
      roughness: 0.95,
    });
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 1.05, 8),
        zoneFenceMaterial,
      );
      post.position.set(
        animal.position.x + Math.cos(angle) * 4.1,
        0.52,
        animal.position.z + Math.sin(angle) * 4.1,
      );
      post.castShadow = true;
      runtime.scene.add(post);
    }

    const group =
      animal.id === "elephant" ? createElephant(animal) : createLion(animal);
    group.position.set(animal.position.x, 0, animal.position.z);
    group.rotation.y = animal.rotationY;
    group.add(createInteractionHitbox(animal.id));
    runtime.scene.add(group);

    const label = createLabelSprite(`${animal.emoji} ${animal.name}`, {
      background: "#fff7dc",
      border: animal.id === "elephant" ? "#7ea8c9" : "#db8a34",
      textColor: "#214336",
      fontSize: 42,
    });
    label.position.set(0, 3.9, 0);
    label.scale.set(4.2, 1.8, 1);
    group.add(label);

    runtime.animalObjects.set(animal.id, {
      root: group,
      zone,
      label,
      highlight: 0,
      baseY: group.position.y,
      bobOffset: animal.id === "elephant" ? 0 : 1.6,
      materials: collectMaterials(group),
    });
  });
}

function createInteractionHitbox(animalId) {
  const hitbox = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 18, 18),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  hitbox.position.set(0, 1.7, 0);
  tagAnimal(hitbox, animalId);
  return hitbox;
}

function createElephant(animal) {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({
    color: 0x8baec8,
    roughness: 0.82,
    emissive: 0x21313d,
    emissiveIntensity: 0.06,
  });
  const earMaterial = new THREE.MeshStandardMaterial({
    color: 0x9dc0d9,
    roughness: 0.85,
    emissive: 0x21313d,
    emissiveIntensity: 0.05,
  });
  const nailMaterial = new THREE.MeshStandardMaterial({
    color: 0xeae4da,
    roughness: 0.9,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.85, 2.1),
    skin,
  );
  body.position.y = 1.45;
  body.castShadow = true;
  body.receiveShadow = true;
  tagAnimal(body, animal.id);
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 1.4, 1.25),
    skin,
  );
  head.position.set(0, 1.8, -1.5);
  head.castShadow = true;
  tagAnimal(head, animal.id);
  group.add(head);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.16, 1.65, 12),
    skin,
  );
  trunk.position.set(0, 1.15, -2.35);
  trunk.rotation.x = Math.PI / 2.5;
  trunk.castShadow = true;
  tagAnimal(trunk, animal.id);
  group.add(trunk);

  const leftEar = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 20),
    earMaterial,
  );
  leftEar.position.set(0.78, 1.92, -1.45);
  leftEar.rotation.y = -Math.PI / 2.8;
  tagAnimal(leftEar, animal.id);
  group.add(leftEar);

  const rightEar = leftEar.clone();
  rightEar.position.x = -0.78;
  rightEar.rotation.y = Math.PI / 2.8;
  tagAnimal(rightEar, animal.id);
  group.add(rightEar);

  for (const x of [-1.05, -0.38, 0.38, 1.05]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 1.55, 12),
      skin,
    );
    leg.position.set(x, 0.78, 0.34);
    leg.castShadow = true;
    leg.receiveShadow = true;
    tagAnimal(leg, animal.id);
    group.add(leg);

    const nail = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.1, 0.34),
      nailMaterial,
    );
    nail.position.set(x, 0.06, 0.48);
    tagAnimal(nail, animal.id);
    group.add(nail);
  }

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x1c2530 });
  for (const x of [-0.25, 0.25]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), eyeMaterial);
    eye.position.set(x, 2.02, -2.08);
    tagAnimal(eye, animal.id);
    group.add(eye);
  }

  return group;
}

function createLion(animal) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xd69545,
    roughness: 0.8,
    emissive: 0x40230f,
    emissiveIntensity: 0.05,
  });
  const maneMaterial = new THREE.MeshStandardMaterial({
    color: 0x8d4d19,
    roughness: 0.84,
    emissive: 0x40230f,
    emissiveIntensity: 0.04,
  });
  const snoutMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2ddba,
    roughness: 0.9,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.05, 1.45, 1.65),
    bodyMaterial,
  );
  body.position.y = 1.32;
  body.castShadow = true;
  body.receiveShadow = true;
  tagAnimal(body, animal.id);
  group.add(body);

  const mane = new THREE.Mesh(
    new THREE.SphereGeometry(0.88, 22, 22),
    maneMaterial,
  );
  mane.position.set(0, 1.78, -1.45);
  mane.castShadow = true;
  tagAnimal(mane, animal.id);
  group.add(mane);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 22, 22),
    bodyMaterial,
  );
  head.position.set(0, 1.78, -1.7);
  head.castShadow = true;
  tagAnimal(head, animal.id);
  group.add(head);

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.36, 0.46),
    snoutMaterial,
  );
  snout.position.set(0, 1.55, -2.12);
  snout.castShadow = true;
  tagAnimal(snout, animal.id);
  group.add(snout);

  for (const x of [-0.85, -0.25, 0.25, 0.85]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.2, 1.32, 10),
      bodyMaterial,
    );
    leg.position.set(x, 0.66, 0.18);
    leg.castShadow = true;
    leg.receiveShadow = true;
    tagAnimal(leg, animal.id);
    group.add(leg);
  }

  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.08, 1.5, 10),
    bodyMaterial,
  );
  tail.position.set(0, 1.48, 1.46);
  tail.rotation.x = -0.88;
  tail.castShadow = true;
  tagAnimal(tail, animal.id);
  group.add(tail);

  const tuft = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 12),
    maneMaterial,
  );
  tuft.position.set(0, 2.03, 2.07);
  tagAnimal(tuft, animal.id);
  group.add(tuft);

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x23180e });
  for (const x of [-0.19, 0.19]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), eyeMaterial);
    eye.position.set(x, 1.9, -2.26);
    tagAnimal(eye, animal.id);
    group.add(eye);
  }

  return group;
}

function addPlayer() {
  const player = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.38, 0.8, 4, 8),
    new THREE.MeshStandardMaterial({
      color: 0xfff7e6,
      roughness: 0.75,
      emissive: 0x32443e,
      emissiveIntensity: 0.04,
    }),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  body.position.y = 1.1;
  player.add(body);

  const shirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.5, 0.92, 16),
    new THREE.MeshStandardMaterial({
      color: 0xff8f4f,
      roughness: 0.82,
      emissive: 0x5e2c12,
      emissiveIntensity: 0.05,
    }),
  );
  shirt.position.y = 1.1;
  shirt.castShadow = true;
  player.add(shirt);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xf1d6b8, roughness: 0.86 }),
  );
  head.position.y = 1.95;
  head.castShadow = true;
  player.add(head);

  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.42, 0.14, 20),
    new THREE.MeshStandardMaterial({ color: 0x2d5747, roughness: 0.84 }),
  );
  hat.position.y = 2.18;
  hat.castShadow = true;
  player.add(hat);

  player.position.copy(state.playerPosition);
  runtime.player = player;
  runtime.playerHead = head;
  runtime.scene.add(player);
}

function buildMinimap() {
  animals.forEach((animal) => {
    const marker = document.createElement("div");
    marker.className = "map-animal";
    marker.dataset.animal = animal.id;
    marker.textContent = animal.emoji;

    const position = worldToMap(animal.position.x, animal.position.z);
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;

    ui.minimap.appendChild(marker);
    runtime.mapMarkers.set(animal.id, marker);
  });
}

function bindEvents() {
  ui.startButton.addEventListener("click", startGame);
  ui.closePanel.addEventListener("click", closeAnimalPanel);
  ui.rewardClose.addEventListener("click", dismissPopup);
  ui.completionClose.addEventListener("click", dismissPopup);

  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const canvas = runtime.renderer.domElement;
  canvas.addEventListener("pointerdown", onScenePointerDown);
  canvas.addEventListener("pointermove", onScenePointerMove);
  canvas.addEventListener("pointerup", onScenePointerUp);
  canvas.addEventListener("pointercancel", onScenePointerUp);

  ui.joystickArea.addEventListener("pointerdown", onJoystickPointerDown);
  ui.joystickArea.addEventListener("pointermove", onJoystickPointerMove);
  ui.joystickArea.addEventListener("pointerup", onJoystickPointerUp);
  ui.joystickArea.addEventListener("pointercancel", onJoystickPointerUp);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resetJoystick();
      resetPointerDrag();
    }
  });
}

function startGame() {
  if (state.gameState !== GAME_STATES.START) {
    return;
  }

  ui.sceneRoot.classList.remove("is-hidden");
  ui.startScreen.classList.add("is-exiting");

  window.setTimeout(() => {
    ui.startScreen.classList.add("hidden");
    ui.hud.classList.remove("hidden");
    state.gameState = GAME_STATES.EXPLORING;
  }, 260);
}

function onResize() {
  runtime.camera.aspect = window.innerWidth / window.innerHeight;
  runtime.camera.updateProjectionMatrix();
  runtime.renderer.setSize(window.innerWidth, window.innerHeight);
  updateTouchControls();
}

function onKeyDown(event) {
  switch (event.key) {
    case "w":
    case "W":
    case "ArrowUp":
      state.keyboard.forward = true;
      break;
    case "s":
    case "S":
    case "ArrowDown":
      state.keyboard.back = true;
      break;
    case "a":
    case "A":
    case "ArrowLeft":
      state.keyboard.left = true;
      break;
    case "d":
    case "D":
    case "ArrowRight":
      state.keyboard.right = true;
      break;
    case "Escape":
      if (state.activePopup) {
        dismissPopup();
      } else if (state.currentAnimalId) {
        closeAnimalPanel();
      }
      break;
    default:
      break;
  }
}

function onKeyUp(event) {
  switch (event.key) {
    case "w":
    case "W":
    case "ArrowUp":
      state.keyboard.forward = false;
      break;
    case "s":
    case "S":
    case "ArrowDown":
      state.keyboard.back = false;
      break;
    case "a":
    case "A":
    case "ArrowLeft":
      state.keyboard.left = false;
      break;
    case "d":
    case "D":
    case "ArrowRight":
      state.keyboard.right = false;
      break;
    default:
      break;
  }
}

function onScenePointerDown(event) {
  if (state.gameState === GAME_STATES.START) {
    return;
  }

  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  state.pointer.active = true;
  state.pointer.pointerId = event.pointerId;
  state.pointer.lastX = event.clientX;
  state.pointer.lastY = event.clientY;
  state.pointer.moved = false;
  state.pointer.type = event.pointerType;
  runtime.renderer.domElement.setPointerCapture(event.pointerId);
}

function onScenePointerMove(event) {
  if (!state.pointer.active || state.pointer.pointerId !== event.pointerId) {
    return;
  }

  const deltaX = event.clientX - state.pointer.lastX;
  const deltaY = event.clientY - state.pointer.lastY;
  const distance = Math.abs(deltaX) + Math.abs(deltaY);

  if (distance > 3) {
    state.pointer.moved = true;
  }

  const sensitivity =
    event.pointerType === "touch" ? TOUCH_SENSITIVITY : LOOK_SENSITIVITY;

  if (
    state.gameState === GAME_STATES.EXPLORING &&
    (event.pointerType === "touch" || (event.buttons & 1) === 1)
  ) {
    state.look.yaw -= deltaX * sensitivity;
    state.look.pitch = THREE.MathUtils.clamp(
      state.look.pitch - deltaY * sensitivity * 0.7,
      0.18,
      0.9,
    );
  }

  state.pointer.lastX = event.clientX;
  state.pointer.lastY = event.clientY;
}

function onScenePointerUp(event) {
  if (state.pointer.pointerId !== event.pointerId) {
    return;
  }

  if (!state.pointer.moved && state.gameState === GAME_STATES.EXPLORING) {
    tryInteractFromScreenPoint(event.clientX, event.clientY);
  }

  runtime.renderer.domElement.releasePointerCapture(event.pointerId);
  resetPointerDrag();
}

function onJoystickPointerDown(event) {
  state.joystick.active = true;
  state.joystick.pointerId = event.pointerId;
  ui.joystickArea.setPointerCapture(event.pointerId);
  updateJoystickFromEvent(event);
}

function onJoystickPointerMove(event) {
  if (!state.joystick.active || state.joystick.pointerId !== event.pointerId) {
    return;
  }

  updateJoystickFromEvent(event);
}

function onJoystickPointerUp(event) {
  if (state.joystick.pointerId !== event.pointerId) {
    return;
  }

  ui.joystickArea.releasePointerCapture(event.pointerId);
  resetJoystick();
}

function updateJoystickFromEvent(event) {
  const bounds = ui.joystickArea.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const offsetX = event.clientX - centerX;
  const offsetY = event.clientY - centerY;
  const distance = Math.hypot(offsetX, offsetY);
  const clampedDistance = Math.min(distance, JOYSTICK_RADIUS);
  const angle = Math.atan2(offsetY, offsetX);
  const x = (Math.cos(angle) * clampedDistance) / JOYSTICK_RADIUS;
  const y = (Math.sin(angle) * clampedDistance) / JOYSTICK_RADIUS;

  state.joystick.x = x;
  state.joystick.y = y;

  ui.joystickKnob.style.transform = `translate(calc(-50% + ${x * JOYSTICK_RADIUS}px), calc(-50% + ${y * JOYSTICK_RADIUS}px))`;
}

function resetJoystick() {
  state.joystick.active = false;
  state.joystick.pointerId = null;
  state.joystick.x = 0;
  state.joystick.y = 0;
  ui.joystickKnob.style.transform = "translate(-50%, -50%)";
}

function resetPointerDrag() {
  state.pointer.active = false;
  state.pointer.pointerId = null;
  state.pointer.moved = false;
}

function tryInteractFromScreenPoint(clientX, clientY) {
  const rect = runtime.renderer.domElement.getBoundingClientRect();
  runtime.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  runtime.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  runtime.raycaster.setFromCamera(runtime.pointerNdc, runtime.camera);
  const roots = Array.from(runtime.animalObjects.values()).map((entry) => entry.root);
  const intersections = runtime.raycaster.intersectObjects(roots, true);

  const match = intersections
    .map((hit) => findAnimalIdFromObject(hit.object))
    .find(Boolean);

  if (!match) {
    return;
  }

  const animal = animals.find((entry) => entry.id === match);
  if (animal && isAnimalNearby(animal)) {
    openAnimalPanel(animal);
  }
}

function findAnimalIdFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData?.animalId) {
      return current.userData.animalId;
    }
    current = current.parent;
  }

  return null;
}

function openAnimalPanel(animal) {
  state.currentAnimalId = animal.id;
  state.gameState = GAME_STATES.INTERACTING;

  ui.panelTitle.textContent = `${animal.emoji} ${animal.name} the ${animal.species}`;
  ui.panelKicker.textContent = `${animal.name}'s Questions`;
  ui.responseArea.textContent = `Choose a button to learn one cool thing about ${animal.name}.`;
  ui.interactionButtons.innerHTML = "";

  animal.interactions.forEach((interaction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `interaction-button${interaction.learning ? " is-learning" : ""}`;
    button.textContent = interaction.label;
    button.addEventListener("click", () => handleInteraction(animal, interaction));
    ui.interactionButtons.appendChild(button);
  });

  ui.panelBackdrop.classList.remove("hidden");
}

function closeAnimalPanel() {
  if (!state.currentAnimalId) {
    return;
  }

  state.currentAnimalId = null;
  ui.panelBackdrop.classList.add("hidden");

  if (!state.activePopup) {
    state.gameState = GAME_STATES.EXPLORING;
  }
}

function handleInteraction(animal, interaction) {
  ui.responseArea.textContent = interaction.response;

  if (!interaction.learning || animal.learned) {
    return;
  }

  animal.learned = true;
  state.learnedAnimals.add(animal.id);

  if (state.learnedAnimals.size === animals.length && !state.hasCompleted) {
    state.pendingCompletion = true;
    state.hasCompleted = true;
  }

  updateProgress();
  showRewardPopup(animal);
}

function showRewardPopup(animal) {
  clearTimeout(state.popupTimer);
  state.activePopup = "reward";
  state.gameState = GAME_STATES.POPUP;

  ui.popupBackdrop.classList.remove("hidden");
  ui.completionPopup.classList.add("hidden");
  ui.rewardPopup.classList.remove("hidden");
  ui.rewardTitle.textContent = `You learned something about ${animal.name}!`;
  ui.rewardMessage.textContent = `${animal.emoji} Fact Unlocked!`;
  ui.rewardClose.textContent = state.pendingCompletion ? "See Result" : "Keep Exploring";

  state.popupTimer = window.setTimeout(() => {
    if (state.activePopup === "reward") {
      dismissPopup();
    }
  }, 2400);
}

function showCompletionPopup() {
  clearTimeout(state.popupTimer);
  state.activePopup = "completion";
  state.gameState = GAME_STATES.COMPLETED;

  ui.popupBackdrop.classList.remove("hidden");
  ui.rewardPopup.classList.add("hidden");
  ui.completionPopup.classList.remove("hidden");
  ui.completionMessage.textContent = `${state.learnedAnimals.size} Animals discovered!`;
}

function dismissPopup() {
  clearTimeout(state.popupTimer);

  if (state.activePopup === "reward" && state.pendingCompletion) {
    state.pendingCompletion = false;
    showCompletionPopup();
    return;
  }

  if (state.activePopup === "completion") {
    ui.completionPopup.classList.add("hidden");
    ui.popupBackdrop.classList.add("hidden");
    state.activePopup = null;
    closeAnimalPanel();
    state.gameState = GAME_STATES.EXPLORING;
    return;
  }

  ui.rewardPopup.classList.add("hidden");
  ui.popupBackdrop.classList.add("hidden");
  state.activePopup = null;
  state.gameState = state.currentAnimalId
    ? GAME_STATES.INTERACTING
    : GAME_STATES.EXPLORING;
}

function updateProgress() {
  ui.progressCount.textContent = `${state.learnedAnimals.size} / ${animals.length}`;

  animals.forEach((animal) => {
    const marker = runtime.mapMarkers.get(animal.id);
    if (!marker) {
      return;
    }
    marker.classList.toggle("is-learned", state.learnedAnimals.has(animal.id));
  });
}

function updateTouchControls() {
  const showTouchControls = state.isTouchDevice || window.innerWidth < 820;
  ui.touchControls.classList.toggle("hidden", !showTouchControls);
  ui.controlHint.textContent = showTouchControls
    ? "Use the move pad and swipe the zoo to look around."
    : "WASD or arrow keys to move. Drag to look around.";
}

function animate(timestamp) {
  requestAnimationFrame(animate);

  runtime.timer.update(timestamp);
  const delta = Math.min(runtime.timer.getDelta(), 0.05);
  const elapsed = runtime.timer.getElapsed();

  updateMovement(delta);
  updateCamera(delta);
  updateAnimals(elapsed);
  updateNearestAnimal();
  updateMinimap();
  updateInteractionHint();

  runtime.renderer.render(runtime.scene, runtime.camera);
}

function updateMovement(delta) {
  if (state.gameState !== GAME_STATES.EXPLORING) {
    runtime.player.position.copy(state.playerPosition);
    return;
  }

  const horizontal =
    (state.keyboard.right ? 1 : 0) -
    (state.keyboard.left ? 1 : 0) +
    state.joystick.x;
  const vertical =
    (state.keyboard.forward ? 1 : 0) -
    (state.keyboard.back ? 1 : 0) -
    state.joystick.y;

  const inputLength = Math.hypot(horizontal, vertical);
  if (inputLength > 0.01) {
    const moveX = horizontal / Math.max(1, inputLength);
    const moveZ = vertical / Math.max(1, inputLength);
    const forward = new THREE.Vector3(
      -Math.sin(state.look.yaw),
      0,
      -Math.cos(state.look.yaw),
    );
    const right = new THREE.Vector3(
      Math.cos(state.look.yaw),
      0,
      -Math.sin(state.look.yaw),
    );

    runtime.tempVector
      .copy(forward)
      .multiplyScalar(moveZ)
      .addScaledVector(right, moveX)
      .normalize();

    state.playerPosition.addScaledVector(runtime.tempVector, PLAYER_SPEED * delta);
    state.playerPosition.x = THREE.MathUtils.clamp(
      state.playerPosition.x,
      -WORLD_HALF_SIZE + 2.5,
      WORLD_HALF_SIZE - 2.5,
    );
    state.playerPosition.z = THREE.MathUtils.clamp(
      state.playerPosition.z,
      -WORLD_HALF_SIZE + 2.5,
      WORLD_HALF_SIZE - 2.5,
    );

    const targetRotation = Math.atan2(runtime.tempVector.x, runtime.tempVector.z);
    runtime.player.rotation.y = dampAngle(
      runtime.player.rotation.y,
      targetRotation,
      10,
      delta,
    );
  }

  runtime.player.position.copy(state.playerPosition);
}

function updateCamera(delta) {
  const forward = runtime.tempVector2.set(
    -Math.sin(state.look.yaw),
    0,
    -Math.cos(state.look.yaw),
  );
  const horizontalDistance = CAMERA_DISTANCE * Math.cos(state.look.pitch);
  const verticalDistance = CAMERA_HEIGHT + CAMERA_DISTANCE * Math.sin(state.look.pitch);

  runtime.targetCameraPosition
    .copy(state.playerPosition)
    .addScaledVector(forward, -horizontalDistance)
    .add(new THREE.Vector3(0, verticalDistance, 0));

  const alpha = 1 - Math.exp(-CAMERA_SMOOTHING * delta);
  runtime.camera.position.lerp(runtime.targetCameraPosition, alpha);

  const lookTarget = new THREE.Vector3(
    state.playerPosition.x + forward.x * 2.4,
    1.65,
    state.playerPosition.z + forward.z * 2.4,
  );
  runtime.camera.lookAt(lookTarget);
}

function updateAnimals(elapsed) {
  animals.forEach((animal) => {
    const object = runtime.animalObjects.get(animal.id);
    if (!object) {
      return;
    }

    const bob = Math.sin(elapsed * 1.7 + object.bobOffset) * 0.06;
    object.root.position.y = object.baseY + bob;
    object.label.position.y = 3.9 + Math.sin(elapsed * 2.4 + object.bobOffset) * 0.14;

    const targetHighlight =
      state.nearestAnimalId === animal.id && state.gameState === GAME_STATES.EXPLORING
        ? 1
        : 0;
    object.highlight = THREE.MathUtils.lerp(object.highlight, targetHighlight, 0.12);
    object.zone.material.opacity = 0.28 + object.highlight * 0.26;
    object.zone.scale.setScalar(1 + object.highlight * 0.05);

    object.materials.forEach((material) => {
      if ("emissiveIntensity" in material) {
        material.emissiveIntensity = 0.05 + object.highlight * 0.18;
      }
    });
  });
}

function updateNearestAnimal() {
  let nearestId = null;
  let nearestDistance = Infinity;

  animals.forEach((animal) => {
    const distance = distanceToAnimal(animal);
    if (distance < nearestDistance) {
      nearestId = animal.id;
      nearestDistance = distance;
    }
  });

  state.nearestAnimalId =
    nearestDistance <= INTERACTION_DISTANCE ? nearestId : null;

  animals.forEach((animal) => {
    const marker = runtime.mapMarkers.get(animal.id);
    if (!marker) {
      return;
    }
    marker.classList.toggle("is-near", state.nearestAnimalId === animal.id);
  });
}

function updateMinimap() {
  const position = worldToMap(state.playerPosition.x, state.playerPosition.z);
  ui.mapPlayer.style.left = `${position.x}%`;
  ui.mapPlayer.style.top = `${position.y}%`;
}

function updateInteractionHint() {
  const shouldShow =
    state.nearestAnimalId &&
    state.gameState === GAME_STATES.EXPLORING &&
    !state.activePopup &&
    !state.currentAnimalId;

  if (!shouldShow) {
    ui.interactionHint.classList.add("hidden");
    return;
  }

  const object = runtime.animalObjects.get(state.nearestAnimalId);
  const screenPosition = object.root.localToWorld(new THREE.Vector3(0, 3.1, 0));
  screenPosition.project(runtime.camera);

  if (screenPosition.z < -1 || screenPosition.z > 1) {
    ui.interactionHint.classList.add("hidden");
    return;
  }

  const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;

  ui.interactionHint.style.left = `${x}px`;
  ui.interactionHint.style.top = `${y}px`;
  ui.interactionHint.classList.remove("hidden");
}

function distanceToAnimal(animal) {
  const dx = state.playerPosition.x - animal.position.x;
  const dz = state.playerPosition.z - animal.position.z;
  return Math.hypot(dx, dz);
}

function isAnimalNearby(animal) {
  return distanceToAnimal(animal) <= INTERACTION_DISTANCE;
}

function worldToMap(x, z) {
  return {
    x: ((x + WORLD_HALF_SIZE) / (WORLD_HALF_SIZE * 2)) * 100,
    y: ((z + WORLD_HALF_SIZE) / (WORLD_HALF_SIZE * 2)) * 100,
  };
}

function dampAngle(current, target, smoothing, delta) {
  let difference = target - current;
  difference = Math.atan2(Math.sin(difference), Math.cos(difference));
  return current + difference * (1 - Math.exp(-smoothing * delta));
}

function collectMaterials(group) {
  const materials = [];
  group.traverse((child) => {
    if (child.material) {
      materials.push(child.material);
    }
  });
  return materials;
}

function tagAnimal(object, animalId) {
  object.userData.animalId = animalId;
}

function createLabelSprite(text, options) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 220;
  const context = canvas.getContext("2d");

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawRoundedRect(
    context,
    18,
    22,
    canvas.width - 36,
    canvas.height - 44,
    44,
    options.background,
    options.border,
  );
  context.fillStyle = options.textColor;
  context.font = `700 ${options.fontSize}px "Trebuchet MS", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  return new THREE.Sprite(material);
}

function drawRoundedRect(context, x, y, width, height, radius, fillStyle, strokeStyle) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
  context.lineWidth = 10;
  context.strokeStyle = strokeStyle;
  context.stroke();
}
