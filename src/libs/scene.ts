import * as THREE from "three";
import type { Engine } from "./engine";
import * as RAPIER from "@dimforge/rapier3d";
import { Debugger } from "./debugger";
import { Interaction } from "./interaction";
import { Ball } from "./ball";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

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
    this.camera.position.set(15, 3, 0);
    this.camera.lookAt(0, 2, 0);
    // new OrbitControls(this.camera, this.engine.renderer.domElement);

    const light = new THREE.DirectionalLight("white", 1);
    light.position.set(5, 10, 7.5);
    this.add(light);

    const gltfLoader = new GLTFLoader();

    gltfLoader.load("/basket.glb", gltf => {
      this.add(gltf.scene);
    });

    this.traverse(obj => {
      if (["pole", "plush", "ground", "support"].includes(obj.name)) {
        const object = obj as THREE.Mesh;
        const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());

        const vertices = object.geometry.attributes.position.array;
        const indices = object.geometry.index!.array;

        const colliderDesc = RAPIER.ColliderDesc.trimesh(
          new Float32Array(vertices),
          new Uint32Array(indices)
        );

        this.world.createCollider(colliderDesc, body);

        body.setTranslation(obj.position, true);
      }

      if (obj.name === "target") {
        const group = obj as THREE.Group;
        const targetMesh = group.children[0] as THREE.Mesh;
        const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());

        targetMesh.geometry.computeBoundingBox();
        const box = targetMesh.geometry.boundingBox!;
        const hx = (box.max.x - box.min.x) * 0.5;
        const hy = (box.max.y - box.min.y) * 0.5;
        const hz = (box.max.z - box.min.z) * 0.5;
        this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz), body);
        body.setTranslation(group.position, true);
      }

      if (obj.name === "basket") {
        const group = obj as THREE.Mesh;

        // for group.children
        group.children.forEach((c, i) => {
          const child = c as THREE.Mesh;
          // console.log("basket child", child.name);
          const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());

          if (i === 1) {
            const sensorCollider = RAPIER.ColliderDesc.cylinder(0.05, 0.4);
            sensorCollider.setSensor(true);
            sensorCollider.translation = child.getWorldPosition(
              new THREE.Vector3()
            );
            this.world.createCollider(sensorCollider, body);
          }

          const vertices = child.geometry.attributes.position.array;
          const indices = child.geometry.index!.array;

          const colliderDesc = RAPIER.ColliderDesc.trimesh(
            new Float32Array(vertices),
            new Uint32Array(indices)
          );

          colliderDesc.translation = child.getWorldPosition(
            new THREE.Vector3()
          );

          this.world.createCollider(colliderDesc, body);
          child.userData.rigidbody = body;
        });
      }

      // if (obj.name === "hook") {
      //   const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
      //   body.setTranslation(new RAPIER.Vector3(0, 1, 0.5), true);
      //   const rotation = new THREE.Euler(THREE.MathUtils.degToRad(90), 0, 0);
      //   const quaternion = new THREE.Quaternion();
      //   quaternion.setFromEuler(rotation.clone());
      //   body.setRotation(quaternion.clone(), true);
      //   const hook = obj as THREE.Mesh;
      //   const ring = new THREE.RingGeometry(0.48, 0.52, 32);
      //   const physicsCollider = RAPIER.ColliderDesc.trimesh(
      //     ring.attributes.position.array as Float32Array,
      //     ring.index!.array as Uint32Array
      //   );
      //   const sensorCollider = RAPIER.ColliderDesc.cylinder(0.05, 0.4);
      //   sensorCollider.setRotation(quaternion);
      //   sensorCollider.setSensor(true);
      //   this.world.createCollider(physicsCollider, body);
      //   this.world.createCollider(sensorCollider, body);
      //   hook.userData.rigidbody = body;
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
    this.world.step(this.eventQueue);
    this.eventQueue.drainCollisionEvents((h1, h2, started) => {
      const ballBodyHandles = this.balls.map(
        ball => (ball.mesh.userData.rigidbody as any)?.handle ?? null
      );

      const colliderA = this.world.getCollider(h1);
      const colliderB = this.world.getCollider(h2);
      if (!colliderA || !colliderB) return;

      const isSensorA =
        typeof (colliderA as any).isSensor === "function"
          ? (colliderA as any).isSensor()
          : !!(colliderA as any).sensor;
      const isSensorB =
        typeof (colliderB as any).isSensor === "function"
          ? (colliderB as any).isSensor()
          : !!(colliderB as any).sensor;

      const parentHandleA = (colliderA.parent() as any)?.handle ?? null;
      const parentHandleB = (colliderB.parent() as any)?.handle ?? null;

      // increment points when a ball enters the sensor (on collision start)
      if (started) {
        if (
          (isSensorA && ballBodyHandles.includes(parentHandleB)) ||
          (isSensorB && ballBodyHandles.includes(parentHandleA))
        ) {
          this.engine.game?.incrementPoints();
        }
      }
    });

    // goated copilot demo:
    // orbit but limited to +/-90° so the camera never goes behind the center
    const time = this.engine.clock.getElapsedTime();
    const radius = 15;
    const speed = 0.05;
    const center = new THREE.Vector3(0, 3, 0);
    const y = this.camera.position.y;
    // angle oscillates in [-PI/2, PI/2] -> max 180°
    const angle = Math.sin(time * speed) * (Math.PI / 2);
    this.camera.position.set(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );
    this.camera.lookAt(center);

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
