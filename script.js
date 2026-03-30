import * as THREE from "three";
import {
  createLowPolyElephant,
  updateElephantAnimation,
} from "./low-poly-elephant.js";
import {
  createExplorerCharacter,
  updateExplorerAnimation,
} from "./low-poly-explorer.js";
import {
  createLowPolyLion,
  updateLionAnimation,
} from "./low-poly-lion.js";

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
    proximityRadius: 6.9,
    proximityHint: "Tap to meet Ellie",
    zoneColor: 0x9bc7ea,
    learned: false,
    interactions: [
      {
        id: "hello",
        label: "Say Hello",
        response: "Hi Explorer! My trunk says hello with a big swish.",
        learning: false,
      },
      {
        id: "trunk",
        label: "What can you do with your trunk?",
        response:
          "My trunk is super handy. I use it to smell, grab food, and splash water.",
        learning: true,
      },
      {
        id: "food",
        label: "What do you eat?",
        response: "I love munching plants like grass, leaves, bark, and juicy fruit.",
        learning: true,
      },
      {
        id: "fact",
        label: "Fun Fact",
        response: "Fun fact: I can use my trunk like a giant straw to drink water.",
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
    proximityRadius: 6.7,
    proximityHint: "Tap to meet Leo",
    zoneColor: 0xf0b36d,
    learned: false,
    interactions: [
      {
        id: "hello",
        label: "Say Hello",
        response: "Hello, Explorer! I give a proud roar and a calm tail swish.",
        learning: false,
      },
      {
        id: "home",
        label: "Where do you live?",
        response: "I live in sunny grasslands and open woodlands, mostly in Africa.",
        learning: true,
      },
      {
        id: "pride",
        label: "What is a pride?",
        response: "A pride is a lion family. We rest, protect cubs, and work together.",
        learning: true,
      },
      {
        id: "fact",
        label: "Fun Fact",
        response: "Fun fact: my roar can travel far across the savanna.",
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
  panelAvatar: document.querySelector("#panel-avatar"),
  panelTitle: document.querySelector("#panel-title"),
  panelKicker: document.querySelector("#panel-kicker"),
  panelIntro: document.querySelector("#panel-intro"),
  chatFeed: document.querySelector("#chat-feed"),
  interactionButtons: document.querySelector("#interaction-buttons"),
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
  chatTimer: null,
  playerMoving: false,
  panelBusy: false,
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
  playerLookTarget: null,
  animalObjects: new Map(),
  mapMarkers: new Map(),
  tempVector: new THREE.Vector3(),
  tempVector2: new THREE.Vector3(),
  tempVector3: new THREE.Vector3(),
  targetCameraPosition: new THREE.Vector3(),
  targetLookTarget: new THREE.Vector3(),
};

const ACTION_CARD_META = {
  elephant: {
    hello: {
      icon: "👋",
      title: "Say hello",
      note: "Wave to Ellie",
      prompt: "Hi Ellie!",
    },
    trunk: {
      icon: "🌀",
      title: "Ask about trunk",
      note: "What can it do?",
      prompt: "What can your trunk do?",
    },
    food: {
      icon: "🍉",
      title: "Feed Ellie",
      note: "Ask about snacks",
      prompt: "What do you like to eat?",
    },
    fact: {
      icon: "✨",
      title: "Fun fact",
      note: "Tell me something wow",
      prompt: "Tell me a fun fact!",
    },
  },
  lion: {
    hello: {
      icon: "👋",
      title: "Say hello",
      note: "Wave to Leo",
      prompt: "Hi Leo!",
    },
    home: {
      icon: "🌍",
      title: "Lion home",
      note: "Where do you live?",
      prompt: "Where do you live, Leo?",
    },
    pride: {
      icon: "🐾",
      title: "Ask about pride",
      note: "What is a pride?",
      prompt: "What is a pride?",
    },
    fact: {
      icon: "✨",
      title: "Fun fact",
      note: "Tell me something wow",
      prompt: "Tell me a fun fact!",
    },
  },
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
  const sunGroup = new THREE.Group();

  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(4.3, 20, 20),
    new THREE.MeshBasicMaterial({
      color: 0xfff0a8,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  sunGroup.add(sunGlow);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffef57 }),
  );
  sunGroup.add(sun);

  // Keep the sun lower and slightly closer to the zoo so it stays visible in
  // the default camera framing.
  sunGroup.position.set(-18, 16, -18);
  runtime.scene.add(sunGroup);
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
    const sceneConfig = getAnimalSceneConfig(animal.id);
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

    const group = new THREE.Group();
    const model = sceneConfig.createModel(animal);
    group.position.set(animal.position.x, 0, animal.position.z);
    group.rotation.y = animal.rotationY;
    tagAnimal(group, animal.id);
    group.add(model);
    group.add(createInteractionHitbox(animal.id));

    const hint = createAnimalHintSprite(animal, sceneConfig);
    hint.position.set(0, sceneConfig.hintBaseY, 0);
    hint.scale.set(3.75, 1.26, 1);
    hint.material.opacity = 0;
    hint.visible = false;
    group.add(hint);

    const glow = createAnimalGlowRing(animal.zoneColor);
    glow.position.y = 0.055;
    group.add(glow);

    runtime.scene.add(group);

    const label = createLabelSprite(`${animal.emoji} ${animal.name}`, {
      background: "#fff7dc",
      border: animal.id === "elephant" ? "#7ea8c9" : "#db8a34",
      textColor: "#214336",
      fontSize: 42,
    });
    label.position.set(0, sceneConfig.labelBaseY, 0);
    label.scale.set(4.2, 1.8, 1);
    group.add(label);

    runtime.animalObjects.set(animal.id, {
      root: group,
      model,
      zone,
      label,
      hint,
      glow,
      highlight: 0,
      proximityBlend: 0,
      proximityState: "idle",
      baseY: group.position.y,
      labelBaseY: sceneConfig.labelBaseY,
      hintBaseY: sceneConfig.hintBaseY,
      hintScaleX: 3.75,
      hintScaleY: 1.26,
      labelFloatAmplitude: sceneConfig.labelFloatAmplitude,
      rootBobAmplitude: sceneConfig.rootBobAmplitude,
      bobOffset: sceneConfig.bobOffset,
      animate: sceneConfig.animate,
      reactToPlayer: sceneConfig.reactToPlayer,
      materials: collectMaterials(model),
    });
  });
}

