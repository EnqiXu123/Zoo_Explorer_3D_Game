import * as THREE from "three";

const SHADOW_FLAGS = {
  castShadow: true,
  receiveShadow: true,
};

function createMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.9,
    metalness: options.metalness ?? 0.02,
    emissive: options.emissive ?? color,
    emissiveIntensity: options.emissiveIntensity ?? 0.02,
    flatShading: options.flatShading ?? true,
    side: options.side ?? THREE.FrontSide,
  });
}

function createMesh(geometry, material) {
  const mesh = new THREE.Mesh(geometry, material);
  Object.assign(mesh, SHADOW_FLAGS);
  return mesh;
}

function createEye(eyeMaterial, highlightMaterial) {
  const eye = new THREE.Group();

  const pupil = createMesh(
    new THREE.SphereGeometry(0.06, 6, 6),
    eyeMaterial,
  );
  pupil.scale.set(0.88, 1, 0.54);
  eye.add(pupil);

  const highlight = createMesh(
    new THREE.SphereGeometry(0.015, 4, 4),
    highlightMaterial,
  );
  highlight.position.set(0.02, 0.02, 0.02);
  eye.add(highlight);

  return eye;
}

function createSmile(mouthMaterial) {
  const smile = new THREE.Group();

  const left = createMesh(
    new THREE.BoxGeometry(0.055, 0.02, 0.03),
    mouthMaterial,
  );
  left.position.set(-0.028, 0, 0);
  left.rotation.z = -0.32;
  smile.add(left);

  const center = createMesh(
    new THREE.BoxGeometry(0.06, 0.024, 0.03),
    mouthMaterial,
  );
  smile.add(center);

  const right = createMesh(
    new THREE.BoxGeometry(0.055, 0.02, 0.03),
    mouthMaterial,
  );
  right.position.set(0.028, 0, 0);
  right.rotation.z = 0.32;
  smile.add(right);

  return smile;
}

function createBoot(bootMaterial, soleMaterial) {
  const boot = new THREE.Group();

  const upper = createMesh(
    new THREE.DodecahedronGeometry(0.2, 0),
    bootMaterial,
  );
  upper.scale.set(1.08, 0.9, 1.28);
  upper.position.set(0, 0.02, 0.12);
  boot.add(upper);

  const sole = createMesh(
    new THREE.BoxGeometry(0.42, 0.1, 0.68),
    soleMaterial,
  );
  sole.position.set(0, -0.12, 0.15);
  boot.add(sole);

  const tongue = createMesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.24),
    createMaterial(0xc49a68, {
      emissive: 0x6f512e,
      emissiveIntensity: 0.02,
    }),
  );
  tongue.position.set(0, 0.08, 0.08);
  boot.add(tongue);

  return boot;
}

function createArm(sleeveMaterial, skinMaterial) {
  const arm = new THREE.Group();

  const sleeve = createMesh(
    new THREE.CylinderGeometry(0.11, 0.13, 0.2, 6),
    sleeveMaterial,
  );
  sleeve.position.y = -0.12;
  arm.add(sleeve);

  const upperArm = createMesh(
    new THREE.CylinderGeometry(0.09, 0.11, 0.42, 6),
    skinMaterial,
  );
  upperArm.position.y = -0.38;
  arm.add(upperArm);

  const forearm = createMesh(
    new THREE.CylinderGeometry(0.085, 0.095, 0.36, 6),
    skinMaterial,
  );
  forearm.position.y = -0.78;
  arm.add(forearm);

  const hand = createMesh(
    new THREE.SphereGeometry(0.11, 6, 6),
    skinMaterial,
  );
  hand.scale.set(0.92, 1, 0.82);
  hand.position.y = -1.04;
  arm.add(hand);

  return arm;
}

function createLeg(shortsMaterial, skinMaterial, sockMaterial, bootMaterial, soleMaterial) {
  const leg = new THREE.Group();

  const shortsHem = createMesh(
    new THREE.CylinderGeometry(0.15, 0.16, 0.18, 6),
    shortsMaterial,
  );
  shortsHem.position.y = -0.12;
  leg.add(shortsHem);

  const thigh = createMesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.54, 6),
    skinMaterial,
  );
  thigh.position.y = -0.48;
  leg.add(thigh);

  const shin = createMesh(
    new THREE.CylinderGeometry(0.11, 0.12, 0.5, 6),
    skinMaterial,
  );
  shin.position.y = -0.96;
  leg.add(shin);

  const sock = createMesh(
    new THREE.CylinderGeometry(0.12, 0.13, 0.16, 6),
    sockMaterial,
  );
  sock.position.y = -1.31;
  leg.add(sock);

  const boot = createBoot(bootMaterial, soleMaterial);
  boot.position.y = -1.57;
  leg.add(boot);

  return leg;
}

