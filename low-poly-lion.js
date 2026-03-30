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
    new THREE.SphereGeometry(0.16, 6, 6),
    eyeMaterial,
  );
  pupil.scale.set(0.98, 1, 0.7);
  eye.add(pupil);

  const highlight = createMesh(
    new THREE.SphereGeometry(0.016, 5, 5),
    highlightMaterial,
  );
  highlight.position.set(0.03, 0.04, 0.03);
  eye.add(highlight);

  return eye;
}

function createEar(outerMaterial, innerMaterial, side) {
  const ear = new THREE.Group();

  const outer = createMesh(
    new THREE.SphereGeometry(0.21, 7, 6),
    outerMaterial,
  );
  outer.scale.set(1, 1.05, 0.72);
  ear.add(outer);

  const inner = createMesh(
    new THREE.SphereGeometry(0.11, 6, 6),
    innerMaterial,
  );
  inner.position.set(0.03, -0.01, side * 0.02);
  inner.scale.set(0.9, 0.9, 0.58);
  ear.add(inner);

  return ear;
}

function createLeg(legMaterial, pawMaterial, x, z, options = {}) {
  const leg = new THREE.Group();
  leg.position.set(x, 0, z);
  leg.rotation.z = options.leanZ ?? 0;

  const upperLeg = createMesh(
    new THREE.CylinderGeometry(0.22, 0.32, 1.58, 6),
    legMaterial,
  );
  upperLeg.position.y = 0.97;
  leg.add(upperLeg);

  const ankle = createMesh(
    new THREE.CylinderGeometry(0.27, 0.34, 0.28, 6),
    pawMaterial,
  );
  ankle.position.y = 0.18;
  leg.add(ankle);

  return leg;
}

function createManeClump(material, settings) {
  const clump = createMesh(
    new THREE.DodecahedronGeometry(settings.radius ?? 0.36, 0),
    material,
  );
  clump.position.set(settings.x, settings.y, settings.z);
  clump.scale.set(
    settings.scaleX ?? 1,
    settings.scaleY ?? 1,
    settings.scaleZ ?? 1,
  );
  clump.rotation.set(
    settings.rotateX ?? 0,
    settings.rotateY ?? 0,
    settings.rotateZ ?? 0,
  );
  return clump;
}

function addManeClumps(manePivot, maneDark, maneWarm) {
  // A small set of chunky clumps keeps the mane readable without being heavy.
  const clumps = [
    { x: -0.22, y: 0.76, z: 0, radius: 0.42, scaleX: 1.15, scaleY: 1, scaleZ: 0.92 },
    { x: -0.1, y: 0.4, z: 0.7, radius: 0.38, scaleX: 1.08, scaleY: 0.95, scaleZ: 0.82, rotateZ: 0.18 },
    { x: -0.1, y: 0.4, z: -0.7, radius: 0.38, scaleX: 1.08, scaleY: 0.95, scaleZ: 0.82, rotateZ: -0.18 },
    { x: 0.06, y: 0.02, z: 0.9, radius: 0.38, scaleX: 1.12, scaleY: 0.9, scaleZ: 0.78, rotateY: 0.2 },
    { x: 0.06, y: 0.02, z: -0.9, radius: 0.38, scaleX: 1.12, scaleY: 0.9, scaleZ: 0.78, rotateY: -0.2 },
    { x: -0.02, y: -0.42, z: 0.72, radius: 0.4, scaleX: 1.1, scaleY: 0.96, scaleZ: 0.84, rotateZ: 0.22 },
    { x: -0.02, y: -0.42, z: -0.72, radius: 0.4, scaleX: 1.1, scaleY: 0.96, scaleZ: 0.84, rotateZ: -0.22 },
    { x: 0.08, y: -0.78, z: 0, radius: 0.48, scaleX: 1.08, scaleY: 1.18, scaleZ: 0.94 },
    { x: -0.55, y: 0.18, z: 0.44, radius: 0.32, scaleX: 0.9, scaleY: 0.86, scaleZ: 0.82, rotateY: -0.38 },
    { x: -0.55, y: 0.18, z: -0.44, radius: 0.32, scaleX: 0.9, scaleY: 0.86, scaleZ: 0.82, rotateY: 0.38 },
  ];

  clumps.forEach((settings, index) => {
    const material = index % 3 === 0 ? maneWarm : maneDark;
    manePivot.add(createManeClump(material, settings));
  });
}

