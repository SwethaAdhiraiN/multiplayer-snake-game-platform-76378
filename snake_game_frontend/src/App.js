import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Color palette
const COLORS = {
  primary: "#34a853",   // Green
  secondary: "#222831", // Very dark gray
  accent: "#fbbc05",    // Orange
  bg: "#ffffff",
  sidebar: "#f8f9fa",
  grid: "#e9ecef",
};

// SNAKE GAME CONSTANTS
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

// Direction deltas
const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

// PUBLIC_INTERFACE
function LoginPanel({ onLogin }) {
  const [input, setInput] = useState("");
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (input.trim()) onLogin(input.trim());
      }}
      className="user-login-form"
    >
      <input
        className="input"
        type="text"
        placeholder="Name or nickname"
        maxLength={16}
        value={input}
        autoFocus
        onChange={e => setInput(e.target.value)}
        style={{ width: "80%", marginBottom: 8 }}
      />
      <button className="button accent" type="submit">Enter</button>
    </form>
  );
}

// PUBLIC_INTERFACE
function SettingsPanel({ speedIdx, setSpeedIdx, difficultyIdx, setDifficultyIdx, onStart }) {
  return (
    <div className="panel-section" style={{ marginTop: 60 }}>
      <h2 className="panel-title" style={{ textAlign: "center" }}>Game Settings</h2>
      <label className="panel-label">Speed</label>
      <div className="btn-group" style={{ justifyContent: "center", marginBottom: 8 }}>
        {SPEEDS.map((sp, idx) => (
          <button
            className={`button ${speedIdx === idx ? 'primary' : ''}`}
            key={sp.value}
            onClick={() => setSpeedIdx(idx)}
          >{sp.label}</button>
        ))}
      </div>
      <label className="panel-label" style={{ marginTop: 5 }}>Difficulty</label>
      <div className="btn-group" style={{ justifyContent: "center" }}>
        {DIFFICULTY_LEVELS.map((dl, idx) => (
          <button
            className={`button ${difficultyIdx === idx ? 'primary' : ''}`}
            key={dl.value}
            onClick={() => setDifficultyIdx(idx)}
          >{dl.label}</button>
        ))}
      </div>
      <button
        className="button accent"
        style={{ width: "100%", marginTop: 18, fontSize: 18 }}
        onClick={onStart}
        data-testid="start-game-btn"
      >Start Game</button>
    </div>
  );
}

