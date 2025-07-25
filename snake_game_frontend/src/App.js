import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Component imports
import GameBoard from "./components/GameBoard";
import Leaderboard from "./components/Leaderboard";
import LoginPanel from "./components/LoginPanel";
import SettingsPanel from "./components/SettingsPanel";
import Sidebar from "./components/Sidebar";
import MultiplayerLobby from "./components/MultiplayerLobby";
import MultiplayerGame from "./components/MultiplayerGame";

// --- Design/feature constants
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

const FLOW = {
  LOGIN: "login",
  SETUP: "setup",
  SINGLE: "singleplayer",
  MULTI_LOBBY: "multilobby",
  MULTI_WAIT: "multiwait",
  MULTI_GAME: "multiplayer",
  GAMEOVER: "gameover"
};

function App() {
  // ----- User & App State -----
  const [stage, setStage] = useState(FLOW.LOGIN);
  // Persistent user login from localStorage
  const [user, setUser] = useState(() => window.localStorage.getItem("snakeUser") || null);
  const [userToken, setUserToken] = useState(null);

  // Game Configs
  const [speedIdx, setSpeedIdx] = useState(1);
  const [difficultyIdx, setDifficultyIdx] = useState(1);

  // Multiplayer
  const [inMultiplayer, setInMultiplayer] = useState(false);
  const [multiRoom, setMultiRoom] = useState(null);
  const [multiOpponent, setMultiOpponent] = useState(null);

  // Score/Leaderboard state
  const [currentScore, setCurrentScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [scoresLoading, setScoresLoading] = useState(true);

  // ----- API endpoints/config -----
  const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000/api";

  // ----- Auth/Leaderboard Effect -----
  useEffect(() => {
    if (user) {
      fetchLeaderboard();
      fetchUserBest();
    }
    // eslint-disable-next-line
  }, [user]);

  // Fetch leaderboard from backend
  async function fetchLeaderboard() {
    setScoresLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLeaderboard(data?.scores || []);
    } catch {
      setLeaderboard([]);
    }
    setScoresLoading(false);
  }

  // Fetch just this user's best
  async function fetchUserBest() {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/scores/${encodeURIComponent(user)}`);
      if (!res.ok) throw new Error("User score missing");
      const d = await res.json();
      setMaxScore(typeof d.maxScore === "number" ? d.maxScore : 0);
    } catch {
      setMaxScore(0);
    }
  }

  // Post new score (single player)
  async function postScore(score) {
    if (!user) return;
    try {
      await fetch(`${API_BASE}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, score })
      });
      fetchLeaderboard();
      fetchUserBest();
    } catch {}
  }

  // ----- Flow Handlers -----

  // Step 1: Login
  async function handleLogin(name) {
    setUser(name);
    window.localStorage.setItem("snakeUser", name);
    setUserToken(""); // Placeholder for token if needed
    setStage(FLOW.SETUP);
  }

  // Step 2: Game setup (or Multiplayer switch)
  function handleStartGame() {
    setInMultiplayer(false);
    setStage(FLOW.SINGLE);
  }
  function handleGoMultiplayer() {
    setStage(FLOW.MULTI_LOBBY);
    setInMultiplayer(true);
    setMultiRoom(null);
    setMultiOpponent(null);
  }

  // Step 3: SINGLEPLAYER GAME & GAMEOVER
  function handleSingleComplete(score) {
    setCurrentScore(score);
    if (score > maxScore) setMaxScore(score);
    postScore(score);
    setStage(FLOW.GAMEOVER);
  }

  // Step 4: MULTIPLAYER FLOW
  function handleMultiplayerJoin(roomId) {
    setMultiRoom(roomId);
    setStage(FLOW.MULTI_WAIT);
    setTimeout(() => {
      setMultiOpponent("Opponent");
      setStage(FLOW.MULTI_GAME);
    }, 900);
  }
  function handleMultiplayerCreate(roomName) {
    setMultiRoom(roomName);
    setMultiOpponent(null);
    setStage(FLOW.MULTI_WAIT);
    setTimeout(() => {
      setMultiOpponent("Opponent");
      setStage(FLOW.MULTI_GAME);
    }, 1400);
  }
  function handleMultiplayerComplete(result) {
    setStage(FLOW.GAMEOVER);
  }
  function handleExitMultiplayer() {
    setMultiRoom(null);
    setMultiOpponent(null);
    setInMultiplayer(false);
    setStage(FLOW.SETUP);
  }

  // GAMEOVER & RESET FLOW
  function handleRestart() {
    setCurrentScore(0);
    setStage(FLOW.SETUP);
  }
  function handleLogout() {
    setUser(null);
    setUserToken(null);
    window.localStorage.removeItem("snakeUser");
    setStage(FLOW.LOGIN);
    setMaxScore(0);
    setLeaderboard([]);
    setCurrentScore(0);
    setInMultiplayer(false);
    setMultiRoom(null);
    setMultiOpponent(null);
  }

  // ----- Screens -----
  function LoginScreen() {
    return (
      <div className="gameflow-bg">
        <div className="gameflow-panel login">
          <div className="gameflow-title">Snake Game</div>
          <div className="gameflow-desc">
            Welcome! Enter your nickname to play.
          </div>
          <LoginPanel onLogin={handleLogin} />
        </div>
        <footer className="gameflow-footer">
          Multiplayer Snake &copy; 2024
        </footer>
      </div>
    );
  }

  function SetupScreen() {
    return (
      <div className="app-wrapper responsive-root">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          settingsPanel={
            <SettingsPanel
              speedIdx={speedIdx}
              setSpeedIdx={setSpeedIdx}
              difficultyIdx={difficultyIdx}
              setDifficultyIdx={setDifficultyIdx}
              onStart={handleStartGame}
            />
          }
          leaderboardPanel={
            <Leaderboard
              scores={leaderboard.length ? leaderboard : [{ name: user, score: maxScore }]}
              currentUser={user}
            />
          }
          multiplayerPanel={
            <div className="panel-section">
              <h2 className="panel-title" style={{ textAlign: "center" }}>Multiplayer</h2>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                Compete live with friends!
              </div>
              <button
                className="button primary"
                onClick={handleGoMultiplayer}
                type="button"
                style={{ width: "100%" }}
              >
                Multiplayer Lobby
              </button>
            </div>
          }
        />
        <main className="main main-responsive">
          <div className="game-title">Single Player Snake</div>
          <div className="gameflow-panel">
            <div className="gameflow-desc" style={{ fontSize: 15 }}>
              <span style={{ color: "#222831" }}>Welcome,</span>{" "}
              <span style={{ color: "#34a853", fontWeight: 700 }}>{user}</span>
              . Try to beat your high score!
            </div>
            <div className="scoreboard-box" style={{ margin: "8px 0 0 0" }}>
              <span style={{ color: "#222831" }}>Personal Best:</span>{" "}
              <span style={{ color: "#fbbc05", fontWeight: 700 }}>{maxScore}</span>
            </div>
            <button
              className="button accent"
              style={{ width: "100%", marginTop: 16, fontSize: 18 }}
              onClick={handleStartGame}
            >
              Start Single-Player Game
            </button>
            <button
              className="button"
              style={{ width: "100%", marginTop: 10, fontSize: 16, border: "1.5px solid #e9ecef" }}
              onClick={handleGoMultiplayer}
            >
              Go to Multiplayer
            </button>
          </div>
        </main>
      </div>
    );
  }

  function SinglePlayerGameScreen() {
    // State for snake, food, score, etc.
    const [snake, setSnake] = useState([{ x: 8, y: 8 }]);
    const [food, setFood] = useState(randomCell(BOARD_SIZE));
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const directionRef = useRef("ArrowRight");
    const nextDirectionRef = useRef("ArrowRight");
    const moveInterval = useRef(null);

    useEffect(() => {
      setSnake([{ x: 8, y: 8 }]);
      setFood(randomCell(BOARD_SIZE));
      setScore(0);
      setGameOver(false);
      directionRef.current = "ArrowRight";
      nextDirectionRef.current = "ArrowRight";
      window.focus();
    }, []);

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

    useEffect(() => {
      if (gameOver) {
        setTimeout(() => {
          handleSingleComplete(score);
        }, 700);
      }
      // eslint-disable-next-line
    }, [gameOver]);

    // Classic 2D: renderCell with flat style
    function renderCell(x, y, key) {
      const snakeIndex = snake.findIndex(seg => seg.x === x && seg.y === y);
      const foodHere = food.x === x && food.y === y;
      let cellClass = "cell";
      if (snakeIndex === 0) {
        cellClass += " snake snake-head";
      } else if (snakeIndex > 0) {
        cellClass += " snake";
      } else if (foodHere) {
        cellClass += " food";
      }
      // Fallback "chessboard" ground pattern if empty
      let cellBg = undefined;
      if (!(snakeIndex >= 0) && !foodHere) {
        cellBg = (x + y) % 2 === 0
          ? "#f7f7fa"
          : "#ecf2f8";
      }
      return (
        <div
          key={key}
          className={cellClass}
          style={{
            background: cellClass.includes("snake") || cellClass.includes("food")
              ? undefined
              : cellBg,
            borderRadius: cellClass.includes("snake") || cellClass.includes("food") ? "8px" : "3.5px"
          }}
        ></div>
      );
    }

    return (
      <div className="app-wrapper">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          settingsPanel={<SettingsPanel
            speedIdx={speedIdx}
            setSpeedIdx={setSpeedIdx}
            difficultyIdx={difficultyIdx}
            setDifficultyIdx={setDifficultyIdx}
            onStart={handleRestart}
          />}
          leaderboardPanel={<Leaderboard scores={leaderboard} currentUser={user} />}
        />
        <main className="main">
          <div className="game-title" style={{ marginTop: 28, marginBottom: 8 }}>Snake Game</div>
          <div className="game-session-meta" style={{ justifyContent: "center", marginBottom: 10 }}>
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
                  <div className="game-over-overlay">
                    <div style={{ fontWeight: 900, color: "#e0663c", letterSpacing: ".02em" }}>Game Over</div>
                    <div className="score-popup">
                      Score: <span style={{ color: "#fbbc05", fontWeight: 700 }}>{score}</span>
                    </div>
                  </div>
                )
              }
            />
            <div className="scoreboard-box" style={{ marginBottom: 6, marginTop: 13 }}>
              <span style={{ color: "#666", fontWeight: 500 }}>Score:&nbsp;</span>
              <span style={{ color: "#34a853", fontWeight: 700, fontSize: "1.17rem" }}>{score}</span>
              <span style={{ marginLeft: 13, color: "#888" }}>| Best: {" "}</span>
              <span style={{ color: "#fbbc05", fontWeight: 700, fontSize: "1.11rem" }}>{maxScore}</span>
            </div>
          </div>
          <footer className="footer" style={{ margin: "15px 0 0 0" }}>
            <span style={{ color: "#888" }}>Use arrow keys &mdash; Good luck!</span>
          </footer>
        </main>
      </div>
    );
  }

  function GameoverScreen() {
    return (
      <div className="app-wrapper">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          leaderboardPanel={<Leaderboard scores={leaderboard} currentUser={user} />}
        />
        <main className="main">
          <div className="gameflow-panel gameover" style={{ maxWidth: 410, width: "96%", margin: "2em auto" }}>
            <div className="gameflow-title">Game Over</div>
            <div className="score-popup" style={{ fontSize: "2.2rem", color: "#fbbc05" }}>
              Score: {currentScore}
            </div>
            <div style={{ marginTop: 10, color: "#34a853", fontWeight: 400, fontSize: "1.13rem" }}>
              Personal Best: {maxScore}
            </div>
            <button
              className="button accent"
              style={{ width: "100%", marginTop: 18, fontSize: 20 }}
              onClick={handleRestart}
              autoFocus
            >
              Play Again
            </button>
            <button
              className="button minimal"
              style={{ marginTop: 8, float: "right", opacity: 0.7, fontSize: "1rem" }}
              onClick={handleLogout}
            >
              Log out
            </button>
            <div style={{ margin: "2.5em 0 0.2em 0" }}>
              <Leaderboard scores={leaderboard} currentUser={user} />
            </div>
          </div>
          <footer className="gameflow-footer">
            Can you beat your score? Try again!
          </footer>
        </main>
      </div>
    );
  }

  function MultiplayerLobbyScreen() {
    return (
      <div className="app-wrapper">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          leaderboardPanel={<Leaderboard scores={leaderboard} currentUser={user} />}
          multiplayerPanel={
            <MultiplayerLobby
              user={user}
              onJoin={handleMultiplayerJoin}
              onCreateRoom={handleMultiplayerCreate}
            />
          }
        />
        <main className="main" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="game-title">Multiplayer Lobby</div>
          <div className="gameflow-panel" style={{ minWidth: 340, maxWidth: 430 }}>
            <div className="gameflow-desc" style={{ fontSize: 15 }}>
              Join a room or create one to play Snake against others!
            </div>
          </div>
        </main>
      </div>
    );
  }

  function MultiplayerWaitingScreen() {
    return (
      <div className="app-wrapper">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          leaderboardPanel={<Leaderboard scores={leaderboard} currentUser={user} />}
        />
        <main className="main" style={{ justifyContent: "center" }}>
          <div className="gameflow-panel" style={{ minWidth: 320, maxWidth: 420 }}>
            <div className="gameflow-title">Room: {multiRoom ? multiRoom : "..."}</div>
            <div style={{ color: "#34a853", marginBottom: 24, marginTop: 12, fontSize: 19 }}>
              Waiting for opponent...
            </div>
            <button
              className="button accent"
              style={{ width: "100%", marginTop: 12 }}
              onClick={handleExitMultiplayer}
            >
              Leave Room
            </button>
          </div>
        </main>
      </div>
    );
  }

  function MultiplayerGameScreen() {
    return (
      <div className="app-wrapper">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          leaderboardPanel={<Leaderboard scores={leaderboard} currentUser={user} />}
        />
        <main className="main">
          <div className="game-title" style={{ marginTop: 24, marginBottom: 12 }}>
            Multiplayer Game
          </div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Room: {multiRoom}</div>
          <div style={{ fontWeight: 400, color: "#222831b2", marginBottom: 18 }}>
            Competing: <span className="competitor-pill">{user}</span>
            {multiOpponent && <span className="competitor-pill">{multiOpponent}</span>}
          </div>
          <MultiplayerGame
            playerName={user}
            opponentName={multiOpponent}
            onEnd={handleMultiplayerComplete}
          />
          <footer className="footer" style={{ margin: "12px 0 0 0" }}>
            Winner is the last snake alive!
          </footer>
          <button
            className="button accent"
            style={{ marginTop: 16, width: 140, fontSize: 15 }}
            onClick={handleExitMultiplayer}
          >
            Exit Multiplayer
          </button>
        </main>
      </div>
    );
  }

  // Main render
  return (
    <>
      {stage === FLOW.LOGIN && <LoginScreen />}
      {stage === FLOW.SETUP && <SetupScreen />}
      {stage === FLOW.SINGLE && <SinglePlayerGameScreen />}
      {stage === FLOW.MULTI_LOBBY && <MultiplayerLobbyScreen />}
      {stage === FLOW.MULTI_WAIT && <MultiplayerWaitingScreen />}
      {stage === FLOW.MULTI_GAME && <MultiplayerGameScreen />}
      {stage === FLOW.GAMEOVER && <GameoverScreen />}
    </>
  );
}

// --- Helpers ---
// PUBLIC_INTERFACE
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
  // Wall collision = game over
  if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size) {
    setGameOver(true);
    return snake;
  }
  // Self collision
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
// PUBLIC_INTERFACE
function isOpposite(dir, next) {
  if ((dir === "ArrowUp" && next === "ArrowDown") || (dir === "ArrowDown" && next === "ArrowUp")) return true;
  if ((dir === "ArrowLeft" && next === "ArrowRight") || (dir === "ArrowRight" && next === "ArrowLeft")) return true;
  return false;
}
// PUBLIC_INTERFACE
function randomCell(size, exclude = []) {
  let tries = 0;
  while (true) {
    const cell = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
    if (!exclude.some(c => c.x === cell.x && c.y === cell.y)) return cell;
    if (++tries > 1000) return { x: 0, y: 0 };
  }
}

export default App;
