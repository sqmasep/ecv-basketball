import * as THREE from "three";
import { UI } from "./UI";

const POINTER_DEFAULT_POSITION = 10000;
export const MAX_POWER = 300;

export class Interaction {
  pointer: THREE.Vector3;
  pointerIsPressed = false;
  pressStartedAt?: number;

  power: number = 0;
  private powerInterval?: number;

  pointerDirection: THREE.Vector3;

  onClick?: (direction: THREE.Vector3, power: number) => void;

  constructor() {
    this.pointer = new THREE.Vector3().setScalar(POINTER_DEFAULT_POSITION);
    this.pointerDirection = new THREE.Vector3();

    globalThis.addEventListener("pointermove", this.onPointer);
    globalThis.addEventListener("pointerdown", this.onPointer);
    globalThis.addEventListener("pointerup", this.onPointer);
  }

  onPointer = (e: PointerEvent) => {
    if (e.type === "pointermove" || e.type === "pointerdown") {
      if (e.type === "pointerdown") {
        this.pointerIsPressed = true;
        this.pressStartedAt = Date.now();

        this.powerInterval = setInterval(() => {
          const diff = Date.now() - (this.pressStartedAt || 0);
          const power = diff / 8;
          const clampedPower = Math.min(power, MAX_POWER);
          this.power = clampedPower;
          UI.updatePower(this.power);
        }, 10);
      }

      if (this.pointerIsPressed) {
        const x = (e.clientX / globalThis.innerWidth) * 2 - 1;
        const y = -(e.clientY / globalThis.innerHeight) * 2 + 1;
        this.pointer.set(x, y, 0.5);
      }
    }
    if (e.type === "pointerup") {
      this.pointer.setScalar(POINTER_DEFAULT_POSITION);
      this.pointerIsPressed = false;
      const MULTIPLIER_OFFSET = 0.1;

      const randomOffset = new THREE.Vector3(
        (Math.random() - 0.5) * MULTIPLIER_OFFSET,
        (Math.random() - 0.5) * MULTIPLIER_OFFSET,
        (Math.random() - 0.5) * MULTIPLIER_OFFSET
      );
      this.pointerDirection.add(randomOffset).normalize();

      this.onClick?.(this.pointerDirection, this.power);
      UI.updatePower(0);

      if (this.powerInterval) {
        clearInterval(this.powerInterval);
      }
    }
  };

  updateDirection(camera: THREE.Camera) {
    this.pointerDirection
      .copy(this.pointer)
      .unproject(camera)
      .sub(camera.position)
      .normalize();
  }

  getProjection(target: THREE.Vector3, camera: THREE.Camera, distance = 1) {
    target
      .copy(camera.position)
      .add(this.pointerDirection.clone().multiplyScalar(distance));
  }
}
