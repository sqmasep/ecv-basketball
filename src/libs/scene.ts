import * as THREE from "three";
import type { Engine } from "./engine";
import * as RAPIER from "@dimforge/rapier3d";
import { Debugger } from "./debugger";
import { Interaction } from "./interaction";
import { Ball } from "./ball";
import { Cube } from "./cube";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export class Scene extends THREE.Scene {
  engine: Engine;
  world: RAPIER.World;
  camera: THREE.PerspectiveCamera;
  debugger: Debugger;
  physicsDebugger: (world: RAPIER.World) => void;
  interaction: Interaction;
  pointerDebugger: any;

  balls = [] as Ball[];

  constructor(engine: Engine) {
    super();
    this.engine = engine;

    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

    this.camera = new THREE.PerspectiveCamera();
    this.camera.position.z = 10;
    this.camera.position.y = 2;
    this.camera.lookAt(0, 0, 0);
    this.add(this.camera);

    this.debugger = new Debugger();
    document.body.appendChild(this.debugger.domElement);

    this.interaction = new Interaction();
    this.interaction.onClick = this.onClick.bind(this);

    this.pointerDebugger = this.debugger.createPointerDebugger(this);
    this.physicsDebugger = this.debugger.createPhysicsDebugger(this);

    this.load();
  }

  load() {
    // const gltfLoader = new GLTFLoader();
    // const ballModelSource = gltfLoader.loadAsync("/ball.glb");

    // ballModelSource.then(gltf => {
    //   const ballMesh = gltf.scene.children[0] as THREE.Mesh;
    //   Ball.sourceMesh = ballMesh;
    //   this.add(ballMesh);
    // });

    // const sceneModelSource = gltfLoader.loadAsync("/scene.glb");
    // sceneModelSource.then(gltf => {
    //   gltf.scene.traverse(obj => {
    //     if (obj instanceof THREE.Mesh) {
    //       this.add(obj);
    //     }
    //   });
    // });

    // ground
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.2, 5),
      new THREE.MeshBasicMaterial({ color: "blue" })
    );
    ground.name = "Ground";
    ground.position.y = -1;
    this.add(ground);

    // cube
    const HEIGHT = 3;
    Array.from({ length: HEIGHT }).forEach((_, i) => {
      Array.from({ length: HEIGHT - i }).forEach((_, j) => {
        const cube = new Cube(this.world);
        cube.mesh.position.x = (j - (HEIGHT - i - 1) * 0.5) * 1.1;
        cube.mesh.position.y = i + 0.5;

        this.add(cube.mesh);
      });
    });

    this.traverse(obj => {
      if (obj.name === "Ground") {
        const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());

        ground.geometry.computeBoundingBox();
        const box = ground.geometry.boundingBox!;
        const hx = (box.max.x - box.min.x) * 0.5;
        const hy = (box.max.y - box.min.y) * 0.5;
        const hz = (box.max.z - box.min.z) * 0.5;

        this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz), body);

        ground.userData.rigidbody = body;
        ground.userData.rigidbody.setTranslation({ x: 0, y: -1, z: 0 }, true);
      }

      if (obj.name === "Cube") {
        const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());

        cube.geometry.computeBoundingBox();
        const box = cube.geometry.boundingBox!;
        const hx = (box.max.x - box.min.x) * 0.5;
        const hy = (box.max.y - box.min.y) * 0.5;
        const hz = (box.max.z - box.min.z) * 0.5;

        this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz), body);

        cube.userData.rigidbody = body;
      }

      if (obj.name === "ball") {
        const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());

        const ball = obj as THREE.Mesh;

        ball.geometry.computeBoundingBox();
        const box = ball.geometry.boundingBox!;
        const radius = (box.max.x - box.min.x) * 0.5;

        this.world.createCollider(RAPIER.ColliderDesc.ball(radius), body);

        ball.userData.rigidbody = body;
      }
      console.log(obj.name);

      if (obj.name === "ground") {
        const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        const ground = obj as THREE.Mesh;

        ground.geometry.computeBoundingBox();
        const box = ground.geometry.boundingBox!;
        const hx = (box.max.x - box.min.x) * 0.5;
        const hy = (box.max.y - box.min.y) * 0.5;
        const hz = (box.max.z - box.min.z) * 0.5;

        this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz), body);
        ground.userData.rigidbody = body;
      }

      // if (obj.name === "Ball") {
      //   const body = this.world.createRigidBody(
      //     RAPIER.RigidBodyDesc.kinematicVelocityBased()
      //   );

      //   ball.geometry.computeBoundingBox();
      //   const box = ball.geometry.boundingBox!;
      //   const radius = (box.max.x - box.min.x) * 0.5;

      //   this.world.createCollider(RAPIER.ColliderDesc.ball(radius), body);

      //   body.setTranslation({ x: -10000, y: -10000, z: -10000 }, true);

      //   ball.userData.rigidbody = body;
      // }
    });

    this.physicsDebugger = this.debugger.createPhysicsDebugger(this);
  }

  resize() {
    const v2 = new THREE.Vector2();
    this.engine.renderer.getSize(v2);
    this.camera.aspect = v2.x / v2.y;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.debugger.stats.begin();

    const delta = this.engine.clock.getDelta();
    this.world.timestep = delta;
    this.world.step();

    this.syncPhysics();
    this.physicsDebugger(this.world);

    this.interaction.updateDirection(this.camera);
    this.engine.renderer.render(this, this.camera);
    this.debugger.stats.end();
  }

  syncPhysics() {
    this.traverse(obj => {
      if (!obj.userData.rigidbody) return;

      const body = obj.userData.rigidbody as RAPIER.RigidBody;

      obj.position.copy(body.translation());
      obj.quaternion.copy(body.rotation());
    });
  }

  // this gets called by Interaction class
  onClick(direction: THREE.Vector3, power: number) {
    // not in-game
    if (!this.engine.game?.startedAt || this.engine.game?.endedAt) return;

    // not enough balls for example
    if (!this.engine.game?.canThrowBall()) return;

    this.engine.game.decrementBallCount();

    const newBall = new Ball(this.world);

    this.add(newBall.mesh);
    this.balls.push(newBall);

    const body = newBall.mesh.userData.rigidbody as RAPIER.RigidBody;

    const SPEED = 15 + power / 20;

    body.setTranslation(
      this.camera.position as unknown as RAPIER.Vector3,
      true
    );
    body.setLinvel(direction.clone().multiplyScalar(SPEED), true);
  }
}
