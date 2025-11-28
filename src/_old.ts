import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import "./style.css";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";

// Renderer
const canvas = document.querySelector("#renderer") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setAnimationLoop(update);

// Environment
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
camera.position.z = 10;

const clock = new THREE.Clock();

// Debug
const orbitControls = new OrbitControls(camera, canvas);

const stats = new Stats();
document.body.appendChild(stats.dom);

const gui = new GUI({ container: document.body });
gui.domElement.style.position = "absolute";
gui.domElement.style.top = "0px";
gui.domElement.style.right = "0px";

const controls = {
  cubeY: 0,
  cubeColor: 0xff0000,
  physicsDebug: false,
};

gui.add(controls, "cubeY").onChange(() => {
  const position = cubeBody.translation();
  position.y = controls.cubeY;
  cubeBody.setTranslation(position, true);
});

gui.addColor(controls, "cubeColor").onChange(() => {
  cube.material.color.set(controls.cubeColor);
});

gui.add(controls, "physicsDebug").onChange(() => {
  physicsDebugger.visible = controls.physicsDebug;
});

const physicsDebugger = new THREE.Mesh(
  new THREE.BufferGeometry(),
  new THREE.MeshBasicMaterial({
    color: "white",
    wireframe: true,
    depthTest: false,
  })
);
physicsDebugger.renderOrder = 10;
scene.add(physicsDebugger);

// Objects
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshBasicMaterial({ color: "red" })
);

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(5, 0.2, 5),
  new THREE.MeshBasicMaterial({ color: "blue" })
);
ground.position.y = -1;

scene.add(cube);
scene.add(ground);

// Physics

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

// ground
ground.geometry.computeBoundingBox();
const box = ground.geometry.boundingBox!;
const groundHx = (box.max.x - box.min.x) * 0.5;
const groundHy = (box.max.y - box.min.y) * 0.5;
const groundHz = (box.max.z - box.min.z) * 0.5;

const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
world.createCollider(
  RAPIER.ColliderDesc.cuboid(groundHx, groundHy, groundHz),
  groundBody
);

groundBody.setTranslation({ x: 0, y: -2, z: 0 }, true);
// groundBody.setRotation({ x: 0, y: 0, z: 0.1, w: 1 }, true);

// cube
cube.geometry.computeBoundingBox();
const cubeBox = cube.geometry.boundingBox!;
const cubeHx = (cubeBox.max.x - cubeBox.min.x) * 0.5;
const cubeHy = (cubeBox.max.y - cubeBox.min.y) * 0.5;
const cubeHz = (cubeBox.max.z - cubeBox.min.z) * 0.5;

const cubeBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
world.createCollider(
  RAPIER.ColliderDesc.cuboid(cubeHx, cubeHy, cubeHz),
  cubeBody
);

function syncPhysics() {
  const groundTranslation = groundBody.translation();
  const groundRotation = groundBody.rotation();
  ground.position.copy(groundTranslation);
  ground.quaternion.copy(groundRotation);

  const cubeTranslation = cubeBody.translation();
  const cubeRotation = cubeBody.rotation();
  cube.position.copy(cubeTranslation);
  cube.quaternion.copy(cubeRotation);
}

// Update loop
function update() {
  stats.begin();

  const delta = clock.getDelta();
  world.timestep = delta;
  world.step();
  syncPhysics();
  if (controls.physicsDebug) debugPhysics();

  orbitControls.update();
  renderer.render(scene, camera);

  stats.end();
}

function debugPhysics() {
  const { vertices } = world.debugRender();
  const bufferAttribute = new THREE.BufferAttribute(vertices, 3);
  physicsDebugger.geometry.setAttribute("position", bufferAttribute);
}

// Resize handler
function resize() {
  const width = globalThis.innerWidth;
  const height = globalThis.innerHeight;
  const pixelRatio = Math.min(2, globalThis.devicePixelRatio);

  renderer.setSize(width, height);
  renderer.setPixelRatio(pixelRatio);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

resize();
