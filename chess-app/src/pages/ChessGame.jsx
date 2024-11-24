import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import { Chess } from 'chess.js';
import axios from 'axios';
import toast from 'react-hot-toast';

// Enhanced CSS for smoother piece animations
const chessPieceAnimationStyles = `
  .chess-piece {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
    transform-origin: center;
    pointer-events: auto;
  }
  
  .chess-piece:hover {
    transform: scale(1.1);
    cursor: grab;
    z-index: 100;
  }
  
  .chess-piece:active {
    cursor: grabbing;
    transform: scale(1.15);
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .chess-piece.dragging {
    opacity: 0.8;
    animation: pulse 1.5s infinite;
  }
  
  .piece-417db {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backface-visibility: hidden;
  }
  
  .square-highlight {
    box-shadow: inset 0 0 3px 3px rgba(255, 255, 0, 0.5);
    animation: highlight-pulse 1.5s infinite;
  }
  
  .legal-move-hint {
    position: absolute;
    width: 25%;
    height: 25%;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    pointer-events: none;
    left: 37.5%;
    top: 37.5%;
  }
  
  .captured-piece {
    animation: captured 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes pulse {
    0% { transform: scale(1.15); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1.15); }
  }
  
  @keyframes highlight-pulse {
    0% { box-shadow: inset 0 0 3px 3px rgba(255, 255, 0, 0.3); }
    50% { box-shadow: inset 0 0 3px 3px rgba(255, 255, 0, 0.5); }
    100% { box-shadow: inset 0 0 3px 3px rgba(255, 255, 0, 0.3); }
  }
  
  @keyframes captured {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2) rotate(5deg); opacity: 0.5; }
    100% { transform: scale(0) rotate(-5deg); opacity: 0; }
  }

  .board-square {
    transition: background-color 0.3s ease;
  }
  
  .board-square.source-square {
    background-color: rgba(255, 255, 0, 0.4) !important;
  }
  
  .board-square.target-square {
    background-color: rgba(0, 255, 0, 0.4) !important;
  }
`;

