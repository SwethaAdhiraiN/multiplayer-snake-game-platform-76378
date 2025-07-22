import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Component imports
import Sidebar from "./components/Sidebar";
import LoginPanel from "./components/LoginPanel";
import SettingsPanel from "./components/SettingsPanel";
import Leaderboard from "./components/Leaderboard";
import MultiplayerLobby from "./components/MultiplayerLobby";
import MultiplayerGame from "./components/MultiplayerGame";
import GameBoard from "./components/GameBoard";

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

function App() {
  // --- View state for multi-step process ---
  // one of: "login", "settings", "single", "multiplayer", "gameover"
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  // Game settings state
  const [speedIdx, setSpeedIdx] = useState(1);
  const [difficultyIdx, setDifficultyIdx] = useState(1);

  // Scores/local leaderboard
  const [maxScore, setMaxScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [scores, setScores] = useState([
    { name: "Alex", score: 182 },
    { name: "Sandy", score: 170 },
    { name: "Cleo", score: 161 }
  ]);
  // Multiplayer/session
  const [inSingleGame, setInSingleGame] = useState(false);
  const [inMultiGame, setInMultiGame] = useState(false);
  const [lobbyVisible, setLobbyVisible] = useState(false);
  const [roomId, setRoomId] = useState(null);

  // ---- Transitions/Actions
  function handleLogin(name) {
    setUser(name);
    setPage("settings");
  }

  function handleLogout() {
    setUser(null);
    setPage("login");
    setInSingleGame(false);
    setInMultiGame(false);
    setRoomId(null);
    setLobbyVisible(false);
  }

  // Single player
  function handleStartSingle() {
    setCurrentScore(0);
    setInSingleGame(true);
    setPage("single");
  }
  function handleGameEnd(finalScore) {
    setInSingleGame(false);
    setCurrentScore(finalScore);
    setPage("gameover");
  }
  // Multi player
  function handleLobby() {
    setLobbyVisible(true);
    setPage("multiplayer");
  }
  function handleJoinRoom(room) {
    setRoomId(room);
    setLobbyVisible(false);
    setInMultiGame(true);
    setPage("multiplayer");
  }
  function handleCreateRoom(newRoomName) {
    setRoomId("demo-" + newRoomName);
    setLobbyVisible(false);
    setInMultiGame(true);
    setPage("multiplayer");
  }
  function handleEndMultiGame() {
    setInMultiGame(false);
    setRoomId(null);
    setPage("settings");
  }
  function handleReplay() {
    setPage("settings");
  }

  // Update best score & leaderboard after each single game end
  useEffect(() => {
    if (currentScore > maxScore) setMaxScore(currentScore);
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

  // ========= VIEWS ==========
  function SettingsView() {
    return (
      <Sidebar
        user={user}
        onLogout={handleLogout}
        settingsPanel={
          <SettingsPanel
            speedIdx={speedIdx}
            setSpeedIdx={setSpeedIdx}
            difficultyIdx={difficultyIdx}
            setDifficultyIdx={setDifficultyIdx}
            onStart={handleStartSingle}
          />
        }
        leaderboardPanel={<Leaderboard scores={scores} currentUser={user} />}
        multiplayerPanel={
          <>
            <div className="panel-section" style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <button
                  className="button accent"
                  onClick={handleLobby}
                  style={{ fontSize: 16, padding: "8px 20px", width: "96%" }}
                  type="button"
                >
                  Multiplayer
                </button>
              </div>
            </div>
          </>
        }
      >
        <div style={{ flex: 1 }}>
          <div className="main" style={{ justifyContent: "center" }}>
            <h1 className="game-title" style={{ margin: "1.5rem 0" }}>
              <span style={{ color: "#34a853" }}>Snake</span>
              <span style={{ color: "#fbbc05", marginLeft: 10 }}>Game</span>
            </h1>
            <div style={{ color: "#222831", fontSize: 18, marginBottom: 18 }}>
              Hello, <span style={{ color: "#34a853", fontWeight: 700 }}>{user}</span>
            </div>
            <div className="panel-section" style={{ margin: "0 auto", maxWidth: 370 }}>
              <div style={{ textAlign: "center", fontWeight: 400, color: "#888" }}>
                Select your game settings and play solo, or join a multiplayer lobby!
              </div>
            </div>
            <footer className="footer" style={{ marginTop: 42, textAlign: "center" }}>
              <span style={{ color: "#888" }}>Choose your settings and play!</span>
            </footer>
          </div>
        </div>
      </Sidebar>
    );
  }

  function LoginView() {
    return (
      <div className="app-wrapper">
        <Sidebar user={null}>
          <main className="main" style={{ justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 380, alignSelf: "center" }}>
              <div className="panel-section" style={{ margin: "0 auto", marginTop: 80 }}>
                <h1
                  style={{
                    fontWeight: 800,
                    fontSize: "2.1rem",
                    color: "#34a853",
                    letterSpacing: ".13em",
                    textAlign: "center"
                  }}
                >
                  Snake Game
                </h1>
                <div style={{ color: "#222831", marginBottom: 16, textAlign: "center" }}>
                  Play a classic game of Snake! Compete for top score. Enter your nickname to begin.
                </div>
                <LoginPanel onLogin={handleLogin} />
              </div>
              <footer className="footer" style={{ marginTop: 42, textAlign: "center" }}>
                <span style={{ color: "#888" }}>© 2024 Multiplayer Snake</span>
              </footer>
            </div>
          </main>
        </Sidebar>
      </div>
    );
  }

  function SingleGameView() {
    const [inGame, setInGame] = useState(true);
    const [snake, setSnake] = useState([{ x: 8, y: 8 }]);
    const [food, setFood] = useState({ x: 12, y: 8 });
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const directionRef = useRef("ArrowRight");
    const nextDirectionRef = useRef("ArrowRight");
    const moveInterval = useRef(null);

    useEffect(() => {
      if (!inGame) {
        clearInterval(moveInterval.current);
        return;
      }
      setSnake([{ x: 8, y: 8 }]);
      setFood(randomCell(BOARD_SIZE));
      setScore(0);
      setGameOver(false);

      directionRef.current = "ArrowRight";
      nextDirectionRef.current = "ArrowRight";
    }, [inGame]);

    useEffect(() => {
      if (!inGame) return;
      const handleKey = e => {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
          !isOpposite(directionRef.current, e.key)
        ) {
          nextDirectionRef.current = e.key;
        }
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [inGame]);

    useEffect(() => {
      if (!inGame) {
        clearInterval(moveInterval.current);
        return;
      }
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
            sc => setScore(sc => sc + 10),
            v => setGameOver(v)
          )
        );
      }, SPEEDS[speedIdx].value);

      return () => clearInterval(moveInterval.current);
    }, [speedIdx, inGame, food, difficultyIdx]);

    useEffect(() => {
      if (gameOver && inGame) {
        setTimeout(() => {
          setInGame(false);
          handleGameEnd(score);
        }, 350);
      }
      // eslint-disable-next-line
    }, [gameOver]);

    function renderCell(x, y, key) {
      const snakePart = snake.find(seg => seg.x === x && seg.y === y);
      const foodHere = food.x === x && food.y === y;
      let color = "";
      if (snakePart) color = "#34a853";
      if (foodHere) color = "#fbbc05";
      return (
        <div
          key={key}
          className="cell"
          style={{
            background: color
              ? color
              : (x + y) % 2 === 0
              ? "#fff"
              : "#e9ecef"
          }}
        ></div>
      );
    }

    return (
      <div className="app-wrapper">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          settingsPanel={<></>}
          leaderboardPanel={<Leaderboard scores={scores} currentUser={user} />}
        >
          <main className="main">
            <h1 className="game-title">
              <span style={{ color: "#34a853" }}>Snake</span>
              <span style={{ color: "#fbbc05", marginLeft: 10 }}>Game</span>
            </h1>
            <div className="game-canvas-box">
              <GameBoard
                boardSize={BOARD_SIZE}
                renderCell={renderCell}
                overlay={
                  gameOver && (
                    <div className="game-over-overlay">
                      <div>Game Over</div>
                      <div className="score-popup">Score: {score}</div>
                    </div>
                  )
                }
                tabIndex={0}
              />
              <div className="scoreboard-box">
                <div style={{ fontWeight: 400, color: "#222831", marginTop: 12 }}>
                  <span style={{ color: "#fbbc05" }}>Your Max Score:</span>{" "}
                  <span style={{ color: "#34a853", fontWeight: 600, fontSize: "1.2rem" }}>{maxScore}</span>
                </div>
              </div>
            </div>
            <footer className="footer">
              <span style={{ color: "#888" }}>Use arrow keys. Good luck, {user}!</span>
            </footer>
          </main>
        </Sidebar>
      </div>
    );
  }

  function MultiPlayerView() {
    if (lobbyVisible || !inMultiGame) {
      return (
        <div className="app-wrapper">
          <Sidebar
            user={user}
            onLogout={handleLogout}
            settingsPanel={<></>}
            leaderboardPanel={<Leaderboard scores={scores} currentUser={user} />}
          >
            <main className="main" style={{ maxWidth: 640 }}>
              <MultiplayerLobby
                user={user}
                onJoin={handleJoinRoom}
                onCreateRoom={handleCreateRoom}
              />
              <button
                className="button minimal"
                onClick={() => setPage("settings")}
                style={{ marginTop: 10 }}
                type="button"
              >
                Back to Settings
              </button>
            </main>
          </Sidebar>
        </div>
      );
    }

    return (
      <div className="app-wrapper">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          settingsPanel={<></>}
          leaderboardPanel={<Leaderboard scores={scores} currentUser={user} />}
        >
          <main className="main">
            <h2 className="game-title">
              Multiplayer Room: <span style={{ color: "#fbbc05" }}>{roomId}</span>
            </h2>
            <MultiplayerGame
              playerName={user}
              opponentName={"Opponent"}
              onEnd={handleEndMultiGame}
            />
            <button
              className="button minimal"
              onClick={() => {
                setInMultiGame(false);
                setRoomId(null);
                setLobbyVisible(true);
                setPage("multiplayer");
              }}
              type="button"
              style={{ marginTop: 10 }}
            >
              Back to Lobby
            </button>
          </main>
        </Sidebar>
      </div>
    );
  }

  function GameOverView() {
    const leaderboardEntry = scores.find(s => s.name === user);
    const bestScore = leaderboardEntry ? leaderboardEntry.score : maxScore;
    return (
      <div className="app-wrapper">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          settingsPanel={<></>}
          leaderboardPanel={<Leaderboard scores={scores} currentUser={user} />}
        >
          <main className="main" style={{ justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
              <div className="panel-section" style={{ margin: "0 auto", marginTop: 70 }}>
                <h2
                  className="panel-title"
                  style={{
                    textAlign: "center",
                    fontSize: "1.7rem",
                    color: "#34a853",
                    marginBottom: 10
                  }}
                >
                  Game Over
                </h2>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 18, color: "#222831" }}>Score:</span>{" "}
                  <span style={{ fontWeight: 600, fontSize: 24, color: "#fbbc05" }}>{currentScore}</span>
                </div>
                <div style={{ textAlign: "center", marginBottom: 6 }}>
                  <span style={{ color: "#34a853", fontWeight: 500 }}>Best Score:</span>{" "}
                  <span style={{ fontWeight: 700, fontSize: 20, color: "#34a853" }}>{bestScore}</span>
                </div>
                <button
                  className="button accent"
                  style={{ width: "100%", margin: "16px 0" }}
                  onClick={handleReplay}
                  type="button"
                >
                  Play Again
                </button>
                <div style={{ marginTop: 10, marginBottom: 5 }}>
                  <Leaderboard scores={scores} currentUser={user} />
                </div>
              </div>
              <footer className="footer" style={{ marginTop: 12, textAlign: "center" }}>
                <span style={{ color: "#888" }}>See if you made the top scores, {user}!</span>
              </footer>
            </div>
          </main>
        </Sidebar>
      </div>
    );
  }

  return (
    <>
      {page === "login" && <LoginView />}
      {page === "settings" && <SettingsView />}
      {page === "single" && <SingleGameView />}
      {page === "multiplayer" && <MultiPlayerView />}
      {page === "gameover" && <GameOverView />}
    </>
  );
}

// Helpers (from original SnakeGame)
function getNextSnake(snake, dir, food, size, difficulty, setFood, setScore, setGameOver) {
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
