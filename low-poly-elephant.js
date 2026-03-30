import * as THREE from "three";

const SHADOW_FLAGS = {
  castShadow: true,
  receiveShadow: true,
};

function createMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.94,
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

function createLeg(skinMaterial, footMaterial, x, z) {
  const leg = new THREE.Group();
  leg.position.set(x, 0, z);

  const upperLeg = createMesh(
    new THREE.CylinderGeometry(0.34, 0.48, 2.1, 6),
    skinMaterial,
  );
  upperLeg.position.y = 1.05;
  leg.add(upperLeg);

  const ankle = createMesh(
    new THREE.CylinderGeometry(0.42, 0.5, 0.28, 6),
    footMaterial,
  );
  ankle.position.y = 0.15;
  leg.add(ankle);

  return leg;
}

function createEar(outerMaterial, innerMaterial, side) {
  const ear = new THREE.Group();

  const outerEar = createMesh(
    new THREE.CircleGeometry(0.92, 12),
    outerMaterial,
  );
  outerEar.rotation.y = side * Math.PI * 0.5;
  ear.add(outerEar);

  const innerEar = createMesh(
    new THREE.CircleGeometry(0.72, 12),
    innerMaterial,
  );
  // Offset the inner ear along the ear normal so it does not z-fight the outer ear.
  innerEar.position.x = side * 0.045;
  innerEar.rotation.y = side * Math.PI * 0.5;
  ear.add(innerEar);

  return ear;
}

function createEye(pupilMaterial, highlightMaterial) {
  const eye = new THREE.Group();

  const pupil = createMesh(
    new THREE.SphereGeometry(0.1, 6, 6),
    pupilMaterial,
  );
  pupil.scale.set(0.86, 0.98, 0.58);
  eye.add(pupil);

  const highlight = createMesh(
    new THREE.SphereGeometry(0.028, 5, 5),
    highlightMaterial,
  );
  highlight.position.set(0.04, 0.05, 0.03);
  eye.add(highlight);

  return eye;
}

function createTusk(zOffset, tuskMaterial) {
  const tusk = new THREE.Group();

  const root = new THREE.Group();
  root.position.set(0.5, -0.1, zOffset);
  root.rotation.set(0.16, Math.sign(zOffset) * 0.22, -Math.PI * 0.5 + 0.22);
  tusk.add(root);

  const shaft = createMesh(
    new THREE.CylinderGeometry(0.07, 0.16, 0.98, 6),
    tuskMaterial,
  );
  shaft.position.y = 0.49;
  root.add(shaft);

  const tip = createMesh(
    new THREE.ConeGeometry(0.085, 0.42, 6),
    tuskMaterial,
  );
  tip.position.y = 0.98;
  root.add(tip);

  return tusk;
}

