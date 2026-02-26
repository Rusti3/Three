import * as THREE from "three";

export function getIslandTopPoint(mesh: THREE.Mesh): THREE.Vector3 {
  mesh.updateMatrixWorld(true);

  const geometry = mesh.geometry;
  if (geometry && geometry.getAttribute) {
    const position = geometry.getAttribute("position");
    if (position && position.itemSize >= 3) {
      const local = new THREE.Vector3();
      const world = new THREE.Vector3();
      const top = new THREE.Vector3();
      let bestY = Number.NEGATIVE_INFINITY;

      for (let i = 0; i < position.count; i += 1) {
        local.fromBufferAttribute(position, i);
        world.copy(local).applyMatrix4(mesh.matrixWorld);
        if (world.y > bestY) {
          bestY = world.y;
          top.copy(world);
        }
      }

      if (Number.isFinite(bestY)) {
        return top;
      }
    }
  }

  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  return new THREE.Vector3(center.x, box.max.y, center.z);
}
