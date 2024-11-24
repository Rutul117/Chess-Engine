import React, { useEffect, useRef } from 'react';
import $ from 'jquery';
import '@chrisoakman/chessboardjs/dist/chessboard-1.0.0.min.css';

function ChessBoard({ position, onPieceDrop, boardOrientation = 'white' }) {
  const boardRef = useRef(null);
  const boardInstanceRef = useRef(null);

  useEffect(() => {
    const loadChessboard = async () => {
      // Dynamically import chessboard.js
      await import('@chrisoakman/chessboardjs/dist/chessboard-1.0.0.min.js');
      
      if (!boardInstanceRef.current && boardRef.current) {
        const config = {
          position: 'start',
          orientation: boardOrientation,
          draggable: true,
          onDrop: (source, target) => {
            return onPieceDrop(source, target);
          },
          pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
        };

        boardInstanceRef.current = window.Chessboard(boardRef.current, config);
        $(window).resize(() => {
          boardInstanceRef.current.resize();
        });
      }
    };

    loadChessboard();

    return () => {
      if (boardInstanceRef.current) {
        boardInstanceRef.current.destroy();
      }
    };
  }, [boardOrientation, onPieceDrop]);

  useEffect(() => {
    if (boardInstanceRef.current && position) {
      boardInstanceRef.current.position(position);
    }
  }, [position]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div ref={boardRef} className="w-full" />
    </div>
  );
}

export default ChessBoard;