export function createLowPolyLion() {
  const lion = new THREE.Group();
  lion.name = "LowPolyLion";

  // The reusable root sits at ground level below the paws.
  const rig = new THREE.Group();
  rig.position.y = 0.03;
  lion.add(rig);

  const coatLight = createMaterial(0xf6c857, {
    emissive: 0xa96c16,
    emissiveIntensity: 0.026,
  });
  const coatMid = createMaterial(0xe8b640, {
    emissive: 0x915d14,
    emissiveIntensity: 0.024,
  });
  const coatShadow = createMaterial(0xc8912a, {
    emissive: 0x734611,
    emissiveIntensity: 0.02,
  });
  const maneDark = createMaterial(0x663114, {
    emissive: 0x351707,
    emissiveIntensity: 0.03,
  });
  const maneWarm = createMaterial(0x8d4b1f, {
    emissive: 0x47220d,
    emissiveIntensity: 0.028,
  });
  const snoutMaterial = createMaterial(0xf6e8c8, {
    emissive: 0xb49e79,
    emissiveIntensity: 0.018,
  });
  const noseMaterial = createMaterial(0x2a160f, {
    roughness: 0.36,
    emissive: 0x120807,
    emissiveIntensity: 0.05,
    flatShading: false,
  });
  const eyeMaterial = createMaterial(0x080808, {
    roughness: 0.22,
    emissive: 0x050505,
    emissiveIntensity: 0.05,
    flatShading: false,
  });
  const highlightMaterial = createMaterial(0xffffff, {
    roughness: 0.18,
    emissive: 0xffffff,
    emissiveIntensity: 0.1,
    flatShading: false,
  });

  const body = createMesh(
    new THREE.SphereGeometry(1.08, 8, 6),
    coatLight,
  );
  body.scale.set(2.12, 1.22, 1.06);
  body.position.set(0, 1.88, 0);
  rig.add(body);

  const chest = createMesh(
    new THREE.DodecahedronGeometry(0.82, 0),
    coatMid,
  );
  chest.scale.set(1.16, 1.06, 1);
  chest.position.set(1.2, 1.98, 0);
  rig.add(chest);

  const rump = createMesh(
    new THREE.DodecahedronGeometry(0.74, 0),
    coatShadow,
  );
  rump.scale.set(1.16, 0.98, 0.94);
  rump.position.set(-1.34, 1.78, 0);
  rig.add(rump);

  const belly = createMesh(
    new THREE.CylinderGeometry(0.82, 0.94, 1.58, 6),
    coatShadow,
  );
  belly.rotation.z = Math.PI * 0.5;
  belly.scale.z = 0.86;
  belly.position.set(0.16, 1.36, 0);
  rig.add(belly);

  const headPivot = new THREE.Group();
  headPivot.position.set(1.98, 2.06, 0);
  headPivot.rotation.y = 0;
  rig.add(headPivot);

  const manePivot = new THREE.Group();
  manePivot.position.set(-0.08, -0.04, 0);
  headPivot.add(manePivot);

  const maneCore = createMesh(
    new THREE.SphereGeometry(0.92, 8, 6),
    maneDark,
  );
  maneCore.scale.set(1.12, 1.1, 1.08);
  manePivot.add(maneCore);
  addManeClumps(manePivot, maneDark, maneWarm);

  const head = createMesh(
    new THREE.DodecahedronGeometry(0.76, 0),
    coatLight,
  );
  head.scale.set(1.12, 1.02, 0.94);
  head.position.set(0.18, 0.02, 0);
  headPivot.add(head);

  const snout = createMesh(
    new THREE.DodecahedronGeometry(0.42, 0),
    snoutMaterial,
  );
  snout.scale.set(1.08, 0.84, 0.76);
  snout.position.set(0.76, -0.2, 0);
  headPivot.add(snout);

  const chin = createMesh(
    new THREE.DodecahedronGeometry(0.28, 0),
    snoutMaterial,
  );
  chin.scale.set(0.95, 0.78, 0.72);
  chin.position.set(0.98, -0.44, 0);
  headPivot.add(chin);

  const nose = createMesh(
    new THREE.DodecahedronGeometry(0.13, 0),
    noseMaterial,
  );
  nose.scale.set(1.18, 0.9, 0.84);
  nose.position.set(1, -0.06, 0);
  headPivot.add(nose);

  const leftEye = createEye(eyeMaterial, highlightMaterial);
  leftEye.position.set(0.8, 0.12, 0.24);
  headPivot.add(leftEye);

  const rightEye = createEye(eyeMaterial, highlightMaterial);
  rightEye.position.set(0.8, 0.12, -0.24);
  headPivot.add(rightEye);

  const leftEar = createEar(coatLight, coatMid, 1);
  leftEar.position.set(-0.06, 0.5, 0.4);
  leftEar.rotation.z = 0.14;
  leftEar.rotation.y = Math.PI * 0.15;
  headPivot.add(leftEar);

  const rightEar = createEar(coatLight, coatMid, -1);
  rightEar.position.set(-0.06, 0.5, -0.4);
  rightEar.rotation.z = -0.14;
  rightEar.rotation.y = -Math.PI * 0.15;
  headPivot.add(rightEar);

  const legs = [
    createLeg(coatMid, coatLight, 0.96, 0.54),
    createLeg(coatMid, coatLight, 0.96, -0.54),
    createLeg(coatShadow, coatLight, -1.02, 0.52, { leanZ: 0.03 }),
    createLeg(coatShadow, coatLight, -1.02, -0.52, { leanZ: -0.03 }),
  ];
  legs.forEach((leg) => rig.add(leg));

  const tailBasePivot = new THREE.Group();
  tailBasePivot.position.set(-2.22, 2.08, 0.06);
  tailBasePivot.rotation.z = 1.2;
  tailBasePivot.rotation.x = -0.06;
  rig.add(tailBasePivot);

  const tailBase = createMesh(
    new THREE.CylinderGeometry(0.045, 0.075, 0.98, 5),
    coatMid,
  );
  tailBase.position.y = 0.49;
  tailBasePivot.add(tailBase);

  const tailMidPivot = new THREE.Group();
  tailMidPivot.position.y = 0.94;
  tailMidPivot.rotation.z = -0.28;
  tailBasePivot.add(tailMidPivot);

  const tailMid = createMesh(
    new THREE.CylinderGeometry(0.04, 0.06, 0.8, 5),
    coatMid,
  );
  tailMid.position.y = 0.4;
  tailMidPivot.add(tailMid);

  const tailTuft = createMesh(
    new THREE.DodecahedronGeometry(0.18, 0),
    maneWarm,
  );
  tailTuft.scale.set(1.1, 1.18, 0.92);
  tailTuft.position.y = 0.84;
  tailMidPivot.add(tailTuft);

  lion.userData.animation = {
    body,
    chest,
    headPivot,
    manePivot,
    tailBasePivot,
    tailMidPivot,
    base: {
      bodyScaleY: body.scale.y,
      bodyScaleZ: body.scale.z,
      chestScaleX: chest.scale.x,
      chestScaleY: chest.scale.y,
      headX: headPivot.rotation.x,
      headY: headPivot.rotation.y,
      maneX: manePivot.rotation.x,
      maneY: manePivot.rotation.y,
      tailBaseZ: tailBasePivot.rotation.z,
      tailBaseX: tailBasePivot.rotation.x,
      tailMidZ: tailMidPivot.rotation.z,
    },
  };

  return lion;
}

