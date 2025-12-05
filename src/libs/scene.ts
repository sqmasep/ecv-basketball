import * as THREE from "three";
import type { Engine } from "./engine";
import * as RAPIER from "@dimforge/rapier3d";
import { Debugger } from "./debugger";
import { Interaction } from "./interaction";
import { Ball } from "./ball";
import { Cube } from "./cube";
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";

export class Scene extends THREE.Scene {
  engine: Engine;
  world: RAPIER.World;
  eventQueue: RAPIER.EventQueue;
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
    this.eventQueue = new RAPIER.EventQueue(true);

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

    this.camera.position.set(0, 2, 12);
    // new OrbitControls(this.camera, this.engine.renderer.domElement);

    const basket = new THREE.Group();

    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 0.2),
      new THREE.MeshBasicMaterial({ color: "brown" })
    );
    pole.name = "pole";
    pole.position.set(3, 1, 0);
    basket.add(pole);

    const taurus = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.05, 16, 100),
      new THREE.MeshBasicMaterial({ color: "red" })
    );
    taurus.name = "hook";
    basket.add(taurus);

    this.add(basket);

    this.traverse(obj => {
      if (obj.name === "pole") {
        const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        const pole = obj as THREE.Mesh;
        pole.geometry.computeBoundingBox();
        const box = pole.geometry.boundingBox!;
        const hx = (box.max.x - box.min.x) * 0.5;
        const hy = (box.max.y - box.min.y) * 0.5;
        const hz = (box.max.z - box.min.z) * 0.5;
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz), body);
        pole.userData.rigidbody = body;
      }

      if (obj.name === "hook") {
        const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        body.setTranslation(new RAPIER.Vector3(0, 1, 0.5), true);

        const rotation = new THREE.Euler(THREE.MathUtils.degToRad(90), 0, 0);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(rotation.clone());

        body.setRotation(quaternion.clone(), true);

        const hook = obj as THREE.Mesh;

        const ring = new THREE.RingGeometry(0.48, 0.52, 32);
        const physicsCollider = RAPIER.ColliderDesc.trimesh(
          ring.attributes.position.array as Float32Array,
          ring.index!.array as Uint32Array
        );

        const sensorCollider = RAPIER.ColliderDesc.cylinder(0.05, 0.4);
        sensorCollider.setRotation(quaternion);
        sensorCollider.setSensor(true);

        this.world.createCollider(physicsCollider, body);
        this.world.createCollider(sensorCollider, body);
        hook.userData.rigidbody = body;
      }
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
    this.world.step(this.eventQueue);
    this.eventQueue.drainCollisionEvents((h1, h2, started) => {
      console.log("collision", h1, h2, started);
      // make it so only the ball and hook collisions count
      // compare the parent rigid-body handles of the colliders so we can
      // determine if one side is a ball body and the other side is the hook body
      const hookBody = this.getObjectByName("hook")?.userData.rigidbody as
        | RAPIER.RigidBody
        | undefined;
      if (!hookBody) return;

      const hookBodyHandle = (hookBody as any).handle ?? null;
      const ballBodyHandles = this.balls.map(
        ball => (ball.mesh.userData.rigidbody as any)?.handle ?? null
      );

      const colliderA = this.world.getCollider(h1);
      const colliderB = this.world.getCollider(h2);
      const parentHandleA = (colliderA?.parent() as any)?.handle ?? null;
      const parentHandleB = (colliderB?.parent() as any)?.handle ?? null;

      if (
        (ballBodyHandles.includes(parentHandleA) &&
          parentHandleB === hookBodyHandle) ||
        (ballBodyHandles.includes(parentHandleB) &&
          parentHandleA === hookBodyHandle)
      ) {
        if (started) {
          this.engine.game?.incrementPoints();
        }
      }

      // if (started) {
      //   this.engine.game?.incrementPoints();
      // }
    });

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
