import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Color palette
const COLORS = {
  primary: "#34a853",      // Green
  secondary: "#222831",    // Very dark gray
  accent: "#fbbc05",       // Orange
  bg: "#ffffff",           // Light BG
  sidebar: "#f8f9fa",
  grid: "#e9ecef",
};

// SNAKE GAME CONSTANTS (Can be tuned in settings)
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
const BOARD_SIZE = 20; // GRID SIZE: 20x20

// Direction deltas
const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

//////////////////////////////////////////////
// USER IDENTIFICATION/LOGIN (Frontend Only)
//////////////////////////////////////////////
// PUBLIC_INTERFACE
function LoginPanel({ user, onLogin }) {
  const [input, setInput] = useState("");
  return (
    <div className="panel-section">
      <h2 className="panel-title">User Login</h2>
      {user ? (
        <div className="user-hello">👋 Welcome, <b>{user}</b>!</div>
      ) : (
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
            onChange={e => setInput(e.target.value)}
            style={{ width: "80%", marginBottom: 8 }}
          />
          <button className="button accent" type="submit">Enter</button>
        </form>
      )}
    </div>
  );
}

//////////////////////////////////////////////
// GAME SETTINGS/SIDEBAR
//////////////////////////////////////////////
// PUBLIC_INTERFACE
function SettingsPanel({
  speedIdx, setSpeedIdx,
  difficultyIdx, setDifficultyIdx,
  onModeSwitch, gameMode,
  isInGame,
  startSinglePlayer, enterMultiplayer,
}) {
  return (
    <div className="panel-section">
      <h2 className="panel-title">Game Settings</h2>
      {/* Speed selector */}
      <label className="panel-label">Speed</label>
      <div className="btn-group">
        {SPEEDS.map((sp, idx) => (
          <button
            className={`button ${speedIdx===idx?'primary':''}`}
            key={sp.value}
            disabled={isInGame}
            onClick={() => setSpeedIdx(idx)}
          >{sp.label}</button>
        ))}
      </div>
      {/* Difficulty selector */}
      <label className="panel-label" style={{marginTop:12}}>Difficulty</label>
      <div className="btn-group">
        {DIFFICULTY_LEVELS.map((dl, idx) => (
          <button
            className={`button ${difficultyIdx===idx?'primary':''}`}
            key={dl.value}
            disabled={isInGame}
            onClick={() => setDifficultyIdx(idx)}
          >{dl.label}</button>
        ))}
      </div>
      {/* Mode control */}
      <div style={{margin:"16px 0 0 0"}}>
        {gameMode === "single" ? (
          <button className="button accent" style={{width: "100%"}} onClick={startSinglePlayer} disabled={isInGame}>Play Solo</button>
        ) : (
          <button className="button accent" style={{width: "100%"}} onClick={enterMultiplayer} disabled={isInGame}>Join Multiplayer</button>
        )}
        <div style={{margin:"8px 0"}}>
          <button className="button minimal" style={{fontSize:13}}
            onClick={onModeSwitch}
            disabled={isInGame}
          >
            Switch to {gameMode==='single' ? 'Multiplayer' : 'Single-Player'}
          </button>
        </div>
      </div>
    </div>
  );
}

//////////////////////////////////////////////
// SCOREBOARD / LEADERBOARD
//////////////////////////////////////////////
// Prepare dummy data; to be replaced with backend fetch in integration
const DUMMY_LEADERBOARD = [
  { name: "Alex", score: 182 },
  { name: "Sandy", score: 170 },
  { name: "Cleo", score: 161 },
  { name: "User", score: 92 },
];

