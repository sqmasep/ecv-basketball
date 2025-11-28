import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";

export class Ball {
  isLaunched = false;
  mesh: THREE.Mesh;

  constructor(world: RAPIER.World) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.25),
      new THREE.MeshBasicMaterial({
        color: "orange",
      })
    );
    ball.name = `Ball-${ball.id}`;

    this.mesh = ball;

    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());

    this.mesh.geometry.computeBoundingBox();
    const box = this.mesh.geometry.boundingBox!;
    const radius = (box.max.x - box.min.x) * 0.5;

    const collider = world.createCollider(
      RAPIER.ColliderDesc.ball(radius),
      body
    );
    collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

    this.mesh.userData.rigidbody = body;
  }
}
