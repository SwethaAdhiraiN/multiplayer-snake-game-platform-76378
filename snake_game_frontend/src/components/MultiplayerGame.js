import React, { useState, useEffect, useRef } from "react";
import GameBoard from "./GameBoard";

// Returns random cell on board not in exclude
function randomCell(size, exclude = []) {
  let tries = 0;
  while (tries++ < 1000) {
    const cell = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
    if (!exclude.some(c => c.x === cell.x && c.y === cell.y)) return cell;
  }
  return { x: 0, y: 0 };
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
 * MultiplayerGame - Synchronizes multiplayer game state via backend APIs (polling model).
 * @param {Object} props
 *   playerName - local player name
 *   opponentName - string or unknown
 *   onEnd - function when game ends
 */
function MultiplayerGame({ playerName, opponentName, onEnd }) {
  const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000/api";
  // --- Core game state
  const [ourSnake, setOurSnake] = useState([{ x: 5, y: 10 }]);
  const [opponentSnake, setOpponentSnake] = useState([{ x: 14, y: 10 }]);
  const [food, setFood] = useState(randomCell(BOARD_SIZE));
  const [running, setRunning] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  // Direction refs
  const ourDirRef = useRef("ArrowRight");
  const nextOurDir = useRef("ArrowRight");

  // Room id is looked up via window state
  const roomId = window.location.hash.startsWith("#room-")
    ? window.location.hash.replace("#room-", "")
    : null;

  // Control our own snake by Arrow keys (suppress opposite)
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

  // Take our step, then update state (as owner), else only poll
  useEffect(() => {
    if (!playerName) return;
    let interval = null;
    let isMounted = true;

    // Represents shared "session state" in backend:
    // { snakes: { "user1": [...], "user2": [...] }, food: {...}, over: bool, loser: playerName|null }
    async function fetchAndSyncState(role) {
      try {
        // --- Get state from backend
        const res = await fetch(
          `${API_BASE}/multiplayer/rooms/${encodeURIComponent(window.__snakeMultiRoomId || roomId)}/state`
        );
        if (!res.ok) throw new Error("No backend state");
        const backend = await res.json();
        let state = backend.state || {};
        // Initial assignment if missing
        if (!state.snakes) state.snakes = {};
        if (!state.snakes[playerName]) state.snakes[playerName] = ourSnake;

        // Decide: if we are the "host" (room creator), we update food, over, etc.
        const players = (backend.players || []).sort();
        const host = players[0] || playerName;
        let isHost = playerName === host;
        // Advance our snake by one and update backend with new state if it's our turn
        if (isHost && !state.over) {
          // Move both snakes forward (if present)
          let userDirs = {};
          if (state.dirs) userDirs = state.dirs;
          userDirs[playerName] = ourDirRef.current;
          // Update snakes for both players (simulate lockstep)
          const newSnakes = { ...state.snakes };
          // Move my snake
          newSnakes[playerName] = getNextSnake(
            state.snakes[playerName] || ourSnake,
            ourDirRef.current,
            state.food || food,
            BOARD_SIZE,
            cell => {}, // food
            () => {},
            v => {}
          );
          // Opponent snake: use stored direction if available
          let theirName = null;
          for (let n of Object.keys(newSnakes)) {
            if (n !== playerName) theirName = n;
          }
          if (theirName) {
            let theirsDir = userDirs[theirName];
            if (!theirsDir) theirsDir = "ArrowRight";
            newSnakes[theirName] = getNextSnake(
              state.snakes[theirName] || [{ x: 15, y: 10 }],
              theirsDir,
              state.food || food,
              BOARD_SIZE,
              cell => {},
              () => {},
              v => {}
            );
          }

          // Food collection logic: only respawn if eaten
          let newFood = state.food || food;
          let someoneAte = false;
          for (let name in newSnakes) {
            if (
              newSnakes[name][0].x === (state.food || food).x &&
              newSnakes[name][0].y === (state.food || food).y
            ) {
              someoneAte = true;
            }
          }
          if (someoneAte) {
            // Don't spawn food in any snake cell
            let union = [];
            for (let sn in newSnakes) union = union.concat(newSnakes[sn]);
            newFood = randomCell(BOARD_SIZE, union);
          }

          // Detect collisions for game over
          let over = false;
          let loser = null;
          Object.keys(newSnakes).forEach(name => {
            let allCells = [];
            Object.keys(newSnakes).forEach(other =>
              allCells.push(...(other !== name ? newSnakes[other] : []))
            );
            // Hit wall
            if (
              newSnakes[name][0].x < 0 ||
              newSnakes[name][0].x >= BOARD_SIZE ||
              newSnakes[name][0].y < 0 ||
              newSnakes[name][0].y >= BOARD_SIZE
            ) {
              over = true;
              loser = name;
            }
            // Hit self or other
            let body = newSnakes[name].slice(1);
            if (
              body.some(seg => seg.x === newSnakes[name][0].x && seg.y === newSnakes[name][0].y) ||
              allCells.some(seg => seg.x === newSnakes[name][0].x && seg.y === newSnakes[name][0].y)
            ) {
              over = true;
              loser = name;
            }
          });

          // Save new state to backend
          let newState = {
            snakes: newSnakes,
            food: newFood,
            dirs: userDirs,
            over,
            loser
          };
          await fetch(
            `${API_BASE}/multiplayer/rooms/${encodeURIComponent(window.__snakeMultiRoomId || roomId)}/state`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newState)
            }
          );

          // Update UI state
          if (isMounted) {
            setOurSnake(newSnakes[playerName]);
            setFood(newFood);
            setOpponentSnake(
              theirName ? newSnakes[theirName] : [{ x: 15, y: 10 }]
            );
            setGameOver(over || false);
            setRunning(!over);
            if (over && onEnd) onEnd(loser === playerName ? "you" : "opponent");
          }
        } else {
          // Guest: only update local state from backend
          if (isMounted && state.snakes && state.snakes[playerName]) {
            setOurSnake(state.snakes[playerName]);
            setFood(state.food || food);
            setOpponentSnake(
              Object.keys(state.snakes).find(n => n !== playerName)
                ? state.snakes[Object.keys(state.snakes).find(n => n !== playerName)]
                : [{ x: 15, y: 10 }]
            );
            setGameOver(state.over || false);
            setRunning(!state.over);
            if (state.over && onEnd) onEnd(state.loser === playerName ? "you" : "opponent");
          }
        }
      } catch {
        // Backend unavailable: end game
        setRunning(false);
      }
    }

    // Host/guest interval
    interval = setInterval(() => fetchAndSyncState(), 330);

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line
  }, [playerName, opponentName, roomId, food, running],);

  // Dir update: send my most recent direction on key press
  useEffect(() => {
    if (!playerName || !running) return;
    let interval = setInterval(async () => {
      let id = window.__snakeMultiRoomId || roomId;
      try {
        await fetch(`${API_BASE}/multiplayer/rooms/${encodeURIComponent(id)}/state`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Shallow: push only my dir
            dirs: { [playerName]: ourDirRef.current }
          })
        });
      } catch {}
    }, 750);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [playerName, running, roomId]);

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

export default MultiplayerGame;