function createAnimalHintSprite(animal, sceneConfig) {
  return createLabelSprite(animal.proximityHint, {
    background: "#fff8e1",
    border: sceneConfig.hintBorder,
    textColor: "#214336",
    fontSize: 34,
  });
}

function createAnimalGlowRing(color) {
  const glow = new THREE.Group();

  const aura = new THREE.Mesh(
    new THREE.CircleGeometry(2.55, 28),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  aura.rotation.x = -Math.PI / 2;
  glow.add(aura);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.35, 2.95, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  glow.add(ring);

  glow.userData.aura = aura;
  glow.userData.ring = ring;
  return glow;
}

function createInteractionHitbox(animalId) {
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  let hitbox = null;

  if (animalId === "elephant") {
    hitbox = new THREE.Mesh(new THREE.BoxGeometry(5.8, 4, 3.3), material);
    hitbox.position.set(0, 1.95, 0);
  } else if (animalId === "lion") {
    // A wide box keeps the calm lion easy to tap on mobile without needing
    // precise contact on the mane or face.
    hitbox = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.35, 3.1), material);
    hitbox.position.set(0.35, 1.7, 0);
  } else {
    hitbox = new THREE.Mesh(new THREE.SphereGeometry(2.6, 18, 18), material);
    hitbox.position.set(0, 1.7, 0);
  }

  tagAnimal(hitbox, animalId);
  return hitbox;
}

function createSceneElephant(animal) {
  const elephant = createLowPolyElephant();

  // Turn the helper slightly toward the player so the face reads clearly in-game.
  elephant.rotation.y = Math.PI / 2 - 0.38;
  tagAnimalHierarchy(elephant, animal.id);

  return elephant;
}

