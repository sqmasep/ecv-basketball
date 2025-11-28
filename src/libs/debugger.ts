import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";

export class Debugger {
  stats: Stats;
  gui: GUI;
  domElement: HTMLElement;

  constructor() {
    this.stats = new Stats();
    this.gui = new GUI();

    this.domElement = document.createElement("div");
    this.domElement.append(this.stats.dom, this.gui.domElement);
  }

  createPhysicsDebugger(parent: THREE.Object3D) {
    const mesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: "white",
        wireframe: true,
        depthTest: false,
      })
    );
    mesh.renderOrder = 1000;

    parent.add(mesh);

    return (world: RAPIER.World) => {
      const { vertices } = world.debugRender();
      const bufferAttribute = new THREE.BufferAttribute(vertices, 3);
      mesh.geometry.setAttribute("position", bufferAttribute);
    };
  }

  createPointerDebugger(parent: THREE.Object3D) {
    const pointerDebugger = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial({ color: "yellow", depthTest: false })
    );
    pointerDebugger.position.y = 1;
    pointerDebugger.renderOrder = 1000;
    // parent.add(pointerDebugger);

    return pointerDebugger;
  }
}
