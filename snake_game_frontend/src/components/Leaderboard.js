import React from "react";

/**
 * PUBLIC_INTERFACE
 * Leaderboard displays a ranked, ordered list of player scores with crown for top user,
 * highlights for the current user, and modern UI improvements.
 * @param {Object} props - { scores, currentUser }
 */
function Leaderboard({ scores, currentUser }) {
  if (!scores || !scores.length) return null;
  // Ensure all scores have both name and score and avoid duplicates
  const validScores = scores.filter(
    (entry) => entry && typeof entry.name === "string" && typeof entry.score === "number"
  );

  // Sort descending, then limit top 8
  const sorted = [...validScores].sort((a, b) => b.score - a.score).slice(0, 8);

  // Find current user in leaderboard and their rank
  const currentIdx = sorted.findIndex((entry) => entry.name === currentUser);

  // Styling helpers
  const getRankIcon = (rank) => {
    if (rank === 0) {
      // Unicode crown with yellow accent color
      return (
        <span
          style={{
            fontSize: "1.19em",
            marginRight: 4,
            color: "#fbbc05",
            verticalAlign: "-0.08em",
            filter: "drop-shadow(0px 2px 2.5px #f8d35480)",
          }}
          title="Top Rank"
          aria-label="Crown"
        >
          👑
        </span>
      );
    }
    return (
      <span
        className="leaderboard-rank"
        style={{
          color: rank < 3 ? "#34a853" : "#adb5bd",
          fontWeight: 600,
          width: "1.6em",
          display: "inline-block",
          textAlign: "right",
          opacity: rank < 5 ? 0.92 : 0.75,
        }}
      >
        {rank + 1}.
      </span>
    );
  };

  return (
    <div className="panel-section" style={{ marginBottom: 16, background: "#fafbfe", border: "1.5px solid #e8f2eed1" }}>
      <h2 className="panel-title" style={{ fontSize: "1.11rem", textAlign: "left", color: "#222831" }}>
        Leaderboard
      </h2>
      <ol className="leaderboard">
        {sorted.map((entry, idx) => {
          const isCurrent = entry.name === currentUser;
          return (
            <li
              key={entry.name}
              className={isCurrent ? "me" : ""}
              style={{
                background: isCurrent ? "#fff9e3" : idx === 0 ? "#fffbe3" : undefined,
                borderLeft: isCurrent
                  ? "5px solid #fbbc05"
                  : idx === 0
                  ? "4px solid #fbbc05"
                  : "none",
                borderRadius: isCurrent || idx === 0 ? "8px" : "0",
                fontWeight: isCurrent ? 700 : idx === 0 ? 700 : 400,
                color: isCurrent ? "#1a1a1a" : idx === 0 ? "#222831" : "#333c",
                boxShadow: isCurrent
                  ? "0 2px 10px 0 #ffd75533"
                  : idx === 0
                  ? "0 2px 10px 0 #f8d35421"
                  : "none",
                transform: isCurrent ? "scale(1.02)" : "none",
                position: "relative",
                transition: "background 0.18s, border 0.18s, box-shadow 0.18s",
                zIndex: isCurrent ? 1 : 0,
              }}
            >
              <span style={{ minWidth: 28, display: "inline-block" }}>{getRankIcon(idx)}</span>
              <span
                className="leaderboard-name"
                style={{
                  marginLeft: 7,
                  color: idx === 0 ? "#e87a41" : "#222831",
                  fontWeight: isCurrent || idx < 3 ? 700 : 500,
                  letterSpacing: idx === 0 ? ".01em" : ".0em",
                  textShadow:
                    idx === 0
                      ? "1.3px 1.8px 0px #ffe58630"
                      : isCurrent
                      ? "0.8px 1.5px 0px #fbbc0534"
                      : "none",
                }}
              >
                {entry.name}
              </span>
              <span
                className="leaderboard-score"
                style={{
                  marginLeft: 16,
                  color: "#34a853",
                  fontWeight: 700,
                  fontSize: idx === 0 ? "1.05em" : "1em",
                  letterSpacing: ".01em",
                }}
              >
                {entry.score}
              </span>
            </li>
          );
        })}
      </ol>
      {typeof currentIdx === "number" && currentIdx === -1 && currentUser && (
        <div style={{ fontSize: 12.5, color: "#adb5bd", marginTop: 6 }}>
          Play to enter the leaderboard, <span style={{ color: "#1a1a1a" }}>{currentUser}</span>!
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
