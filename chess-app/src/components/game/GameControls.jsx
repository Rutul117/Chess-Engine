import React from 'react';
import { FaUndo, FaRedo, FaChessBoard } from 'react-icons/fa';

function GameControls({ onUndo, onNewGame, onFlipBoard, selectedDepth, onDepthChange, showDepthSelector }) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <button
        onClick={onNewGame}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <FaChessBoard />
        New Game
      </button>
      
      <button
        onClick={onUndo}
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
      >
        <FaUndo />
        Undo Move
      </button>
      
      <button
        onClick={onFlipBoard}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center gap-2"
      >
        <FaRedo />
        Flip Board
      </button>

      {showDepthSelector && (
        <select
          value={selectedDepth}
          onChange={(e) => onDepthChange(Number(e.target.value))}
          className="px-4 py-2 border rounded bg-white"
        >
          {[1, 2, 3, 4, 5].map((depth) => (
            <option key={depth} value={depth}>
              Depth: {depth}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default GameControls;