function createSceneLion(animal) {
  const lion = createLowPolyLion();

  // Scale and angle the lion to feel balanced with the elephant and readable
  // from the game's default camera.
  lion.scale.setScalar(0.92);
  lion.rotation.y = Math.PI + 0.04;
  tagAnimalHierarchy(lion, animal.id);

  return lion;
}

function getAnimalSceneConfig(animalId) {
  if (animalId === "elephant") {
    return {
      createModel: createSceneElephant,
      labelBaseY: 4.7,
      hintBaseY: 4.7,
      hintBorder: "#7ea8c9",
      labelFloatAmplitude: 0.14,
      rootBobAmplitude: 0.02,
      bobOffset: 0,
      animate: updateElephantAnimation,
      reactToPlayer: applyElephantProximityReaction,
    };
  }

  if (animalId === "lion") {
    return {
      createModel: createSceneLion,
      labelBaseY: 4.15,
      hintBaseY: 4.15,
      hintBorder: "#db8a34",
      labelFloatAmplitude: 0.12,
      rootBobAmplitude: 0,
      bobOffset: 1.6,
      animate: updateLionAnimation,
      reactToPlayer: applyLionProximityReaction,
    };
  }

    return {
    createModel: () => new THREE.Group(),
    labelBaseY: 4,
    hintBaseY: 4,
    hintBorder: "#7ea8c9",
    labelFloatAmplitude: 0.14,
    rootBobAmplitude: 0.04,
    bobOffset: 0,
    animate: null,
    reactToPlayer: null,
  };
}

function addPlayer() {
  const player = createExplorerCharacter();

  player.position.copy(state.playerPosition);
  player.rotation.y = Math.PI;
  runtime.player = player;
  runtime.playerHead = player.userData.lookTarget ?? null;
  runtime.playerLookTarget = player.userData.lookTarget ?? null;
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
  clearChatTimer();
  state.panelBusy = false;
  state.currentAnimalId = animal.id;
  state.gameState = GAME_STATES.INTERACTING;

  ui.panelAvatar.textContent = animal.emoji;
  ui.panelTitle.textContent = `${animal.name} the ${animal.species}`;
  ui.panelKicker.textContent = "Safari Chat";
  ui.panelIntro.textContent = `Hi Explorer! I'm ${animal.name} ${animal.emoji}`;
  ui.chatFeed.innerHTML = "";
  appendChatMessage("animal", `Pick a card and I'll share something cool about being a ${animal.species.toLowerCase()}.`, {
    animal,
  });
  renderInteractionActions(animal);

  ui.panelBackdrop.classList.remove("hidden");
}

function closeAnimalPanel() {
  if (!state.currentAnimalId) {
    return;
  }

  clearChatTimer();
  state.panelBusy = false;
  state.currentAnimalId = null;
  ui.panelBackdrop.classList.add("hidden");

  if (!state.activePopup) {
    state.gameState = GAME_STATES.EXPLORING;
  }
}

function handleInteraction(animal, interaction) {
  if (state.panelBusy || state.currentAnimalId !== animal.id) {
    return;
  }

  const actionMeta = getInteractionCardMeta(animal, interaction);
  const shouldUnlockFact = interaction.learning && !animal.learned;
  state.panelBusy = true;
  renderInteractionActions(animal);

  appendChatMessage("explorer", actionMeta.prompt, { animal });
  const typingBubble = appendTypingMessage(animal);
  const panelAnimalId = animal.id;

  state.chatTimer = window.setTimeout(() => {
    state.chatTimer = null;

    if (state.currentAnimalId !== panelAnimalId) {
      return;
    }

    typingBubble.remove();
    appendChatMessage("animal", interaction.response, { animal });

    if (shouldUnlockFact) {
      appendChatBadge("You learned something new!");
      animal.learned = true;
      state.learnedAnimals.add(animal.id);

      if (state.learnedAnimals.size === animals.length && !state.hasCompleted) {
        state.pendingCompletion = true;
        state.hasCompleted = true;
      }

      updateProgress();
      showRewardPopup(animal);
    }

    state.panelBusy = false;
    renderInteractionActions(animal);
  }, 380);
}

