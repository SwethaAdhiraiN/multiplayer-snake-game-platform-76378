import React, { useState, useEffect, useRef } from "react";
import GameBoard from "./GameBoard";

// Utility: generate a random cell
function randomCell(size, exclude = []) {
  let tries = 0;
  while (tries++ < 1000) {
    const cell = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
    if (!exclude.some(c => c.x === cell.x && c.y === cell.y)) return cell;
  }
  return { x: 0, y: 0 }; // fallback
}

const COLORS = {
  primary: "#34a853",
  accent: "#fbbc05",
  secondary: "#222831",
  bg: "#fff",
  grid: "#e9ecef"
};

const BOARD_SIZE = 20;

/**
 * PUBLIC_INTERFACE
 * MultiplayerGame - Handles (basic/local demo) multiplayer snake for 2 players
 * In a real app, would use backend API and websocket/state sync.
 * @param {Object} props
 *   playerName - local player name
 *   opponentName - string or unknown
 *   onEnd - function for when a player loses
 */
function MultiplayerGame({ playerName, opponentName, onEnd }) {
  // We'll just demo with two snakes, each controlled separately
  // Local: Arrow keys; Opponent: WASD (simulate AI/opponent snake in demo)
  const [ourSnake, setOurSnake] = useState([{ x: 5, y: 10 }]);
  const [opponentSnake, setOpponentSnake] = useState([{ x: 14, y: 10 }]);
  const [food, setFood] = useState(randomCell(BOARD_SIZE));
  const [running, setRunning] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  // Direction refs
  const ourDirRef = useRef("ArrowRight");
  const nextOurDir = useRef("ArrowRight");

  // For demo: "AI" moves at random every so often as opponent
  useEffect(() => {
    if (!running) return;
    const aiInt = setInterval(() => {
      setOpponentSnake(prev => getNextSnake(prev, randomAIDir(), food, BOARD_SIZE, () => {}, () => {}, () => {}));
    }, 180);
    return () => clearInterval(aiInt);
    // eslint-disable-next-line
  }, [running, food]);

  // Control our own snake by Arrow keys
  useEffect(() => {
    if (!running) return;
    const handleKey = e => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        !isOpposite(ourDirRef.current, e.key)
      ) {
        nextOurDir.current = e.key;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [running]);

  // Game loop for our snake
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      ourDirRef.current = nextOurDir.current;
      setOurSnake(prev =>
        getNextSnake(
          prev,
          ourDirRef.current,
          food,
          BOARD_SIZE,
          cell => setFood(cell),
          () => {},
          v => {
            setGameOver(v);
            setRunning(false);
            if (onEnd && v) onEnd("you");
          }
        )
      );
    }, 100);
    return () => clearInterval(tick);
    // eslint-disable-next-line
  }, [running, food, onEnd]);

  // End game if collided with opponent
  useEffect(() => {
    if (
      opponentSnake.length &&
      ourSnake.length &&
      opponentSnake.some(seg => seg.x === ourSnake[0].x && seg.y === ourSnake[0].y)
    ) {
      setGameOver(true);
      setRunning(false);
      if (onEnd) onEnd("opponent");
    }
    // eslint-disable-next-line
  }, [ourSnake, opponentSnake]);

  // Cell rendering
  function renderCell(x, y, key) {
    let color = "";
    if (ourSnake.some(seg => seg.x === x && seg.y === y)) color = COLORS.primary;
    else if (opponentSnake.some(seg => seg.x === x && seg.y === y)) color = COLORS.secondary;
    else if (food.x === x && food.y === y) color = COLORS.accent;
    return (
      <div
        className="cell"
        key={key}
        style={{
          background: color
            ? color
            : (x + y) % 2 === 0
            ? COLORS.bg
            : COLORS.grid
        }}
      ></div>
    );
  }

  return (
    <div className="game-board-container">
      <GameBoard boardSize={BOARD_SIZE} renderCell={renderCell} />
      {gameOver && (
        <div className="game-over-overlay">
          <div>Game Over</div>
        </div>
      )}
    </div>
  );
}

// Helpers (same as single player)
function getNextSnake(snake, dir, food, size, setFood, setScore, setGameOver) {
  if (!dir) return snake;
  const d = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }
  }[dir];
  const head = { x: snake[0].x + d.x, y: snake[0].y + d.y };
  if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size) {
    setGameOver(true);
    return snake;
  }
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    setGameOver(true);
    return snake;
  }
  let grow = false;
  if (head.x === food.x && head.y === food.y) {
    grow = true;
    setFood(randomCell(size, snake.concat([head])));
    setScore(s => s + 10);
  }
  const nextSnake = [head, ...snake];
  if (!grow) nextSnake.pop();
  return nextSnake;
}
function isOpposite(dir, next) {
  if ((dir === "ArrowUp" && next === "ArrowDown") || (dir === "ArrowDown" && next === "ArrowUp")) return true;
  if ((dir === "ArrowLeft" && next === "ArrowRight") || (dir === "ArrowRight" && next === "ArrowLeft")) return true;
  return false;
}
function randomAIDir() {
  // Just random for demo, not real AI
  const dirs = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

export default MultiplayerGame;