function ChessGame() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState('start');
  const [moveHistory, setMoveHistory] = useState([]);
  const [status, setStatus] = useState('');
  const [selectedDepth, setSelectedDepth] = useState(3);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [isThinking, setIsThinking] = useState(false);
  const boardRef = useRef(null);
  const [board, setBoard] = useState(null);
  const gameRef = useRef(game);
  const [gameMoveHistory, setGameMoveHistory] = useState([]);

  // Add style tag for animations
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = chessPieceAnimationStyles;
    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

  // Update gameRef when game changes
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const updateStatus = useCallback((currentGame) => {
    let status = '';
    if (currentGame.isCheckmate()) {
      status = 'Game over - Checkmate!';
    } else if (currentGame.isDraw()) {
      status = 'Game over - Draw!';
    } else {
      status = `${currentGame.turn() === 'w' ? 'White' : 'Black'} to move`;
      if (currentGame.isCheck()) {
        status += ' - Check!';
      }
    }
    setStatus(status);
  }, []);

  const makeMove = useCallback((from, to) => {
    try {
      const newGame = new Chess(gameRef.current.fen());
      const move = newGame.move({
        from: from,
        to: to,
        promotion: 'q'
      });

      if (move) {
        setGameMoveHistory(prev => [...prev, { from, to, fen: newGame.fen() }]);
        setGame(newGame);
        setPosition(newGame.fen());
        setMoveHistory(newGame.history({ verbose: true }));
        updateStatus(newGame);
        
        // Animate the board position update
        if (board) {
          const sourceSquare = document.querySelector(`.square-${from}`);
          const targetSquare = document.querySelector(`.square-${to}`);
          
          if (sourceSquare && targetSquare) {
            sourceSquare.classList.add('source-square');
            targetSquare.classList.add('target-square');
            
            setTimeout(() => {
              sourceSquare.classList.remove('source-square');
              targetSquare.classList.remove('target-square');
            }, 300);
          }
          
          board.position(newGame.fen(), true);
        }
        return true;
      }
    } catch (e) {
      console.error('Move error:', e);
      return false;
    }
    return false;
  }, [board, updateStatus]);

  const getBotMove = async (fen, depth) => {
    try {
      const response = await axios.post('http://localhost:5000/api/bot-move', {
        fen,
        depth
      });
      return response.data.move;
    } catch (error) {
      console.error('Error getting bot move:', error);
      toast.error('Failed to connect to chess engine. Please ensure the Flask server is running.');
      throw error;
    }
  };

  const handleBotMove = useCallback(async () => {
    if (mode === 'bot' && !gameRef.current.isGameOver()) {
      try {
        setIsThinking(true);
        const botMove = await getBotMove(gameRef.current.fen(), selectedDepth);
        
        if (botMove && botMove.length >= 4) {
          const from = botMove.substring(0, 2);
          const to = botMove.substring(2, 4);
          
          const moveSuccess = makeMove(from, to);
          if (!moveSuccess) {
            toast.error('Invalid bot move received');
          }
        } else {
          toast.error('Invalid move received from bot');
        }
      } catch (error) {
        console.error('Bot move error:', error);
      } finally {
        setIsThinking(false);
      }
    }
  }, [mode, selectedDepth, makeMove]);

  const onPieceDrop = useCallback((sourceSquare, targetSquare) => {
    if (mode === 'bot' && gameRef.current.turn() !== boardOrientation[0]) {
      return false;
    }
    
    if (isThinking) {
      return false;
    }
    
    const moveSuccess = makeMove(sourceSquare, targetSquare);
    
    if (moveSuccess && mode === 'bot') {
      handleBotMove();
    }
    
    return moveSuccess;
  }, [makeMove, mode, boardOrientation, handleBotMove, isThinking]);

  // Enhanced board initialization with smooth animations
  const initializeBoard = useCallback(() => {
    if (!window.Chessboard || !boardRef.current) return;

    if (board) {
      board.destroy();
    }

    const newBoard = window.Chessboard(boardRef.current, {
      position: game.fen(),
      orientation: boardOrientation,
      draggable: true,
      onDrop: onPieceDrop,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
      animationDuration: 300,
      appearSpeed: 200,
      moveSpeed: 300,
      snapSpeed: 100,
      snapbackSpeed: 200,
      trashSpeed: 100,
      sparePieces: false,
      pieceClass: 'chess-piece',
      
      onDragStart: (source, piece, position, orientation) => {
        const draggedPiece = document.querySelector(`.piece-${source}`);
        if (draggedPiece) {
          draggedPiece.classList.add('dragging');
        }

        const moves = gameRef.current.moves({
          square: source,
          verbose: true
        });

        moves.forEach(move => {
          const square = document.querySelector(`.square-${move.to}`);
          if (square) {
            const hint = document.createElement('div');
            hint.className = 'legal-move-hint';
            square.appendChild(hint);
          }
        });

        const sourceSquare = document.querySelector(`.square-${source}`);
        if (sourceSquare) {
          sourceSquare.classList.add('source-square');
        }

        return !isThinking && 
               !(mode === 'bot' && gameRef.current.turn() !== boardOrientation[0]);
      },

      onDragMove: (newLocation, oldLocation, source, piece, position, orientation) => {
        const draggedPiece = document.querySelector('.dragging');
        if (draggedPiece) {
          draggedPiece.style.transform = `scale(1.15)`;
        }
      },

      onSnapEnd: () => {
        document.querySelectorAll('.dragging').forEach(el => {
          el.classList.remove('dragging');
        });
        document.querySelectorAll('.legal-move-hint').forEach(el => {
          el.remove();
        });
        document.querySelectorAll('.source-square').forEach(el => {
          el.classList.remove('source-square');
        });
        document.querySelectorAll('.target-square').forEach(el => {
          el.classList.remove('target-square');
        });
      },

      onMouseoverSquare: (square, piece) => {
        if (isThinking) return;
        
        const moves = gameRef.current.moves({
          square: square,
          verbose: true
        });
        
        if (moves.length === 0) return;

        moves.forEach(move => {
          const squareEl = document.querySelector(`.square-${move.to}`);
          if (squareEl) {
            squareEl.classList.add('square-highlight');
          }
        });
      },

      onMouseoutSquare: (square, piece) => {
        document.querySelectorAll('.square-highlight').forEach(el => {
          el.classList.remove('square-highlight');
        });
      },

      onMoveEnd: (oldPos, newPos) => {
        const capturedSquare = Object.keys(oldPos).find(
          square => oldPos[square] && !newPos[square]
        );
        if (capturedSquare) {
          const piece = document.querySelector(`.piece-${capturedSquare}`);
          if (piece) {
            piece.classList.add('captured-piece');
            setTimeout(() => piece.remove(), 400);
          }
        }
      }
    });

    setBoard(newBoard);

    const handleResize = () => {
      const currentPosition = newBoard.position();
      document.querySelectorAll('.chess-piece').forEach(piece => {
        piece.style.transition = 'none';
      });
      newBoard.resize();
      setTimeout(() => {
        document.querySelectorAll('.chess-piece').forEach(piece => {
          piece.style.transition = '';
        });
        newBoard.position(currentPosition, true);
      }, 0);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [boardOrientation, game, onPieceDrop, isThinking, mode]);

  // Initial board setup
  useEffect(() => {
    const checkDependencies = setInterval(() => {
      if (window.jQuery && window.Chessboard) {
        clearInterval(checkDependencies);
        initializeBoard();
      }
    }, 100);

    return () => {
      clearInterval(checkDependencies);
      if (board) {
        board.destroy();
      }
    };
  }, []);

  // Handle board orientation changes
  useEffect(() => {
    if (window.Chessboard && boardRef.current) {
      initializeBoard();
    }
  }, [boardOrientation, initializeBoard]);

  const handleNewGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setPosition('start');
    setMoveHistory([]);
    setGameMoveHistory([]);
    if (board) {
      board.position('start', true);
    }
    updateStatus(newGame);
  }, [board, updateStatus]);

  const handleUndo = useCallback(() => {
    if (gameMoveHistory.length === 0) return;

    let newMoveHistory = [...gameMoveHistory];
    let newGame = new Chess();

    if (mode === 'bot') {
      newMoveHistory.splice(-2);
    } else {
      newMoveHistory.pop();
    }

    newMoveHistory.forEach(move => {
      newGame.move({
        from: move.from,
        to: move.to,
        promotion: 'q'
      });
    });

    setGameMoveHistory(newMoveHistory);
    setGame(newGame);
    setPosition(newGame.fen());
    setMoveHistory(newGame.history({ verbose: true }));
    
    if (board) {
      board.position(newGame.fen(), true);
    }
    
    updateStatus(newGame);
  }, [mode, board, updateStatus, gameMoveHistory]);

  const handleFlipBoard = useCallback(() => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  }, []);

  // Monitor game state changes for bot moves
  useEffect(() => {
    if (mode === 'bot' && game.turn() === 'b' && !isThinking) {
      handleBotMove();
    }
  }, [mode, game, handleBotMove, isThinking]);
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.button
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <FaArrowLeft />
        <span>Back to Game Modes</span>
      </motion.button>

      <h1 className="text-3xl font-bold text-center mb-8">
        {mode === 'bot' ? 'Playing Against Bot' : 'Player vs Player'}
      </h1>

      <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
        <div className="w-full md:w-1/2 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div 
              id="board" 
              ref={boardRef} 
              style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}
              className="relative"
            >
              {/* Chess board will be mounted here */}
            </div>
            {isThinking && (
              <div className="text-center mt-4">
                <div className="inline-flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-600">Bot is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2 max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Game Status</h2>
            <div className={`text-lg mb-6 ${
              status.includes('Checkmate') ? 'text-red-600 font-bold' :
              status.includes('Draw') ? 'text-yellow-600 font-bold' :
              status.includes('Check') ? 'text-orange-600 font-bold' :
              'text-gray-700'
            }`}>
              {status}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Move History</h3>
              <div className="max-h-60 overflow-y-auto border rounded">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-600">#</th>
                      <th className="px-4 py-2 text-left text-gray-600">White</th>
                      <th className="px-4 py-2 text-left text-gray-600">Black</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moveHistory.reduce((rows, move, index) => {
                      if (index % 2 === 0) {
                        rows.push([move]);
                      } else {
                        rows[rows.length - 1].push(move);
                      }
                      return rows;
                    }, []).map((row, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-2 font-mono">
                          {row[0]?.san && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              {row[0].san}
                            </motion.span>
                          )}
                        </td>
                        <td className="px-4 py-2 font-mono">
                          {row[1]?.san && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              {row[1].san}
                            </motion.span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewGame}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                New Game
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUndo}
                disabled={gameMoveHistory.length === 0}
                className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                  gameMoveHistory.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
                }`}
              >
                Undo Move
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFlipBoard}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
              >
                Flip Board
              </motion.button>

              {mode === 'bot' && (
                <select
                  value={selectedDepth}
                  onChange={(e) => setSelectedDepth(Number(e.target.value))}
                  className="px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {[1, 2, 3, 4, 5].map((depth) => (
                    <option key={depth} value={depth}>
                      Depth: {depth}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Game Tips Section */}
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Game Tips</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                Hover over pieces to see possible moves
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                Drag pieces to make moves
              </li>
              {mode === 'bot' && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Adjust bot difficulty using the depth selector
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChessGame;