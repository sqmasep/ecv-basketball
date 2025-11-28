import { MAX_POWER } from "./interaction";

const ELEMENTS = {
  // start screen
  START_SCREEN: document.querySelector("#start-screen")! as HTMLElement,
  START_TIME_SELECTOR: document.querySelector(
    "#start-time-selector"
  )! as HTMLElement,
  START_BUTTON: document.querySelector("#start-button")! as HTMLElement,

  // game over screen
  GAME_OVER_SCREEN: document.querySelector("#game-over-screen")! as HTMLElement,
  GAME_OVER_BUTTON: document.querySelector("#game-over-button")! as HTMLElement,

  // in-game gui
  BALL_COUNT: document.querySelector("#ball-count")! as HTMLElement,
  POINTS: document.querySelector("#points")! as HTMLElement,
  REMAINING_TIME: document.querySelector("#remaining-time")! as HTMLElement,
  POWER_BAR: document.querySelector("#power-bar")! as HTMLElement,
};

class UIController {
  timeLimitSelected: number = 30;

  constructor() {
    ELEMENTS.START_TIME_SELECTOR.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", () => {
        ELEMENTS.START_TIME_SELECTOR.querySelectorAll("button").forEach(
          btn => delete btn.dataset.selected
        );
        button.dataset.selected = "true";
        this.timeLimitSelected = parseInt(button.dataset.value || "30");
      });
    });
  }

  // start screen
  hideStartScreen() {
    ELEMENTS.START_SCREEN.style.display = "none";
  }

  showStartScreen() {
    ELEMENTS.START_SCREEN.style.display = "grid";
  }

  // game over screen
  showGameOverScreen() {
    ELEMENTS.GAME_OVER_SCREEN.style.display = "block";
  }

  hideGameOverScreen() {
    ELEMENTS.GAME_OVER_SCREEN.style.display = "none";
  }

  updateRemainingTime(time: number) {
    ELEMENTS.REMAINING_TIME.textContent = time.toString();
  }

  // in-game gui
  updateBallCount(count: number) {
    ELEMENTS.BALL_COUNT.textContent = Array.from({ length: count })
      .map(() => "🏀")
      .join(" ");
  }

  updatePoints(points: number) {
    ELEMENTS.POINTS.textContent = points.toString();
  }

  updatePower(power: number) {
    ELEMENTS.POWER_BAR.style.scale = `${power / MAX_POWER} 1`;
  }

  // events
  onStartButtonClick(callback: (data: { timeLimit: number }) => void) {
    ELEMENTS.START_BUTTON.addEventListener("click", () => {
      callback({
        timeLimit: this.timeLimitSelected,
      });
    });
  }

  onGameOverButtonClick(callback: () => void) {
    ELEMENTS.GAME_OVER_BUTTON.addEventListener("click", () => {
      callback();
    });
  }
}

export const UI = new UIController();