export function updateLionAnimation(lionGroup, time) {
  const animation = lionGroup?.userData?.animation;

  if (!animation) {
    return;
  }

  const breath = Math.sin(time * 1.15) * 0.018;
  const chestBreath = Math.sin(time * 1.15 + 0.24) * 0.028;
  const headTurn = Math.sin(time * 0.48) * 0.06;
  const headNod = Math.sin(time * 0.8 + 0.35) * 0.018;
  const maneFollow = Math.sin(time * 0.48 - 0.16) * 0.03;
  const tailBaseSwish = Math.sin(time * 0.92) * 0.16;
  const tailMidSwish = Math.sin(time * 0.92 - 0.3) * 0.24;

  animation.body.scale.y = animation.base.bodyScaleY + breath;
  animation.body.scale.z = animation.base.bodyScaleZ + breath * 0.35;
  animation.chest.scale.x = animation.base.chestScaleX + chestBreath * 0.25;
  animation.chest.scale.y = animation.base.chestScaleY + chestBreath;

  animation.headPivot.rotation.x = animation.base.headX + headNod;
  animation.headPivot.rotation.y = animation.base.headY + headTurn;

  animation.manePivot.rotation.x = animation.base.maneX + headNod * 0.45;
  animation.manePivot.rotation.y = animation.base.maneY + maneFollow;

  animation.tailBasePivot.rotation.z =
    animation.base.tailBaseZ + tailBaseSwish;
  animation.tailBasePivot.rotation.x =
    animation.base.tailBaseX + tailBaseSwish * 0.08;
  animation.tailMidPivot.rotation.z =
    animation.base.tailMidZ + tailMidSwish;
}
