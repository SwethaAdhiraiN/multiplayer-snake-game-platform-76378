import React from "react";

/**
 * PUBLIC_INTERFACE
 * GameBoard - Displays the snake game grid board and all its contents (snake, food, overlays).
 * @param {Object} props - { boardSize, cells, overlay, onKeyDown, tabIndex, className, ... }
 */
function GameBoard({ boardSize, renderCell, overlay, className = "", ...rest }) {
  return (
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
  );
}

export default GameBoard;