// PUBLIC_INTERFACE
function Leaderboard({ scores, currentUser }) {
  const sorted = [...scores].sort((a, b) => b.score - a.score).slice(0, 8);
  return (
    <div className="panel-section" style={{ marginBottom: 16 }}>
      <h2 className="panel-title" style={{ fontSize: "1.11rem", textAlign: "left" }}>Leaderboard</h2>
      <ol className="leaderboard">
        {sorted.map((entry, idx) => (
          <li key={idx} className={entry.name === currentUser ? "me" : ""}>
            <span className="leaderboard-rank">{idx + 1}.</span>
            <span className="leaderboard-name">{entry.name}</span>
            <span className="leaderboard-score">{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * SnakeGame component for keyboard-movable Snake. 
 * Snake responds to arrow keys and moves at a speed based on the selected setting.
 * @param {Object} props - Includes speed, difficulty, running, callbacks, etc.
 */
function SnakeGame({ boardSize, speed, difficulty, running, onGameEnd, onScore, playerName }) {
  const [snake, setSnake] = useState([{ x: 8, y: 8 }]);
  const [food, setFood] = useState({ x: 12, y: 8 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Direction and move timer stored in refs for responsive behavior
  const directionRef = useRef("ArrowRight"); // latest direction, never stale
  const nextDirectionRef = useRef("ArrowRight"); // handle rapid key presses in a single tick
  const moveInterval = useRef(null);

  // Reset state between games
  useEffect(() => {
    // Reset everything when not running
    if (!running) {
      clearInterval(moveInterval.current);
      return;
    }
    setSnake([{ x: 8, y: 8 }]);
    setFood(randomCell(boardSize));
    setScore(0);
    setGameOver(false);

    directionRef.current = "ArrowRight";
    nextDirectionRef.current = "ArrowRight";
  }, [running, boardSize]);

  // Handle keydown events
  useEffect(() => {
    if (!running) return;

    const handleKey = e => {
      if (DIRECTIONS[e.key] && !isOpposite(directionRef.current, e.key)) {
        // prevent reverse-move, save nextDirection for next move tick
        nextDirectionRef.current = e.key;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running]);

  // Core movement/game loop: re-create interval whenever speed or running changes (or game starts)
  useEffect(() => {
    if (!running) {
      clearInterval(moveInterval.current);
      return;
    }
    clearInterval(moveInterval.current);

    moveInterval.current = setInterval(() => {
      // On each tick: update direction, move snake
      directionRef.current = nextDirectionRef.current;
      setSnake(prevSnake =>
        getNextSnake(
          prevSnake,
          directionRef.current,
          food,
          boardSize,
          difficulty,
          (cell) => setFood(cell),
          (sc) => setScore(sc => sc + 10),
          (v) => setGameOver(v)
        )
      );
    }, speed);

    return () => clearInterval(moveInterval.current);
  }, [speed, running, boardSize, difficulty, food]); // food as dep to refresh after score

  // End game and notify parent
  useEffect(() => {
    if (gameOver && running) {
      setTimeout(() => onGameEnd(score), 350);
      onScore(score);
    }
    // eslint-disable-next-line
  }, [gameOver]);

  // Draw the game board grid/cells
  return (
    <div className="game-board-container">
      <div
        className={`game-board${gameOver ? " game-over" : ""}`}
        tabIndex={0}
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          gridTemplateRows: `repeat(${boardSize}, 1fr)`
        }}
      >
        {[...Array(boardSize * boardSize).keys()].map(i => {
          const x = i % boardSize, y = Math.floor(i / boardSize);
          const snakePart = snake.find(seg => seg.x === x && seg.y === y);
          const foodHere = food.x === x && food.y === y;
          let color = "";
          if (snakePart) color = COLORS.primary;
          if (foodHere) color = COLORS.accent;
          return (
            <div
              key={i}
              className="cell"
              style={{
                background: color
                  ? color
                  : ((x + y) % 2 === 0 ? COLORS.bg : COLORS.grid)
              }}
            />
          );
        })}
        {gameOver && (
          <div className="game-over-overlay">
            <div>Game Over</div>
            <div className="score-popup">Score: {score}</div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 18, fontWeight: 500, color: COLORS.secondary }}>
        <span style={{ color: COLORS.accent }}>Score:</span> {score}
      </div>
    </div>
  );
}

// Helpers for Snake game logic
function getNextSnake(snake, dir, food, size, difficulty, setFood, setScore, setGameOver) {
  if (!dir) return snake;
  const d = DIRECTIONS[dir];
  const head = { x: snake[0].x + d.x, y: snake[0].y + d.y };

  // Border collision
  if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size) {
    setGameOver(true);
    return snake;
  }
  // Self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    setGameOver(true);
    return snake;
  }
  // Eat food
  let grow = false;
  if (head.x === food.x && head.y === food.y) {
    grow = true;
    setFood(randomCell(size, snake.concat([head])));
    setScore(s => s + 10);
  }

  const nextSnake = [head, ...snake];
  if (!grow) nextSnake.pop();
  // Hardcore: Remove food after N ticks (not implemented here)
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

//////////////////////////////////////////////
// MAIN APP - Multi-step flow logic and render
//////////////////////////////////////////////
function App() {
  // --- View state for multi-step process ---
  // one of: "login", "settings", "game", "gameover"
  const [page, setPage] = useState("login");

  // User state
  const [user, setUser] = useState(null);

  // Game settings state
  const [speedIdx, setSpeedIdx] = useState(1);
  const [difficultyIdx, setDifficultyIdx] = useState(1);

  // Score/leaderboard state
  const [maxScore, setMaxScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);

  // Leaderboard (with dummy data, update after play)
  const [scores, setScores] = useState([
    { name: "Alex", score: 182 },
    { name: "Sandy", score: 170 },
    { name: "Cleo", score: 161 }
  ]);

  // Game activity state
  const [inGame, setInGame] = useState(false);

  // ---- Transitions ----
  // [1] Login page onLogin → save user, go to settings
  function handleLogin(name) {
    setUser(name);
    setPage("settings");
  }

  // [2] Settings: start game
  function handleStartGame() {
    setCurrentScore(0);
    setInGame(true);
    setPage("game");
  }

  // [3] In-game: handle end by score, show game over
  function handleGameEnd(finalScore) {
    setInGame(false);
    setCurrentScore(finalScore);
    setPage("gameover");
  }

  // [4] Game over: Play Again returns to settings
  function handleReplay() {
    setPage("settings");
  }

  // Update best score & leaderboard after each game end
  useEffect(() => {
    // On new personal best, update max
    if (currentScore > maxScore) setMaxScore(currentScore);

    // Update leaderboard if user achieves new best, else add first
    if (currentScore > 0 && user) {
      setScores(scores => {
        const idx = scores.findIndex(s => s.name === user);
        if (idx < 0) return scores.concat([{ name: user, score: currentScore }]);
        if (scores[idx].score >= currentScore) return scores;
        const next = [...scores];
        next[idx] = { name: user, score: currentScore };
        return next;
      });
    }
    // eslint-disable-next-line
  }, [currentScore]);

  // ========= Views for each step ==========
  function LoginView() {
    return (
      <div className="main" style={{ justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 380, alignSelf: "center" }}>
          <div className="panel-section" style={{ margin: "0 auto", marginTop: 80 }}>
            <h1 style={{
              fontWeight: 800,
              fontSize: "2.1rem",
              color: COLORS.primary,
              letterSpacing: ".13em",
              textAlign: "center"
            }}>Snake Game</h1>
            <div style={{ color: COLORS.secondary, marginBottom: 16, textAlign: "center" }}>
              Play a classic game of Snake! Compete for top score. Enter your nickname to begin.
            </div>
            <LoginPanel onLogin={handleLogin} />
          </div>
          <footer className="footer" style={{ marginTop: 42, textAlign: "center" }}>
            <span style={{ color: COLORS.secondary }}>© 2024 Multiplayer Snake</span>
          </footer>
        </div>
      </div>
    );
  }

  function SettingsView() {
    return (
      <div className="main" style={{ justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 380, alignSelf: "center" }}>
          <div className="panel-section" style={{ margin: "0 auto", marginTop: 80 }}>
            <div style={{ color: COLORS.secondary, textAlign: "center", fontSize: 15, marginBottom: 5 }}>
              Hello, <span style={{ color: COLORS.primary, fontWeight: 700 }}>{user}</span>
            </div>
            <SettingsPanel
              speedIdx={speedIdx}
              setSpeedIdx={setSpeedIdx}
              difficultyIdx={difficultyIdx}
              setDifficultyIdx={setDifficultyIdx}
              onStart={handleStartGame}
            />
          </div>
          <footer className="footer" style={{ marginTop: 42, textAlign: "center" }}>
            <span style={{ color: COLORS.secondary }}>Choose your settings and play!</span>
          </footer>
        </div>
      </div>
    );
  }

  function GameView() {
    return (
      <div className="main">
        <h1 className="game-title">
          <span style={{ color: COLORS.primary }}>Snake</span>
          <span style={{ color: COLORS.accent, marginLeft: 10 }}>Game</span>
        </h1>
        <div className="game-canvas-box">
          <SnakeGame
            boardSize={BOARD_SIZE}
            speed={SPEEDS[speedIdx].value}
            difficulty={DIFFICULTY_LEVELS[difficultyIdx].value}
            running={inGame}
            onGameEnd={handleGameEnd}
            onScore={() => {}}
            playerName={user}
          />
          <div className="scoreboard-box">
            <div style={{ fontWeight: 400, color: COLORS.secondary, marginTop: 12 }}>
              <span style={{ color: COLORS.accent }}>Your Max Score:</span>{" "}
              <span style={{ color: COLORS.primary, fontWeight: 600, fontSize: "1.2rem" }}>{maxScore}</span>
            </div>
          </div>
        </div>
        <footer className="footer">
          <span style={{ color: COLORS.secondary }}>Use arrow keys. Good luck, {user}!</span>
        </footer>
      </div>
    );
  }

  function GameOverView() {
    // Best score for this user
    const leaderboardEntry = scores.find(s => s.name === user);
    const bestScore = leaderboardEntry ? leaderboardEntry.score : maxScore;
    return (
      <div className="main" style={{ justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
          <div className="panel-section" style={{ margin: "0 auto", marginTop: 70 }}>
            <h2 className="panel-title" style={{
              textAlign: "center",
              fontSize: "1.7rem",
              color: COLORS.primary,
              marginBottom: 10
            }}>Game Over</h2>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 18, color: COLORS.secondary }}>Score:</span>{" "}
              <span style={{ fontWeight: 600, fontSize: 24, color: COLORS.accent }}>{currentScore}</span>
            </div>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <span style={{ color: COLORS.primary, fontWeight: 500 }}>Best Score:</span>{" "}
              <span style={{ fontWeight: 700, fontSize: 20, color: COLORS.primary }}>{bestScore}</span>
            </div>
            <button className="button accent" style={{ width: "100%", margin: "16px 0" }}
              onClick={handleReplay}
            >Play Again</button>
            <div style={{ marginTop: 10, marginBottom: 5 }}>
              <Leaderboard scores={scores} currentUser={user} />
            </div>
          </div>
          <footer className="footer" style={{ marginTop: 12, textAlign: "center" }}>
            <span style={{ color: COLORS.secondary }}>See if you made the top scores, {user}!</span>
          </footer>
        </div>
      </div>
    );
  }

  // MAIN RENDER
  // Only one primary screen shown at a time
  return (
    <>
      {page === "login" && <LoginView />}
      {page === "settings" && <SettingsView />}
      {page === "game" && <GameView />}
      {page === "gameover" && <GameOverView />}
    </>
  );
}

export default App;
