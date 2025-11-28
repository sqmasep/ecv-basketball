import { UI } from "./UI";

const BALL_RESPAWN_DELAY = 1500; // milliseconds
const MAX_BALL_COUNT = 5;

export class Game {
  _id = Math.random().toString(16).slice(2);
  ballCount = 5;
  points = 0;
  startedAt: number | null = null;
  endedAt: number | null = null;
  timeLimit = 30;

  constructor({
    ballCount,
    timeLimit,
  }: {
    ballCount: number;
    timeLimit?: number;
  }) {
    this.ballCount = ballCount;
    this.timeLimit = timeLimit ?? 30;
  }

  start() {
    console.log("time limit", this.timeLimit);
    this.startedAt = Date.now();
    this.endedAt = null;
    this.points = 0;

    UI.updateBallCount(this.ballCount);
    UI.updatePoints(this.points);

    const ballCountInterval = setInterval(() => {
      this.incrementBallCount();
    }, BALL_RESPAWN_DELAY);

    const remainingTimeInterval = setInterval(() => {
      UI.updateRemainingTime(
        this.timeLimit - Math.floor((Date.now() - (this.startedAt || 0)) / 1000)
      );
    }, 10);

    setTimeout(() => {
      this.end();
      clearInterval(ballCountInterval);
      clearInterval(remainingTimeInterval);
    }, this.timeLimit * 1000);
  }

  reset() {
    this.points = 0;
  }

  end() {
    this.endedAt = Date.now();
    UI.showGameOverScreen();
  }

  canThrowBall() {
    return this.ballCount > 0;
  }

  incrementBallCount() {
    if (this.ballCount >= MAX_BALL_COUNT) return;

    this.ballCount = Math.min(MAX_BALL_COUNT, this.ballCount + 1);
    UI.updateBallCount(this.ballCount);
  }

  decrementBallCount() {
    if (this.ballCount <= 0) return;

    this.ballCount -= 1;
    UI.updateBallCount(this.ballCount);
  }

  incrementPoints() {
    this.points += 1;
    UI.updatePoints(this.points);
  }
}
