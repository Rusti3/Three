import * as THREE from "three";

export function createPlaceholderCar(): THREE.Group {
  const car = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xd1413f,
    metalness: 0.4,
    roughness: 0.35
  });
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f1117,
    metalness: 0.3,
    roughness: 0.8
  });
  const detailMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c6672,
    metalness: 0.9,
    roughness: 0.2
  });

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.52, 4.3), bodyMaterial);
  lowerBody.position.y = 0.7;
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  car.add(lowerBody);

  const upperBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 2.1), bodyMaterial);
  upperBody.position.set(0, 1.2, -0.15);
  upperBody.castShadow = true;
  upperBody.receiveShadow = true;
  car.add(upperBody);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.24, 0.2), detailMaterial);
  windshield.position.set(0, 1.27, 0.68);
  windshield.rotation.x = -0.35;
  windshield.castShadow = true;
  car.add(windshield);

  const wheelGeometry = new THREE.CylinderGeometry(0.43, 0.43, 0.32, 24);
  wheelGeometry.rotateZ(Math.PI / 2);
  const wheelPositions: Array<[number, number, number]> = [
    [-1.02, 0.45, 1.48],
    [1.02, 0.45, 1.48],
    [-1.02, 0.45, -1.48],
    [1.02, 0.45, -1.48]
  ];

  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    car.add(wheel);
  }

  return car;
}
