import React from "react";

/**
 * PUBLIC_INTERFACE
 * Leaderboard displays a ranked, ordered list of player scores.
 * @param {Object} props - { scores, currentUser }
 */
function Leaderboard({ scores, currentUser }) {
  if (!scores || !scores.length) return null;
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

export default Leaderboard;