function createHat(hatMaterial, bandMaterial) {
  const hat = new THREE.Group();

  const brim = createMesh(
    new THREE.CylinderGeometry(0.52, 0.6, 0.09, 10),
    hatMaterial,
  );
  brim.position.y = 0.06;
  hat.add(brim);

  const crown = createMesh(
    new THREE.DodecahedronGeometry(0.43, 0),
    hatMaterial,
  );
  crown.scale.set(1.02, 0.72, 0.96);
  crown.position.y = 0.34;
  hat.add(crown);

  const band = createMesh(
    new THREE.CylinderGeometry(0.41, 0.45, 0.08, 10),
    bandMaterial,
  );
  band.position.y = 0.23;
  hat.add(band);

  const topButton = createMesh(
    new THREE.DodecahedronGeometry(0.05, 0),
    bandMaterial,
  );
  topButton.position.y = 0.62;
  hat.add(topButton);

  return hat;
}

function createBackpack(packMaterial, strapMaterial, bedrollMaterial) {
  const backpack = new THREE.Group();

  const pack = createMesh(
    new THREE.BoxGeometry(0.56, 0.72, 0.32),
    packMaterial,
  );
  pack.position.set(-0.02, 0, -0.02);
  backpack.add(pack);

  const top = createMesh(
    new THREE.DodecahedronGeometry(0.23, 0),
    packMaterial,
  );
  top.scale.set(1.22, 0.66, 0.92);
  top.position.set(0, 0.42, -0.02);
  backpack.add(top);

  const pocket = createMesh(
    new THREE.BoxGeometry(0.34, 0.24, 0.18),
    packMaterial,
  );
  pocket.position.set(0, -0.2, 0.14);
  backpack.add(pocket);

  const bedroll = createMesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.5, 6),
    bedrollMaterial,
  );
  bedroll.rotation.z = Math.PI * 0.5;
  bedroll.position.set(-0.16, 0.36, -0.16);
  backpack.add(bedroll);

  const leftStrap = createMesh(
    new THREE.BoxGeometry(0.08, 0.86, 0.1),
    strapMaterial,
  );
  leftStrap.position.set(0.24, -0.02, 0.08);
  leftStrap.rotation.z = 0.08;
  backpack.add(leftStrap);

  const rightStrap = createMesh(
    new THREE.BoxGeometry(0.08, 0.86, 0.1),
    strapMaterial,
  );
  rightStrap.position.set(-0.24, -0.02, 0.08);
  rightStrap.rotation.z = -0.08;
  backpack.add(rightStrap);

  return backpack;
}

