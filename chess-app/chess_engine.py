import chess
import time
from typing import Tuple, List, Optional, Dict
import random

class Engine:
    def __init__(self, fen):
        self.board = chess.Board(fen)
        self.MAX_DEPTH = 60
        self.INFINITY = 1000000
        self.start_time = 0
        self.max_time = 5
        self.nodes_searched = 0
        self.killer_moves = [[None] * 64 for _ in range(2)]
        self.history_table = {}
        
        # Professional-grade piece values
        self.piece_values = {
            1: 100,    # pawn
            2: 335,    # bishop
            3: 325,    # knight
            4: 500,    # rook
            5: 975,    # queen
            6: 20000   # king
        }
        
        # Opening book moves (simplified)
        self.opening_book = {
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -': [
                'e2e4', 'd2d4', 'c2c4', 'g1f3'  # Common opening moves
            ]
        }
        
        # Endgame piece-square tables
        self.endgame_pst = {
            'K': [  # King becomes more active in endgame
                -50,-40,-30,-20,-20,-30,-40,-50,
                -30,-20,-10,  0,  0,-10,-20,-30,
                -30,-10, 20, 30, 30, 20,-10,-30,
                -30,-10, 30, 40, 40, 30,-10,-30,
                -30,-10, 30, 40, 40, 30,-10,-30,
                -30,-10, 20, 30, 30, 20,-10,-30,
                -30,-30,  0,  0,  0,  0,-30,-30,
                -50,-30,-30,-30,-30,-30,-30,-50
            ],
            'P': [  # Pawns more valuable as they advance
                0,  0,  0,  0,  0,  0,  0,  0,
                80, 80, 80, 80, 80, 80, 80, 80,
                50, 50, 50, 50, 50, 50, 50, 50,
                30, 30, 30, 30, 30, 30, 30, 30,
                20, 20, 20, 20, 20, 20, 20, 20,
                10, 10, 10, 10, 10, 10, 10, 10,
                10, 10, 10, 10, 10, 10, 10, 10,
                0,  0,  0,  0,  0,  0,  0,  0
            ]
        }
        
        # Middlegame piece-square tables
        self.pst = {
            'P': [
                0,   0,   0,   0,   0,   0,   0,   0,
                50,  50,  50,  50,  50,  50,  50,  50,
                10,  10,  20,  30,  30,  20,  10,  10,
                5,   5,  10,  25,  25,  10,   5,   5,
                0,   0,   0,  20,  20,   0,   0,   0,
                5,  -5, -10,   0,   0, -10,  -5,   5,
                5,  10,  10, -20, -20,  10,  10,   5,
                0,   0,   0,   0,   0,   0,   0,   0
            ],
            'N': [
                -50, -40, -30, -30, -30, -30, -40, -50,
                -40, -20,   0,   0,   0,   0, -20, -40,
                -30,   0,  10,  15,  15,  10,   0, -30,
                -30,   5,  15,  20,  20,  15,   5, -30,
                -30,   0,  15,  20,  20,  15,   0, -30,
                -30,   5,  10,  15,  15,  10,   5, -30,
                -40, -20,   0,   5,   5,   0, -20, -40,
                -50, -40, -30, -30, -30, -30, -40, -50
            ],
            'B': [
                -20, -10, -10, -10, -10, -10, -10, -20,
                -10,   0,   0,   0,   0,   0,   0, -10,
                -10,   0,   5,  10,  10,   5,   0, -10,
                -10,   5,   5,  10,  10,   5,   5, -10,
                -10,   0,  10,  10,  10,  10,   0, -10,
                -10,  10,  10,  10,  10,  10,  10, -10,
                -10,   5,   0,   0,   0,   0,   5, -10,
                -20, -10, -10, -10, -10, -10, -10, -20
            ],
            'R': [
                0,   0,   0,   0,   0,   0,   0,   0,
                5,  10,  10,  10,  10,  10,  10,   5,
                -5,   0,   0,   0,   0,   0,   0,  -5,
                -5,   0,   0,   0,   0,   0,   0,  -5,
                -5,   0,   0,   0,   0,   0,   0,  -5,
                -5,   0,   0,   0,   0,   0,   0,  -5,
                -5,   0,   0,   0,   0,   0,   0,  -5,
                0,   0,   0,   5,   5,   0,   0,   0
            ],
            'Q': [
                -20, -10, -10,  -5,  -5, -10, -10, -20,
                -10,   0,   0,   0,   0,   0,   0, -10,
                -10,   0,   5,   5,   5,   5,   0, -10,
                -5,    0,   5,   5,   5,   5,   0,  -5,
                0,     0,   5,   5,   5,   5,   0,  -5,
                -10,   5,   5,   5,   5,   5,   0, -10,
                -10,   0,   5,   0,   0,   0,   0, -10,
                -20, -10, -10,  -5,  -5, -10, -10, -20
            ],
            'K': [
                -30, -40, -40, -50, -50, -40, -40, -30,
                -30, -40, -40, -50, -50, -40, -40, -30,
                -30, -40, -40, -50, -50, -40, -40, -30,
                -30, -40, -40, -50, -50, -40, -40, -30,
                -20, -30, -30, -40, -40, -30, -30, -20,
                -10, -20, -20, -20, -20, -20, -20, -10,
                20,   20,   0,   0,   0,   0,  20,  20,
                20,   30,  10,   0,   0,  10,  30,  20
            ]
        }

    def is_endgame(self) -> bool:
        """Determine if the position is in endgame"""
        queens = len(self.board.pieces(chess.QUEEN, chess.WHITE)) + len(self.board.pieces(chess.QUEEN, chess.BLACK))
        total_pieces = len(list(self.board.pieces(chess.QUEEN, chess.WHITE))) + len(list(self.board.pieces(chess.QUEEN, chess.BLACK)))
        return queens == 0 or (queens == 2 and total_pieces <= 6)

    def evaluate_position(self) -> int:
        """Advanced position evaluation"""
        if self.board.is_checkmate():
            return -self.INFINITY if self.board.turn else self.INFINITY
        if self.board.is_stalemate() or self.board.is_insufficient_material():
            return 0

        score = 0
        is_endgame = self.is_endgame()
        
        # Material and position evaluation
        for square in chess.SQUARES:
            piece = self.board.piece_at(square)
            if piece is not None:
                piece_type = piece.piece_type
                color = piece.color
                value = self.piece_values[piece_type]
                
                # Position bonus based on game phase
                symbol = 'PNBRQK'[piece_type-1]
                square_idx = square if color else 63 - square
                position_bonus = (self.endgame_pst[symbol][square_idx] if is_endgame and symbol in self.endgame_pst 
                                else self.pst[symbol][square_idx])
                
                final_value = value + position_bonus
                score += final_value if color else -final_value

        # Mobility evaluation
        if not is_endgame:
            mobility = len(list(self.board.legal_moves))
            score += mobility if self.board.turn else -mobility

        # Pawn structure evaluation
        score += self.evaluate_pawn_structure()
        
        # King safety
        if not is_endgame:
            score += self.evaluate_king_safety()
        
        # Bishop pair bonus
        if len(self.board.pieces(chess.BISHOP, chess.WHITE)) >= 2:
            score += 50
        if len(self.board.pieces(chess.BISHOP, chess.BLACK)) >= 2:
            score -= 50

        return score if self.board.turn else -score

    def evaluate_pawn_structure(self) -> int:
        """Evaluate pawn structure"""
        score = 0
        
        # Evaluate doubled pawns
        for file in range(8):
            white_pawns = len([square for square in self.board.pieces(chess.PAWN, chess.WHITE) 
                             if chess.square_file(square) == file])
            black_pawns = len([square for square in self.board.pieces(chess.PAWN, chess.BLACK) 
                             if chess.square_file(square) == file])
            
            if white_pawns > 1:
                score -= 20 * (white_pawns - 1)
            if black_pawns > 1:
                score += 20 * (black_pawns - 1)
        
        # Evaluate isolated pawns
        for file in range(8):
            adjacent_files = []
            if file > 0:
                adjacent_files.append(file - 1)
            if file < 7:
                adjacent_files.append(file + 1)
                
            for color in [chess.WHITE, chess.BLACK]:
                has_pawn = any(chess.square_file(square) == file 
                             for square in self.board.pieces(chess.PAWN, color))
                has_adjacent = any(any(chess.square_file(square) == adj_file 
                                     for square in self.board.pieces(chess.PAWN, color))
                                 for adj_file in adjacent_files)
                
                if has_pawn and not has_adjacent:
                    score += -15 if color else 15

        return score

    def evaluate_king_safety(self) -> int:
        """Evaluate king safety"""
        score = 0
        
        for color in [chess.WHITE, chess.BLACK]:
            king_square = self.board.king(color)
            if king_square is None:
                continue
                
            # Pawn shield
            pawn_shield = 0
            king_file = chess.square_file(king_square)
            king_rank = chess.square_rank(king_square)
            
            shield_ranks = range(king_rank + (1 if color else -1), 
                               king_rank + (3 if color else -3), 
                               1 if color else -1)
            
            for file in range(max(0, king_file - 1), min(8, king_file + 2)):
                for rank in shield_ranks:
                    if 0 <= rank < 8:
                        square = chess.square(file, rank)
                        if self.board.piece_at(square) == chess.Piece(chess.PAWN, color):
                            pawn_shield += 10
            
            score += pawn_shield if color else -pawn_shield
            
            # King tropism (penalize enemy pieces near king)
            enemy_color = not color
            for piece_type in [chess.QUEEN, chess.ROOK, chess.BISHOP, chess.KNIGHT]:
                for piece_square in self.board.pieces(piece_type, enemy_color):
                    distance = chess.square_distance(king_square, piece_square)
                    score += (-15 // distance) if color else (15 // distance)
        
        return score

    def get_move_score(self, move: chess.Move, depth: int) -> int:
        """Score moves for move ordering"""
        score = 0
        
        # PV/Hash move (would be highest priority)
        
        # Captures (ordered by MVV-LVA)
        if self.board.is_capture(move):
            victim_type = self.board.piece_at(move.to_square).piece_type
            attacker_type = self.board.piece_at(move.from_square).piece_type
            score = 10000 + (victim_type * 100) - attacker_type
            
        # Killer moves
        elif self.killer_moves[0][depth] == move:
            score = 9000
        elif self.killer_moves[1][depth] == move:
            score = 8000
            
        # History heuristic
        score += self.history_table.get((move.from_square, move.to_square), 0)
        
        return score

    def order_moves(self, moves: List[chess.Move], depth: int) -> List[chess.Move]:
        """Order moves for better pruning"""
        move_scores = [(move, self.get_move_score(move, depth)) for move in moves]
        return [move for move, score in sorted(move_scores, key=lambda x: x[1], reverse=True)]

    def quiescence_search(self, alpha: int, beta: int, depth: int = 0) -> int:
        """Quiescence search to handle tactical positions"""
        if self.is_time_up():
            raise TimeoutError("Calculation time exceeded")
            
        stand_pat = self.evaluate_position()
        
        if stand_pat >= beta:
            return beta
        if alpha < stand_pat:
            alpha = stand_pat
        if depth < -4:  # Limit quiescence depth
            return stand_pat

        moves = list(self.board.legal_moves)
        moves = [move for move in moves if self.board.is_capture(move)]
        moves = self.order_moves(moves, depth)

        for move in moves:
            self.board.push(move)
            score = -self.quiescence_search(-beta, -alpha, depth - 1)
            self.board.pop()
            
            if score >= beta:
                return beta
            if score > alpha:
                alpha = score

        return alpha

    def negamax(self, depth: int, alpha: int, beta: int, null_move: bool = True) -> Tuple[int, Optional[chess.Move]]:
        """Enhanced negamax with null move pruning"""
        if self.is_time_up():
            raise TimeoutError("Calculation time exceeded")
        # Check opening book
        if depth == self.MAX_DEPTH:
            book_move = self.get_book_move()
            if book_move:
                return 0, book_move

        # Transposition table lookup would go here
        
        if depth <= 0:
            return self.quiescence_search(alpha, beta), None

        # Null move pruning
        if null_move and depth >= 3 and not self.board.is_check() and not self.is_endgame():
            self.board.push(chess.Move.null())
            null_score = -self.negamax(depth - 3, -beta, -beta + 1, False)[0]
            self.board.pop()
            
            if null_score >= beta:
                return beta, None

        best_move = None
        best_score = -self.INFINITY

        moves = list(self.board.legal_moves)
        if not moves:
            if self.board.is_check():
                return -self.INFINITY, None
            return 0, None

        moves = self.order_moves(moves, depth)
        
        # Aspiration windows for deeper searches
        if depth > 6:
            alpha = max(-self.INFINITY, alpha - 50)
            beta = min(self.INFINITY, beta + 50)

        for move in moves:
            self.board.push(move)
            score = -self.negamax(depth - 1, -beta, -alpha, null_move)[0]
            self.board.pop()

            if score > best_score:
                best_score = score
                best_move = move
                alpha = max(alpha, score)
                
                # Update history heuristic
                if not self.board.is_capture(move):
                    self.history_table[(move.from_square, move.to_square)] = \
                        self.history_table.get((move.from_square, move.to_square), 0) + depth * depth

            if alpha >= beta:
                # Update killer moves
                if not self.board.is_capture(move):
                    if self.killer_moves[0][depth] != move:
                        self.killer_moves[1][depth] = self.killer_moves[0][depth]
                        self.killer_moves[0][depth] = move
                break

        return best_score, best_move

    def get_book_move(self) -> Optional[chess.Move]:
        """Get move from opening book"""
        fen = self.board.fen().split(' ')[0] + ' ' + self.board.fen().split(' ')[1]
        if fen in self.opening_book:
            legal_book_moves = [move for move in self.opening_book[fen] 
                              if chess.Move.from_uci(move) in self.board.legal_moves]
            if legal_book_moves:
                return chess.Move.from_uci(random.choice(legal_book_moves))
        return None

    def iterative_deepening(self, max_depth: int, max_time: float = 5.0) -> str:
        """Time-managed iterative deepening with aspiration windows"""
        self.start_time = time.time()
        self.max_time = max_time
        self.nodes_searched = 0
        best_move = None
        
        try:
            # Check opening book first
            book_move = self.get_book_move()
            if book_move:
                return str(book_move)

            # Always calculate at least depth 1
            score, move = self.negamax(1, -self.INFINITY, self.INFINITY)
            if move:
                best_move = move

            # Continue with deeper searches if time allows
            for depth in range(2, max_depth + 1):
                if self.is_time_up():
                    break
                    
                score, move = self.negamax(depth, -self.INFINITY, self.INFINITY)
                if move:
                    best_move = move
                    
                # Early exit if we found a winning position
                if abs(score) > 5000:
                    break
                    
        except TimeoutError:
            pass
        except Exception as e:
            print(f"Search error: {e}")
            
        # Fallback to first legal move if no move found
        if best_move is None and list(self.board.legal_moves):
            best_move = list(self.board.legal_moves)[0]

        return str(best_move) if best_move else str(list(self.board.legal_moves)[0])

    def is_time_up(self) -> bool:
        """Check if calculation time is exceeded"""
        return time.time() - self.start_time > self.max_time