function renderInteractionActions(animal) {
  ui.interactionButtons.innerHTML = "";

  animal.interactions.forEach((interaction) => {
    const actionMeta = getInteractionCardMeta(animal, interaction);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `interaction-button action-card${interaction.learning ? " is-learning" : ""}`;
    button.disabled = state.panelBusy;
    button.setAttribute("aria-label", actionMeta.title);
    button.addEventListener("click", () => handleInteraction(animal, interaction));

    const icon = document.createElement("span");
    icon.className = "action-card-icon";
    icon.textContent = actionMeta.icon;

    const text = document.createElement("span");
    text.className = "action-card-text";

    const title = document.createElement("span");
    title.className = "action-card-title";
    title.textContent = actionMeta.title;

    const note = document.createElement("span");
    note.className = "action-card-note";
    note.textContent = actionMeta.note;

    text.append(title, note);
    button.append(icon, text);
    ui.interactionButtons.appendChild(button);
  });
}

function getInteractionCardMeta(animal, interaction) {
  return (
    ACTION_CARD_META[animal.id]?.[interaction.id] ?? {
      icon: "✨",
      title: interaction.label,
      note: "Tap to chat",
      prompt: interaction.label,
    }
  );
}

function appendChatMessage(role, text, { animal } = {}) {
  const message = document.createElement("div");
  message.className = `chat-message chat-message-${role}`;

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  avatar.textContent = role === "animal" ? animal?.emoji ?? "🐾" : "🧭";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";

  const speaker = document.createElement("p");
  speaker.className = "chat-speaker";
  speaker.textContent = role === "animal" ? animal?.name ?? "Animal" : "Explorer";

  const copy = document.createElement("p");
  copy.className = "chat-copy";
  copy.textContent = text;

  bubble.append(speaker, copy);

  if (role === "explorer") {
    message.append(bubble, avatar);
  } else {
    message.append(avatar, bubble);
  }

  ui.chatFeed.appendChild(message);
  scrollChatFeedToBottom();
  return message;
}

function appendTypingMessage(animal) {
  const typing = document.createElement("div");
  typing.className = "chat-message chat-message-animal chat-message-typing";

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  avatar.textContent = animal.emoji;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble-typing";
  bubble.innerHTML = `
    <p class="chat-speaker">${animal.name}</p>
    <div class="typing-dots" aria-label="${animal.name} is thinking">
      <span></span><span></span><span></span>
    </div>
  `;

  typing.append(avatar, bubble);
  ui.chatFeed.appendChild(typing);
  scrollChatFeedToBottom();
  return typing;
}

function appendChatBadge(text) {
  const badge = document.createElement("div");
  badge.className = "chat-badge";
  badge.textContent = text;
  ui.chatFeed.appendChild(badge);
  scrollChatFeedToBottom();
  return badge;
}

function scrollChatFeedToBottom() {
  ui.chatFeed.scrollTop = ui.chatFeed.scrollHeight;
}

function clearChatTimer() {
  if (!state.chatTimer) {
    return;
  }

  window.clearTimeout(state.chatTimer);
  state.chatTimer = null;
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
  updateExplorer(elapsed);
  updateAnimalProximityStates();
  updateCamera(delta);
  updateAnimals(elapsed);
  updateMinimap();
  updateInteractionHint();

  runtime.renderer.render(runtime.scene, runtime.camera);
}