export function createExplorerCharacter() {
  const explorer = new THREE.Group();
  explorer.name = "ExplorerCharacter";
  explorer.userData.role = "Explorer";

  // The reusable root sits at ground level between both boots.
  const rig = new THREE.Group();
  rig.position.y = 0.64;
  explorer.add(rig);

  const skinMaterial = createMaterial(0xf0c39c, {
    emissive: 0xaa6f49,
    emissiveIntensity: 0.02,
  });
  const shirtMaterial = createMaterial(0xd9c296, {
    emissive: 0x7c623c,
    emissiveIntensity: 0.02,
  });
  const shortsMaterial = createMaterial(0xc9b27d, {
    emissive: 0x6d5630,
    emissiveIntensity: 0.02,
  });
  const hatMaterial = createMaterial(0xe1c99f, {
    emissive: 0x81643f,
    emissiveIntensity: 0.02,
  });
  const hatBandMaterial = createMaterial(0x8d6941, {
    emissive: 0x4b321a,
    emissiveIntensity: 0.025,
  });
  const packMaterial = createMaterial(0x6e7b43, {
    emissive: 0x30401f,
    emissiveIntensity: 0.025,
  });
  const strapMaterial = createMaterial(0x49562e, {
    emissive: 0x202a12,
    emissiveIntensity: 0.02,
  });
  const bootMaterial = createMaterial(0x8d5b33, {
    emissive: 0x452513,
    emissiveIntensity: 0.03,
  });
  const soleMaterial = createMaterial(0x33251a, {
    emissive: 0x17100a,
    emissiveIntensity: 0.02,
  });
  const sockMaterial = createMaterial(0xf4eee4, {
    emissive: 0xb2a799,
    emissiveIntensity: 0.01,
  });
  const hairMaterial = createMaterial(0x5f341d, {
    emissive: 0x2e170c,
    emissiveIntensity: 0.02,
  });
  const eyeMaterial = createMaterial(0x1a120d, {
    roughness: 0.24,
    emissive: 0x080706,
    emissiveIntensity: 0.05,
    flatShading: false,
  });
  const highlightMaterial = createMaterial(0xffffff, {
    roughness: 0.18,
    emissive: 0xffffff,
    emissiveIntensity: 0.08,
    flatShading: false,
  });
  const mouthMaterial = createMaterial(0x8f4f36, {
    roughness: 0.34,
    emissive: 0x4b2519,
    emissiveIntensity: 0.02,
    flatShading: false,
  });

  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 1.28;
  rig.add(bodyPivot);

  const torso = createMesh(
    new THREE.DodecahedronGeometry(0.5, 0),
    shirtMaterial,
  );
  torso.scale.set(1.18, 1.16, 0.82);
  torso.position.y = 0.18;
  bodyPivot.add(torso);

  const shorts = createMesh(
    new THREE.BoxGeometry(1.04, 0.34, 0.76),
    shortsMaterial,
  );
  shorts.position.set(0, -0.32, 0);
  bodyPivot.add(shorts);

  const belt = createMesh(
    new THREE.BoxGeometry(1.08, 0.08, 0.8),
    hatBandMaterial,
  );
  belt.position.set(0, -0.14, 0);
  bodyPivot.add(belt);

  const buckle = createMesh(
    new THREE.BoxGeometry(0.14, 0.12, 0.06),
    sockMaterial,
  );
  buckle.position.set(0.16, -0.14, 0.39);
  bodyPivot.add(buckle);

  const backpackPivot = new THREE.Group();
  backpackPivot.position.set(0, 0.14, -0.42);
  bodyPivot.add(backpackPivot);
  const backpack = createBackpack(packMaterial, strapMaterial, shirtMaterial);
  backpack.rotation.x = -0.04;
  backpackPivot.add(backpack);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.98, 0.04);
  bodyPivot.add(headPivot);

  const head = createMesh(
    new THREE.DodecahedronGeometry(0.44, 0),
    skinMaterial,
  );
  head.scale.set(1.08, 1.06, 0.98);
  headPivot.add(head);

  const hairFrontLeft = createMesh(
    new THREE.DodecahedronGeometry(0.14, 0),
    hairMaterial,
  );
  hairFrontLeft.scale.set(1, 0.66, 0.78);
  hairFrontLeft.position.set(-0.18, 0.05, 0.26);
  hairFrontLeft.rotation.z = -0.18;
  headPivot.add(hairFrontLeft);

  const hairFrontCenter = createMesh(
    new THREE.DodecahedronGeometry(0.12, 0),
    hairMaterial,
  );
  hairFrontCenter.scale.set(0.94, 0.7, 0.72);
  hairFrontCenter.position.set(0, 0.08, 0.28);
  headPivot.add(hairFrontCenter);

  const hairFrontRight = createMesh(
    new THREE.DodecahedronGeometry(0.14, 0),
    hairMaterial,
  );
  hairFrontRight.scale.set(1, 0.66, 0.78);
  hairFrontRight.position.set(0.18, 0.05, 0.26);
  hairFrontRight.rotation.z = 0.18;
  headPivot.add(hairFrontRight);

  const hat = createHat(hatMaterial, hatBandMaterial);
  hat.position.y = 0.2;
  headPivot.add(hat);

  const leftEye = createEye(eyeMaterial, highlightMaterial);
  leftEye.position.set(-0.14, 0.02, 0.38);
  headPivot.add(leftEye);

  const rightEye = createEye(eyeMaterial, highlightMaterial);
  rightEye.position.set(0.14, 0.02, 0.38);
  headPivot.add(rightEye);

  const smile = createSmile(mouthMaterial);
  smile.position.set(0, -0.16, 0.39);
  headPivot.add(smile);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.48, 0.54, 0);
  bodyPivot.add(leftArmPivot);
  const leftArm = createArm(shirtMaterial, skinMaterial);
  leftArm.rotation.z = 0.1;
  leftArmPivot.add(leftArm);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.48, 0.54, 0);
  bodyPivot.add(rightArmPivot);
  const rightArm = createArm(shirtMaterial, skinMaterial);
  rightArm.rotation.z = -0.1;
  rightArmPivot.add(rightArm);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.22, 1.12, 0);
  rig.add(leftLegPivot);
  const leftLeg = createLeg(
    shortsMaterial,
    skinMaterial,
    sockMaterial,
    bootMaterial,
    soleMaterial,
  );
  leftLegPivot.add(leftLeg);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.22, 1.12, 0);
  rig.add(rightLegPivot);
  const rightLeg = createLeg(
    shortsMaterial,
    skinMaterial,
    sockMaterial,
    bootMaterial,
    soleMaterial,
  );
  rightLegPivot.add(rightLeg);

  const lookTarget = new THREE.Group();
  lookTarget.position.set(0, 2.24, 0.06);
  rig.add(lookTarget);

  explorer.userData.lookTarget = lookTarget;
  explorer.userData.animation = {
    rig,
    bodyPivot,
    headPivot,
    backpackPivot,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    base: {
      rigY: rig.position.y,
      bodyY: bodyPivot.position.y,
      bodyX: bodyPivot.rotation.x,
      bodyZ: bodyPivot.rotation.z,
      headX: headPivot.rotation.x,
      headZ: headPivot.rotation.z,
      backpackX: backpackPivot.rotation.x,
      backpackZ: backpackPivot.rotation.z,
      leftArmX: leftArmPivot.rotation.x,
      rightArmX: rightArmPivot.rotation.x,
      leftLegX: leftLegPivot.rotation.x,
      rightLegX: rightLegPivot.rotation.x,
    },
    moveBlend: 0,
  };

  return explorer;
}

