import React from "react";

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

/**
 * PUBLIC_INTERFACE
 * SettingsPanel - Select speed and difficulty. Includes Start button.
 * @param {Object} props
 */
function SettingsPanel({ speedIdx, setSpeedIdx, difficultyIdx, setDifficultyIdx, onStart }) {
  return (
    <div className="panel-section" style={{ marginTop: 10 }}>
      <h2 className="panel-title" style={{ textAlign: "center" }}>Game Settings</h2>
      <label className="panel-label">Speed</label>
      <div className="btn-group" style={{ justifyContent: "center", marginBottom: 8 }}>
        {SPEEDS.map((sp, idx) => (
          <button
            className={`button ${speedIdx === idx ? 'primary' : ''}`}
            key={sp.value}
            onClick={() => setSpeedIdx(idx)}
            type="button"
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
            type="button"
          >{dl.label}</button>
        ))}
      </div>
      <button
        className="button accent"
        style={{ width: "100%", marginTop: 18, fontSize: 18 }}
        onClick={onStart}
        data-testid="start-game-btn"
        type="button"
      >Start Game</button>
    </div>
  );
}

export default SettingsPanel;
