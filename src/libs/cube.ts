import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";

export class Cube {
  mesh: THREE.Mesh;

  constructor(world: RAPIER.World) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial({ color: "red" })
    );
    cube.name = `Cube-${cube.id}`;

    this.mesh = cube;

    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());

    cube.geometry.computeBoundingBox();
    const box = cube.geometry.boundingBox!;
    const hx = (box.max.x - box.min.x) * 0.5;
    const hy = (box.max.y - box.min.y) * 0.5;
    const hz = (box.max.z - box.min.z) * 0.5;

    world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz), body);

    cube.userData.rigidbody = body;
  }
}