export function createLowPolyElephant() {
  const elephant = new THREE.Group();
  elephant.name = "LowPolyElephant";

  // The outer group origin sits on the ground below the body center.
  const rig = new THREE.Group();
  rig.position.y = 0.04;
  elephant.add(rig);

  const skinLight = createMaterial(0xe8d4ca, {
    emissive: 0x8b766d,
    emissiveIntensity: 0.03,
  });
  const skinMid = createMaterial(0xcfb4aa, {
    emissive: 0x7f6b64,
    emissiveIntensity: 0.025,
  });
  const skinDark = createMaterial(0xb4958b, {
    emissive: 0x675650,
    emissiveIntensity: 0.02,
  });
  const earInner = createMaterial(0xaa9088, {
    emissive: 0x5e4e49,
    emissiveIntensity: 0.02,
    flatShading: false,
    side: THREE.DoubleSide,
  });
  const earOuter = createMaterial(0xd9c0b7, {
    emissive: 0x75635d,
    emissiveIntensity: 0.02,
    flatShading: false,
    side: THREE.DoubleSide,
  });
  const footMaterial = createMaterial(0xe4cec5, {
    emissive: 0x7b6861,
    emissiveIntensity: 0.02,
  });
  const tuskMaterial = createMaterial(0xf9f6ed, {
    roughness: 0.82,
    emissive: 0xb8b1a2,
    emissiveIntensity: 0.015,
  });
  const eyeMaterial = createMaterial(0x171315, {
    roughness: 0.25,
    emissive: 0x090708,
    emissiveIntensity: 0.04,
    flatShading: false,
  });
  const highlightMaterial = createMaterial(0xffffff, {
    roughness: 0.2,
    emissive: 0xffffff,
    emissiveIntensity: 0.12,
    flatShading: false,
  });
  const tailMaterial = createMaterial(0x987f76, {
    emissive: 0x5a4a45,
    emissiveIntensity: 0.02,
  });

  const body = createMesh(
    new THREE.SphereGeometry(1.34, 8, 6),
    skinLight,
  );
  body.scale.set(1.7, 1.18, 1.08);
  body.position.set(0, 2.28, 0);
  rig.add(body);

  const shoulders = createMesh(
    new THREE.SphereGeometry(0.96, 8, 6),
    skinMid,
  );
  shoulders.scale.set(1.18, 0.92, 0.96);
  shoulders.position.set(1.05, 2.42, 0);
  rig.add(shoulders);

  const rump = createMesh(
    new THREE.SphereGeometry(0.86, 7, 6),
    skinDark,
  );
  rump.scale.set(1.08, 0.84, 0.92);
  rump.position.set(-1.18, 2.12, 0);
  rig.add(rump);

  const belly = createMesh(
    new THREE.CylinderGeometry(0.92, 1.04, 1.7, 6),
    skinDark,
  );
  belly.rotation.z = Math.PI * 0.5;
  belly.scale.z = 0.88;
  belly.position.set(0.15, 1.55, 0);
  rig.add(belly);

  const headPivot = new THREE.Group();
  headPivot.position.set(2.15, 2.38, 0);
  headPivot.rotation.y = -0.78;
  headPivot.rotation.z = -0.02;
  rig.add(headPivot);

  const head = createMesh(
    new THREE.SphereGeometry(0.98, 8, 6),
    skinLight,
  );
  head.scale.set(1.22, 1.02, 0.94);
  headPivot.add(head);

  const cheek = createMesh(
    new THREE.SphereGeometry(0.52, 6, 5),
    skinMid,
  );
  cheek.scale.set(1.0, 0.82, 1.05);
  cheek.position.set(0.28, -0.42, 0);
  headPivot.add(cheek);

  const leftEar = createEar(earOuter, earInner, 1);
  leftEar.position.set(-0.22, 0.1, 0.96);
  leftEar.rotation.z = 0.16;
  leftEar.rotation.y = Math.PI * 0.55;
  headPivot.add(leftEar);

  const rightEar = createEar(earOuter, earInner, -1);
  rightEar.position.set(-0.22, 0.1, -0.96);
  rightEar.rotation.z = -0.16;
  rightEar.rotation.y = -Math.PI * 0.55;
  headPivot.add(rightEar);

  const leftEye = createEye(eyeMaterial, highlightMaterial);
  leftEye.position.set(1.01, 0.18, 0.18);
  headPivot.add(leftEye);

  const rightEye = createEye(eyeMaterial, highlightMaterial);
  rightEye.position.set(1.01, 0.18, -0.18);
  headPivot.add(rightEye);

  const leftTusk = createTusk(0.45, tuskMaterial);
  leftTusk.position.set(0.25, -0.38, 0);
  headPivot.add(leftTusk);

  const rightTusk = createTusk(-0.45, tuskMaterial);
  rightTusk.position.set(0.25, -0.38, 0);
  headPivot.add(rightTusk);

  const trunkBase = new THREE.Group();
  trunkBase.position.set(0.92, -0.02, 0);
  trunkBase.rotation.z = 0.04;
  headPivot.add(trunkBase);

  const upperTrunk = createMesh(
    new THREE.CylinderGeometry(0.27, 0.34, 0.74, 6),
    skinMid,
  );
  upperTrunk.position.y = -0.37;
  trunkBase.add(upperTrunk);

  const trunkMid = new THREE.Group();
  trunkMid.position.y = -0.68;
  trunkMid.rotation.z = 0.08;
  trunkBase.add(trunkMid);

  const middleTrunk = createMesh(
    new THREE.CylinderGeometry(0.21, 0.27, 0.74, 6),
    skinMid,
  );
  middleTrunk.position.y = -0.37;
  trunkMid.add(middleTrunk);

  const trunkTip = new THREE.Group();
  trunkTip.position.y = -0.7;
  trunkTip.rotation.z = -0.1;
  trunkMid.add(trunkTip);

  const lowerTrunk = createMesh(
    new THREE.CylinderGeometry(0.13, 0.19, 0.7, 5),
    skinDark,
  );
  lowerTrunk.position.y = -0.35;
  trunkTip.add(lowerTrunk);

  const trunkEnd = createMesh(
    new THREE.CylinderGeometry(0.1, 0.11, 0.22, 5),
    skinDark,
  );
  trunkEnd.position.y = -0.74;
  trunkTip.add(trunkEnd);

  const legs = [
    createLeg(skinMid, footMaterial, 1.05, 0.78),
    createLeg(skinMid, footMaterial, 1.05, -0.78),
    createLeg(skinDark, footMaterial, -1.1, 0.82),
    createLeg(skinDark, footMaterial, -1.1, -0.82),
  ];
  legs.forEach((leg) => rig.add(leg));

  const tailPivot = new THREE.Group();
  tailPivot.position.set(-2.28, 2.26, 0);
  tailPivot.rotation.z = -0.18;
  rig.add(tailPivot);

  const tail = createMesh(
    new THREE.CylinderGeometry(0.045, 0.07, 1.08, 5),
    tailMaterial,
  );
  tail.position.y = -0.54;
  tailPivot.add(tail);

  const tailTip = createMesh(
    new THREE.DodecahedronGeometry(0.15, 0),
    tailMaterial,
  );
  tailTip.scale.set(0.75, 1.1, 0.75);
  tailTip.position.y = -1.13;
  tailPivot.add(tailTip);

  elephant.userData.animation = {
    rig,
    headPivot,
    trunkBase,
    trunkMid,
    trunkTip,
    tailPivot,
    leftEar,
    rightEar,
    base: {
      rigY: rig.position.y,
      rigZ: rig.rotation.z,
      headX: headPivot.rotation.x,
      headY: headPivot.rotation.y,
      headZ: headPivot.rotation.z,
      trunkBaseZ: trunkBase.rotation.z,
      trunkMidZ: trunkMid.rotation.z,
      trunkTipZ: trunkTip.rotation.z,
      tailZ: tailPivot.rotation.z,
      leftEarY: leftEar.rotation.y,
      rightEarY: rightEar.rotation.y,
    },
  };

  return elephant;
}