// PUBLIC_INTERFACE
function Leaderboard({ scores, currentUser }) {
  // Sort and take top 8
  const sorted = [...scores].sort((a,b)=>b.score - a.score).slice(0,8);
  return (
    <div className="panel-section">
      <h2 className="panel-title">Leaderboard</h2>
      <ol className="leaderboard">
        {sorted.map((entry, idx) => (
          <li key={idx} className={entry.name===currentUser ? "me" : ""}>
            <span className="leaderboard-rank">{idx+1}.</span>
            <span className="leaderboard-name">{entry.name}</span>
            <span className="leaderboard-score">{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

//////////////////////////////////////////////
// MULTIPLAYER LOBBY SIM (No real backend)
//////////////////////////////////////////////
// Placeholder: In real app, lobby state comes from backend WS/API
function MultiplayerLobby({ userList, isInGame, onStart }) {
  return (
    <div className="panel-section">
      <h2 className="panel-title">Multiplayer Lobby</h2>
      <ul className="lobby-list">
        {userList.map((u, i) => (
          <li key={i}>
            <span className="lobby-avatar">{u.emoji||"😀"}</span>{" "}
            <span className="lobby-name">{u.name}</span>
          </li>
        ))}
      </ul>
      <button className="button accent" disabled={isInGame} style={{marginTop:10}} onClick={onStart}>
        {isInGame ? "Game in Progress" : "Start Multiplayer"}
      </button>
    </div>
  );
}

//////////////////////////////////////////////
// SNAKE GAME CORE
//////////////////////////////////////////////
// PUBLIC_INTERFACE
function SnakeGame({
  boardSize = BOARD_SIZE,
  speed = SPEEDS[1].value,
  difficulty = DIFFICULTY_LEVELS[1].value,
  running,
  onGameEnd,
  onScore,
  multiplayer = false,
  playerName,
  competitors = []
}) {
  // Game State
  const [snake, setSnake] = useState([{x: 8, y:8}]);
  const [direction, setDirection] = useState("ArrowRight");
  const [food, setFood] = useState({x:12, y:8});
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Used for game loop / key events
  const moveInterval = useRef(null);

  // Effect for running/ending game
  useEffect(() => {
    if (!running) {
      clearInterval(moveInterval.current);
      return;
    }
    setSnake([{x:8,y:8}]);
    setDirection("ArrowRight");
    setFood(randomCell(boardSize));
    setScore(0);
    setGameOver(false);

    // Movement Loop
    moveInterval.current = setInterval(() => {
      setSnake(prev => getNextSnake(prev, direction, food, boardSize, difficulty, setFood, setScore, setGameOver));
    }, speed);

    // Keyboard input
    const handleKey = (e) => {
      if(DIRECTIONS[e.key] && !isOpposite(direction, e.key)){
        setDirection(e.key);
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      clearInterval(moveInterval.current);
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line
  }, [running, speed, difficulty]);

  // End game effect
  useEffect(() => {
    if (gameOver && running) {
      setTimeout(() => onGameEnd(score), 380);
      onScore(score); // For score updates
    }
    // eslint-disable-next-line
  }, [gameOver]);

  // Draw the game board
  return (
    <div className="game-board-container">
      <div
        className={`game-board ${gameOver ? "game-over" : ""}`}
        tabIndex={0}
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          gridTemplateRows: `repeat(${boardSize}, 1fr)`
        }}
      >
        {[...Array(boardSize*boardSize).keys()].map(i => {
          const x = i % boardSize, y = Math.floor(i/boardSize);
          const snakePart = snake.find(seg => seg.x===x && seg.y===y);
          const foodHere = food.x===x && food.y===y;
          let color = "";
          if (snakePart) color = COLORS.primary;
          if (foodHere) color = COLORS.accent;
          return (
            <div
              key={i}
              className="cell"
              style={{
                background: color ? color : ((x+y)%2===0 ? COLORS.bg : COLORS.grid)
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
      <div style={{marginTop:16, fontWeight:500}}>
        <span style={{color:COLORS.accent}}>Score:</span> {score}
      </div>
      {/* Multiplayer stub: show competitors */}
      {multiplayer && competitors.length > 1 &&
        <div style={{marginTop:"1rem"}}>
          <div style={{fontWeight:400, fontSize:"1rem", color:COLORS.secondary}}>Competitors:</div>
          {competitors.map((c,i) => (
            <span key={i} className="competitor-pill" style={{background: c.name===playerName?COLORS.primary:COLORS.grid}}>
              {c.emoji||"😀"} {c.name}
            </span>
          ))}
        </div>
      }
    </div>
  );
}

// Helper: next snake state (+food, collisions, etc.)
function getNextSnake(snake, dir, food, size, difficulty, setFood, setScore, setGameOver) {
  if (!dir) return snake;
  const d = DIRECTIONS[dir];
  const head = { x: snake[0].x + d.x, y: snake[0].y + d.y };

  // Collision: Borders
  if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size) {
    setGameOver(true); return snake;
  }
  // Collision: Self
  if (snake.some(s => s.x===head.x && s.y===head.y)) {
    setGameOver(true); return snake;
  }
  // Eat food
  let grow = false;
  if (head.x === food.x && head.y === food.y) {
    grow = true;
    setFood(randomCell(size, snake.concat([head])));
    setScore(s => s+10);
  }

  const nextSnake = [head, ...snake];
  if (!grow) nextSnake.pop();
  // Hardcore: Remove food after N ticks (not implemented here)
  return nextSnake;
}
function isOpposite(dir, next) {
  if ((dir==="ArrowUp"&&next==="ArrowDown")||(dir==="ArrowDown"&&next==="ArrowUp")) return true;
  if ((dir==="ArrowLeft"&&next==="ArrowRight")||(dir==="ArrowRight"&&next==="ArrowLeft")) return true;
  return false;
}
function randomCell(size, exclude=[]) {
  let tries=0;
  while(true){
    const cell = {x: Math.floor(Math.random()*size), y: Math.floor(Math.random()*size)};
    if (!exclude.some(c=>c.x===cell.x&&c.y===cell.y)) return cell;
    if (++tries>1000) return {x:0, y:0}; // fallback
  }
}

//////////////////////////////////////////////
// MAIN APP
//////////////////////////////////////////////
function App() {
  // Theme mode
  const [theme] = useState("light"); // Light only
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // App States
  const [user, setUser] = useState(null);
  const [maxScore, setMaxScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [scores, setScores] = useState(DUMMY_LEADERBOARD);
  const [speedIdx, setSpeedIdx] = useState(1); // Normal
  const [difficultyIdx, setDifficultyIdx] = useState(1); // Classic
  const [gameMode, setGameMode] = useState("single"); // or "multi"
  const [inGame, setInGame] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [lobbyUsers, setLobbyUsers] = useState([
    {name: "Alex", emoji: "😎"},{name: "Sandy", emoji: "🙂"}
  ]);

  // Score effect/tracking
  useEffect(()=>{
    // On new high, update max
    if(currentScore > maxScore) setMaxScore(currentScore);
    // Update global leaderboard if needed
    if(currentScore>0 && user){
      setScores(scores=>{
        // Only update if beaten old score
        const idx = scores.findIndex(s=>s.name===user);
        if(idx<0) return scores.concat([{name:user, score:currentScore}]);
        if(scores[idx].score >= currentScore) return scores;
        const next = [...scores];
        next[idx] = {name:user, score:currentScore};
        return next;
      });
    }
    // eslint-disable-next-line
  },[currentScore]);

  // PUBLIC_INTERFACE
  function handleStartSingle(){
    setInGame(true); setShowLobby(false); setCurrentScore(0);
  }
  function handleGameEnd(score){
    setInGame(false);
    setCurrentScore(score);
  }
  function handleMultiplayerStart(){
    setInGame(true);
    setShowLobby(false);
    setLobbyUsers(lobbyUsers=>{
      if(!user) return lobbyUsers;
      // Only add current user if not present
      if(lobbyUsers.some(u=>u.name===user)) return lobbyUsers;
      return lobbyUsers.concat([{name:user,emoji:"😇"}]);
    });
  }
  // For demonstration, multiplayer game is just the singleplayer game for now
  const handleModeSwitch = ()=> {
    setGameMode(gameMode==="single" ? "multi" : "single");
    setShowLobby(gameMode==="single");
  };
  function handleJoinLobby(){
    setShowLobby(true);
    if(user && !lobbyUsers.some(u=>u.name===user)){
      setLobbyUsers([...lobbyUsers, {name:user,emoji:"😇"}]);
    }
  }

  return (
    <div className="app-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <LoginPanel user={user} onLogin={setUser} />
        <SettingsPanel
          speedIdx={speedIdx} setSpeedIdx={setSpeedIdx}
          difficultyIdx={difficultyIdx} setDifficultyIdx={setDifficultyIdx}
          onModeSwitch={handleModeSwitch} gameMode={gameMode}
          isInGame={inGame}
          startSinglePlayer={handleStartSingle}
          enterMultiplayer={handleJoinLobby}
        />
        <Leaderboard scores={scores} currentUser={user} />
      </aside>

      {/* Main game area */}
      <main className="main">
        <h1 className="game-title">
          <span style={{color:COLORS.primary}}>Snake</span>
          <span style={{color:COLORS.accent,marginLeft:10}}>Game</span>
        </h1>
        <div className="game-canvas-box">
        {/* Show multiplayer lobby or game */}
        {gameMode==="multi" && showLobby && (
          <MultiplayerLobby
            userList={lobbyUsers}
            isInGame={inGame}
            onStart={handleMultiplayerStart}
          />
        )}
        {((gameMode==="single") || (gameMode==="multi"&&!showLobby)) && (
          <SnakeGame
            boardSize={BOARD_SIZE}
            speed={SPEEDS[speedIdx].value}
            difficulty={DIFFICULTY_LEVELS[difficultyIdx].value}
            running={inGame}
            onGameEnd={handleGameEnd}
            onScore={()=>{}}
            multiplayer={gameMode==="multi"}
            playerName={user}
            competitors={gameMode==="multi"?lobbyUsers:[]}
          />
        )}
        <div className="scoreboard-box">
          <div style={{fontWeight: 400, color:COLORS.secondary, marginTop:12}}>
            <span style={{color:COLORS.accent}}>Your Max Score:</span>{" "}
            <span style={{color:COLORS.primary, fontWeight:600, fontSize:"1.2rem"}}>{maxScore}</span>
          </div>
        </div>
        </div>
        <footer className="footer">
          <span style={{color: COLORS.secondary}}>© 2024 Multiplayer Snake | Demo | UI ready for API/WS integration</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
