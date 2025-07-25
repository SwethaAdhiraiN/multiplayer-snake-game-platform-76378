import React from "react";

/**
 * PUBLIC_INTERFACE
 * GameBoard - Displays the snake game grid board and all its contents (snake, food, overlays) with 3D effect.
 * @param {Object} props - { boardSize, renderCell, overlay, className, ... }
 */
function GameBoard({ boardSize, renderCell, overlay, className = "", ...rest }) {
  // 3D wrapper applies a perspective to the board for a 3D effect
  return (
    <div className="game-board-3d-wrapper">
      <div
        className={`game-board${className ? ` ${className}` : ""}`}
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          gridTemplateRows: `repeat(${boardSize}, 1fr)`,
          position: "relative"
        }}
        {...rest}
      >
        {[...Array(boardSize * boardSize).keys()].map(i => {
          const x = i % boardSize,
            y = Math.floor(i / boardSize);
          return renderCell(x, y, `${x},${y}`);
        })}
        {overlay}
      </div>
    </div>
  );
}

export default GameBoard;
