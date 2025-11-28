import "./style.css";
import { Engine } from "./libs/engine";
import { Scene } from "./libs/scene";
import { UI } from "./libs/UI";
import { Game } from "./libs/game";

const engine = new Engine();
engine.setScene(Scene);

UI.onStartButtonClick(({ timeLimit }) => {
  const game = new Game({ ballCount: 5, timeLimit });
  game.start();

  engine.setGame(game);
  engine.scene?.load();

  UI.hideStartScreen();
});

UI.onGameOverButtonClick(() => {
  engine.game?.reset();
  UI.hideGameOverScreen();
  UI.showStartScreen();
});
