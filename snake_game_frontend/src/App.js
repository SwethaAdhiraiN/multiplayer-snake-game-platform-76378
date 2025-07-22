import React, { useState, useRef, useEffect } from "react";
import "./App.css";

// Component imports
import GameBoard from "./components/GameBoard";
import Leaderboard from "./components/Leaderboard";
import LoginPanel from "./components/LoginPanel";
import SettingsPanel from "./components/SettingsPanel";

// --- Design constants from project description ---
const SPEEDS = [
  { label: "Slow", value: 130 },
  { label: "Normal", value: 90 },
  { label: "Fast", value: 60 }
];
const DIFFICULTY_LEVELS = [
  { label: "Easy", value: "easy" },
  { label: "Classic", value: "classic" },
  { label: "Hardcore", value: "hardcore" }
];
const BOARD_SIZE = 20;

// Sequential Steps
const FLOW = {
  LOGIN: "login",
  DIFFICULTY: "difficulty",
  GAME: "game",
  GAMEOVER: "gameover"
};

function App() {
  // --- Step state for sequential flow ---
  const [stage, setStage] = useState(FLOW.LOGIN);

  // User state
  const [user, setUser] = useState(null);

  // Difficulty/Speed
  const [difficultyIdx, setDifficultyIdx] = useState(1); // Default: Classic
  const [speedIdx, setSpeedIdx] = useState(1); // Default: Normal

  // Game score state
  const [currentScore, setCurrentScore] = useState(0);
  const [scores, setScores] = useState([
    { name: "Alex", score: 182 },
    { name: "Sandy", score: 170 },
    { name: "Cleo", score: 161 }
  ]);
  const maxScore = scores.find(s => s.name === user)?.score || 0;

  // ---- Flow handlers ----
  // Step 1: Login
  function handleLogin(name) {
    setUser(name);
    setStage(FLOW.DIFFICULTY);
  }

  // Step 2: Choose difficulty/speed
  function handleStartGame() {
    setCurrentScore(0);
    setStage(FLOW.GAME);
  }

  // Step 3: Game logic handled by GameScreen
  function handleGameOver(score) {
    setCurrentScore(score);
    // Update scores/leaderboard if relevant
    setScores(prev => {
      const idx = prev.findIndex(s => s.name === user);
      if (idx < 0) return [...prev, { name: user, score }];
      if (prev[idx].score >= score) return prev;
      const next = [...prev];
      next[idx] = { name: user, score };
      return next;
    });
    setStage(FLOW.GAMEOVER);
  }

  // Step 4: Game over/score screen
  function handleRestart() {
    setStage(FLOW.DIFFICULTY);
  }
  function handleLogout() {
    setUser(null);
    setStage(FLOW.LOGIN);
  }

  // --- Screens ---
  function LoginScreen() {
    return (
      <div className="gameflow-bg">
        <div className="gameflow-panel login">
          <div className="gameflow-title">Snake Game</div>
          <div className="gameflow-desc">
            Welcome! Enter your nickname to begin.
          </div>
          <LoginPanel onLogin={handleLogin} />
        </div>
        <footer className="gameflow-footer">
          <span>© 2024 Multiplayer Snake</span>
        </footer>
      </div>
    );
  }

  function DifficultyScreen() {
    return (
      <div className="gameflow-bg">
        <div className="gameflow-panel difficulty">
          <div className="gameflow-title" style={{marginBottom: 12}}>
            Select Difficulty & Speed
          </div>
          <div style={{color: "var(--color-text-dim)", marginBottom: 13, fontSize: "1.05rem"}}>
            Player: <span style={{color: "#34a853", fontWeight: 700}}>{user}</span>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="panel-label">Speed</label>
            <div className="btn-group" style={{justifyContent: "center"}}>
              {SPEEDS.map((sp, idx) => (
                <button
                  className={`button gameflow-btn ${speedIdx === idx ? "primary selected" : ""}`}
                  key={sp.value}
                  onClick={() => setSpeedIdx(idx)}
                  type="button"
                >{sp.label}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom: 15}}>
            <label className="panel-label">Difficulty</label>
            <div className="btn-group" style={{justifyContent: "center"}}>
              {DIFFICULTY_LEVELS.map((dl, idx) => (
                <button
                  className={`button gameflow-btn ${difficultyIdx === idx ? "primary selected" : ""}`}
                  key={dl.value}
                  onClick={() => setDifficultyIdx(idx)}
                  type="button"
                >{dl.label}</button>
              ))}
            </div>
          </div>
          <button
            className="button accent gameflow-continue-btn"
            style={{ width: "100%", marginTop: 12 }}
            onClick={handleStartGame}
            type="button"
          >
            Start Game
          </button>
          <button
            className="button minimal"
            style={{marginTop: 6, float: "right", opacity: 0.66, fontSize: "1rem"}}
            onClick={handleLogout}
            type="button"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  function GameScreen() {
    // State for snake, food, score, etc.
    const [snake, setSnake] = useState([{ x: 8, y: 8 }]);
    const [food, setFood] = useState(randomCell(BOARD_SIZE));
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const directionRef = useRef("ArrowRight");
    const nextDirectionRef = useRef("ArrowRight");
    const moveInterval = useRef(null);

    // Start new game on mount
    useEffect(() => {
      setSnake([{ x: 8, y: 8 }]);
      setFood(randomCell(BOARD_SIZE));
      setScore(0);
      setGameOver(false);
      directionRef.current = "ArrowRight";
      nextDirectionRef.current = "ArrowRight";
      // Focus window for keys
      window.focus();
    }, []);

    // Handle keyboard input
    useEffect(() => {
      function handleKey(e) {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
          !isOpposite(directionRef.current, e.key)
        ) {
          nextDirectionRef.current = e.key;
        }
      }
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, []);

    // Game loop
    useEffect(() => {
      if (gameOver) return;
      clearInterval(moveInterval.current);
      moveInterval.current = setInterval(() => {
        directionRef.current = nextDirectionRef.current;
        setSnake(prevSnake =>
          getNextSnake(
            prevSnake,
            directionRef.current,
            food,
            BOARD_SIZE,
            DIFFICULTY_LEVELS[difficultyIdx].value,
            cell => setFood(cell),
            () => setScore(s => s + 10),
            v => setGameOver(v)
          )
        );
      }, SPEEDS[speedIdx].value);
      return () => clearInterval(moveInterval.current);
      // eslint-disable-next-line
    }, [speedIdx, food, difficultyIdx, gameOver]);

    // Game over sequence
    useEffect(() => {
      if (gameOver) {
        setTimeout(() => {
          handleGameOver(score);
        }, 750);
      }
      // eslint-disable-next-line
    }, [gameOver]);

    // Cell coloring logic (modernized blocks)
    function renderCell(x, y, key) {
      const snakePart = snake.find(seg => seg.x === x && seg.y === y);
      const foodHere = food.x === x && food.y === y;
      let color = "";
      if (snakePart) color = "var(--color-primary)";
      if (foodHere) color = "var(--color-accent)";
      return (
        <div
          key={key}
          className="cell"
          style={{
            background: color
              ? color
              : (x + y) % 2 === 0
                  ? "#fcfcfc"
                  : "#f3f6f9",
            borderRadius: snakePart || foodHere ? "6px" : "2.9px",
            boxShadow: snakePart
              ? "0 2.5px 10px 0 #34a85340"
              : foodHere
              ? "0 2.5px 13px 0 #fbbc0535"
              : "none",
            border: foodHere
              ? "1.5px solid #fffbe7"
              : "none"
          }}
        ></div>
      );
    }

    return (
      <div className="gameflow-bg">
        <div className="gameflow-panel game" style={{maxWidth: 440, width: "98%"}}>
          <div className="gameflow-title">Snake Game</div>
          <div className="game-session-meta">
            <span>
              <strong>Player:</strong> {user}
            </span>
            <span>
              <strong>Difficulty:</strong> {DIFFICULTY_LEVELS[difficultyIdx].label}
            </span>
            <span>
              <strong>Speed:</strong> {SPEEDS[speedIdx].label}
            </span>
          </div>
          <div className="game-canvas-box">
            <GameBoard
              boardSize={BOARD_SIZE}
              renderCell={renderCell}
              overlay={
                gameOver && (
                  <div className="game-over-overlay" style={{
                    fontSize: "1.9rem",
                    boxShadow: "0 3.5px 16px 0 #fbbc0511"
                  }}>
                    <div style={{ fontWeight: 900, color: "#e0663c", letterSpacing: ".03em" }}>Game Over</div>
                    <div className="score-popup" style={{fontSize: "1.43rem", color: "#222831dd", marginTop: 5}}>
                      Score: <span style={{color: "#fbbc05"}}>{score}</span>
                    </div>
                  </div>
                )
              }
            />
            <div className="scoreboard-box" style={{marginBottom: 6}}>
              <span style={{color: "#666", fontWeight: 500}}>Score: </span>
              <span style={{color: "#34a853", fontWeight: 700, fontSize: "1.19rem"}}>{score}</span>
              <span style={{marginLeft: 13, color: "#888"}}>| Max: </span>
              <span style={{color: "#fbbc05", fontWeight: 700, fontSize: "1.11rem"}}>{maxScore}</span>
            </div>
          </div>
          <footer className="footer" style={{ margin: "18px 0 0 0", color: "#abd1c6" }}>
            <span style={{ color: "#888" }}>Use arrow keys. Good luck!</span>
          </footer>
        </div>
      </div>
    );
  }

  function GameOverScreen() {
    return (
      <div className="gameflow-bg">
        <div className="gameflow-panel gameover" style={{maxWidth: 410, width: "98%"}}>
          <div className="gameflow-title">Game Over</div>
          <div className="score-popup" style={{fontSize: "2.2rem", color: "#fbbc05"}}>
            Score: {currentScore}
          </div>
          <div style={{marginTop: 10, color: "#34a853", fontWeight: 400, fontSize: "1.15rem"}}>
            Best: {scores.find(s => s.name === user)?.score || currentScore}
          </div>
          <button
            className="button accent"
            style={{width: "100%", marginTop: 18, fontSize: 20}}
            onClick={handleRestart}
            type="button"
            autoFocus
          >
            Play Again
          </button>
          <button
            className="button minimal"
            style={{marginTop: 8, float: "right", opacity: 0.7, fontSize: "1rem"}}
            onClick={handleLogout}
            type="button"
          >
            Log out
          </button>
          <div style={{margin: "2.5em 0 0.2em 0"}}>
            <Leaderboard scores={scores} currentUser={user} />
          </div>
        </div>
        <footer className="gameflow-footer">
          <span>Can you beat your score? Try again!</span>
        </footer>
      </div>
    );
  }

  // --- Stage selector ---
  return (
    <>
      {stage === FLOW.LOGIN && <LoginScreen />}
      {stage === FLOW.DIFFICULTY && <DifficultyScreen />}
      {stage === FLOW.GAME && <GameScreen />}
      {stage === FLOW.GAMEOVER && <GameOverScreen />}
    </>
  );
}

// --- Helpers (from original SnakeGame extended for cohesion) ---
function getNextSnake(
  snake,
  dir,
  food,
  size,
  difficulty,
  setFood,
  setScore,
  setGameOver
) {
  if (!dir) return snake;
  const DIRECTIONS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }
  };
  const d = DIRECTIONS[dir];
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
function randomCell(size, exclude = []) {
  let tries = 0;
  while (true) {
    const cell = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
    if (!exclude.some(c => c.x === cell.x && c.y === cell.y)) return cell;
    if (++tries > 1000) return { x: 0, y: 0 }; // fallback
  }
}

export default App;
