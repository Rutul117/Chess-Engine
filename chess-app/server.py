from flask import Flask, request, jsonify
from flask_cors import CORS
from chess_engine import Engine
import threading
import time

app = Flask(__name__)
CORS(app)

# Store ongoing calculations
calculations = {}

@app.route('/')
def home():
    return "Chess Engine Server is Running"

@app.route('/api/bot-move', methods=['POST'])
def get_bot_move():
    try:
        data = request.json
        fen = data.get('fen')
        depth = min(data.get('depth', 3), 5)  # Limit max depth to 5 for faster response
        
        if not fen:
            return jsonify({'error': 'FEN position is required'}), 400
            
        print(f"Received FEN: {fen}")
        print(f"Requested depth: {depth}")
        
        # Set a timeout for calculation (5 seconds)
        start_time = time.time()
        engine = Engine(fen)
        
        # Add time control to iterative deepening
        move = engine.iterative_deepening(depth, max_time=5)
        
        elapsed_time = time.time() - start_time
        print(f"Move calculation took {elapsed_time:.2f} seconds")
        print(f"Engine returned move: {move}")
        
        return jsonify({
            'move': move,
            'time': elapsed_time,
            'nodes': engine.nodes_searched
        })
    except Exception as e:
        print(f"Error processing move: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000, host='0.0.0.0')