function updateMovement(delta) {
  if (state.gameState !== GAME_STATES.EXPLORING) {
    state.playerMoving = false;
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
  state.playerMoving = inputLength > 0.01;
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

function updateExplorer(elapsed) {
  if (!runtime.player) {
    return;
  }

  updateExplorerAnimation(runtime.player, elapsed, state.playerMoving);
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
    .addScaledVector(forward, -horizontalDistance);
  runtime.targetCameraPosition.y += verticalDistance;

  const alpha = 1 - Math.exp(-CAMERA_SMOOTHING * delta);
  runtime.camera.position.lerp(runtime.targetCameraPosition, alpha);

  const anchorY = runtime.playerLookTarget
    ? runtime.playerLookTarget.getWorldPosition(runtime.tempVector3).y
    : 1.85;

  runtime.targetLookTarget.set(
    state.playerPosition.x + forward.x * 1.95,
    anchorY,
    state.playerPosition.z + forward.z * 1.95,
  );
  runtime.camera.lookAt(runtime.targetLookTarget);
}

function updateAnimals(elapsed) {
  animals.forEach((animal) => {
    const object = runtime.animalObjects.get(animal.id);
    if (!object) {
      return;
    }

    const bob =
      Math.sin(elapsed * 1.7 + object.bobOffset) * object.rootBobAmplitude;
    object.root.position.y = object.baseY + bob;
    object.label.position.y =
      object.labelBaseY +
      Math.sin(elapsed * 2.4 + object.bobOffset) * object.labelFloatAmplitude;

    const highlightTarget =
      object.proximityState === "idle"
        ? 0
        : object.proximityState === "interacting"
          ? 1.16
          : 1;
    object.proximityBlend = THREE.MathUtils.lerp(
      object.proximityBlend,
      highlightTarget,
      object.proximityState === "idle" ? 0.1 : 0.16,
    );

    if (object.animate) {
      object.animate(object.model, elapsed + object.bobOffset);
    }

    if (object.reactToPlayer) {
      object.reactToPlayer({
        animal,
        object,
        elapsed,
        blend: object.proximityBlend,
      });
    }

    object.highlight = THREE.MathUtils.lerp(
      object.highlight,
      object.proximityBlend,
      0.12,
    );
    object.zone.material.opacity = 0.28 + object.highlight * 0.26;
    object.zone.scale.setScalar(1 + object.highlight * 0.05);

    const glowAura = object.glow.userData.aura;
    const glowRing = object.glow.userData.ring;
    const glowPulse = 1 + Math.sin(elapsed * 2.3 + object.bobOffset) * 0.03;
    object.glow.scale.setScalar(glowPulse + object.highlight * 0.035);
    glowAura.material.opacity = object.highlight * 0.16;
    glowRing.material.opacity = object.highlight * 0.24;

    const shouldShowHint =
      object.proximityState === "nearby" &&
      state.gameState === GAME_STATES.EXPLORING &&
      !state.activePopup &&
      !state.currentAnimalId;

    // Treat the animal label as a single shared bubble: either the default
    // name card or the proximity prompt, never both at once.
    object.label.visible = !shouldShowHint;
    object.hint.visible = shouldShowHint;

    object.hint.position.y =
      object.hintBaseY +
      Math.sin(elapsed * 3 + object.bobOffset) * 0.09 +
      object.proximityBlend * 0.08;
    object.hint.material.opacity = shouldShowHint
      ? THREE.MathUtils.clamp(0.24 + object.proximityBlend * 0.68, 0, 0.92)
      : 0;
    const hintScale = 1 + object.proximityBlend * 0.03;
    object.hint.scale.set(
      object.hintScaleX * hintScale,
      object.hintScaleY * hintScale,
      1,
    );

    object.materials.forEach(({ material, baseEmissiveIntensity }) => {
      if ("emissiveIntensity" in material) {
        material.emissiveIntensity = baseEmissiveIntensity + object.highlight * 0.18;
      }
    });
  });
}

function updateAnimalProximityStates() {
  let nearestId = null;
  let nearestDistance = Infinity;

  animals.forEach((animal) => {
    const distance = distanceToAnimal(animal);
    const object = runtime.animalObjects.get(animal.id);
    if (!object) {
      return;
    }

    object.distanceToPlayer = distance;
    const nextState = getAnimalProximityState(animal, distance);
    object.proximityState = nextState;

    if (nextState !== "idle" && distance < nearestDistance) {
      nearestId = animal.id;
      nearestDistance = distance;
    }
  });

  state.nearestAnimalId = nearestId;

  animals.forEach((animal) => {
    const marker = runtime.mapMarkers.get(animal.id);
    const object = runtime.animalObjects.get(animal.id);
    if (!marker) {
      return;
    }
    marker.classList.toggle("is-near", object?.proximityState !== "idle");
  });
}

function updateMinimap() {
  const position = worldToMap(state.playerPosition.x, state.playerPosition.z);
  ui.mapPlayer.style.left = `${position.x}%`;
  ui.mapPlayer.style.top = `${position.y}%`;
}

function updateInteractionHint() {
  ui.interactionHint.classList.add("hidden");
}

function distanceToAnimal(animal) {
  const dx = state.playerPosition.x - animal.position.x;
  const dz = state.playerPosition.z - animal.position.z;
  return Math.hypot(dx, dz);
}

function isAnimalNearby(animal) {
  return distanceToAnimal(animal) <= getAnimalProximityRadius(animal);
}

function getAnimalProximityRadius(animal) {
  return animal.proximityRadius ?? INTERACTION_DISTANCE;
}

function getAnimalProximityState(animal, distance) {
  if (state.currentAnimalId === animal.id) {
    return "interacting";
  }

  const isExploring = state.gameState === GAME_STATES.EXPLORING;
  if (isExploring && distance <= getAnimalProximityRadius(animal)) {
    return "nearby";
  }

  return "idle";
}

function applyElephantProximityReaction({ object, blend, elapsed }) {
  const animation = object.model.userData?.animation;
  if (!animation || blend <= 0.001) {
    return;
  }

  const playerLocal = object.model.worldToLocal(
    runtime.tempVector3.copy(state.playerPosition).setY(2.1),
  );
  const turnTarget = THREE.MathUtils.clamp(
    Math.atan2(playerLocal.z, Math.max(0.35, playerLocal.x)) * 0.5,
    -0.18,
    0.18,
  );
  const alertMotion = Math.sin(elapsed * 2.25 + object.bobOffset);
  const earFlutter = Math.sin(elapsed * 1.7 + 0.45) * 0.03 * blend;

  animation.headPivot.rotation.y = animation.base.headY + turnTarget * blend;
  animation.trunkBase.rotation.z += alertMotion * 0.028 * blend;
  animation.trunkMid.rotation.z += alertMotion * 0.055 * blend;
  animation.trunkTip.rotation.z += alertMotion * 0.085 * blend;
  animation.leftEar.rotation.y += earFlutter;
  animation.rightEar.rotation.y -= earFlutter;
}

function applyLionProximityReaction({ object, blend, elapsed }) {
  const animation = object.model.userData?.animation;
  if (!animation || blend <= 0.001) {
    return;
  }

  const playerLocal = object.model.worldToLocal(
    runtime.tempVector3.copy(state.playerPosition).setY(1.9),
  );
  const headTurn = THREE.MathUtils.clamp(
    Math.atan2(playerLocal.z, Math.max(0.4, playerLocal.x)) * 0.42,
    -0.16,
    0.16,
  );
  const tailWave = Math.sin(elapsed * 1.5 + 0.2) * blend;

  animation.headPivot.rotation.y += headTurn * blend;
  animation.headPivot.rotation.x -= 0.04 * blend;
  animation.manePivot.rotation.y += headTurn * 0.28 * blend;
  animation.tailBasePivot.rotation.z += tailWave * 0.09;
  animation.tailMidPivot.rotation.z += tailWave * 0.14;
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
  const seen = new Set();
  group.traverse((child) => {
    const childMaterials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    childMaterials.forEach((material) => {
      if (!material || seen.has(material)) {
        return;
      }

      seen.add(material);
      materials.push({
        material,
        baseEmissiveIntensity:
          "emissiveIntensity" in material ? material.emissiveIntensity : 0,
      });
    });
  });
  return materials;
}

function tagAnimal(object, animalId) {
  object.userData.animalId = animalId;
}

function tagAnimalHierarchy(root, animalId) {
  root.traverse((child) => {
    tagAnimal(child, animalId);
  });
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
