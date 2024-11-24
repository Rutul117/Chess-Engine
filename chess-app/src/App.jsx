import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import AuthPage from './components/AuthPage';
import GamePage from './pages/GamePage';
import ChessGame from './pages/ChessGame';
import './App.css';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={
              <PrivateRoute>
                <GamePage />
              </PrivateRoute>
            } />
            <Route path="/game/:mode" element={
              <PrivateRoute>
                <ChessGame />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;