export function updateExplorerAnimation(character, time, isMoving) {
  const animation = character?.userData?.animation;

  if (!animation) {
    return;
  }

  const targetBlend = isMoving ? 1 : 0;
  animation.moveBlend = THREE.MathUtils.lerp(
    animation.moveBlend,
    targetBlend,
    isMoving ? 0.18 : 0.12,
  );

  const walk = Math.sin(time * 8.4);
  const walkAbs = Math.abs(walk);
  const idleSway = Math.sin(time * 1.5) * 0.015;
  const bounce = walkAbs * 0.045 * animation.moveBlend;
  const lean = -0.14 * animation.moveBlend;
  const armSwing = walk * 0.58 * animation.moveBlend;
  const legSwing = walk * 0.48 * animation.moveBlend;

  animation.rig.position.y = animation.base.rigY + bounce;
  animation.bodyPivot.position.y =
    animation.base.bodyY + bounce * 0.22;
  animation.bodyPivot.rotation.x =
    animation.base.bodyX + lean + walkAbs * 0.025 * animation.moveBlend;
  animation.bodyPivot.rotation.z =
    animation.base.bodyZ + idleSway * (1 - animation.moveBlend);

  animation.headPivot.rotation.x =
    animation.base.headX - walkAbs * 0.05 * animation.moveBlend;
  animation.headPivot.rotation.z =
    animation.base.headZ - idleSway * 0.8;

  animation.backpackPivot.rotation.x =
    animation.base.backpackX - walkAbs * 0.12 * animation.moveBlend;
  animation.backpackPivot.rotation.z =
    animation.base.backpackZ - walk * 0.08 * animation.moveBlend;

  animation.leftArmPivot.rotation.x =
    animation.base.leftArmX - armSwing - 0.12 * animation.moveBlend;
  animation.rightArmPivot.rotation.x =
    animation.base.rightArmX + armSwing - 0.12 * animation.moveBlend;

  animation.leftLegPivot.rotation.x =
    animation.base.leftLegX + legSwing;
  animation.rightLegPivot.rotation.x =
    animation.base.rightLegX - legSwing;
}
