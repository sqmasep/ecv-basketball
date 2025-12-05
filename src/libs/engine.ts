import * as THREE from "three";
import type { Scene } from "./scene";
import { Game } from "./game";

export class Engine {
  renderer: THREE.WebGLRenderer;
  clock: THREE.Clock;
  scene?: Scene;
  game?: Game;

  constructor() {
    const canvas = document.querySelector("#renderer") as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({ canvas });

    this.game = new Game({ ballCount: 5 });

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(this.update.bind(this));
    globalThis.addEventListener("resize", this.resize);
  }

  setScene(S: new (engine: Engine) => Scene) {
    this.scene = new S(this);
    this.resize();
  }

  setGame(game: Game) {
    this.game = game;
  }

  setPixelRatio(pixelRatio: number) {
    this.renderer.setPixelRatio(Math.min(pixelRatio, 2));
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height);
    this.scene?.resize();
  }

  resize() {
    const width = globalThis.innerWidth;
    const height = globalThis.innerHeight;

    this.setSize(width, height);
    this.scene?.resize();
  }

  update() {
    this.scene?.render();
  }
}