export function updateElephantAnimation(elephant, time) {
  const animation = elephant?.userData?.animation;

  if (!animation) {
    return;
  }

  const sway = Math.sin(time * 1.25) * 0.045;
  const bob = Math.sin(time * 2.1) * 0.035;
  const headNod = Math.sin(time * 1.55 + 0.35) * 0.035;
  const trunkSwing = Math.sin(time * 1.7 - 0.15) * 0.1;
  const earSwing = Math.sin(time * 0.9 + 0.65) * 0.022;
  const tailSwing = Math.sin(time * 2.2) * 0.16;

  animation.rig.position.y = animation.base.rigY + bob;
  animation.rig.rotation.z = animation.base.rigZ + sway * 0.35;

  animation.headPivot.rotation.x = animation.base.headX + headNod;
  animation.headPivot.rotation.z = animation.base.headZ - sway * 0.55;

  animation.leftEar.rotation.y = animation.base.leftEarY + earSwing;
  animation.rightEar.rotation.y = animation.base.rightEarY - earSwing;

  animation.trunkBase.rotation.z = animation.base.trunkBaseZ + trunkSwing * 0.35;
  animation.trunkMid.rotation.z = animation.base.trunkMidZ + trunkSwing * 0.72;
  animation.trunkTip.rotation.z = animation.base.trunkTipZ + trunkSwing;

  animation.tailPivot.rotation.z = animation.base.tailZ + tailSwing;
}
