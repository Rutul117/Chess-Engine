import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FaChess, FaSignOutAlt } from 'react-icons/fa';

function Navbar() {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <FaChess className="text-2xl text-blue-600" />
            <span className="font-bold text-xl">Chess App</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {currentUser && (
              <>
                <span className="text-gray-700">{currentUser.email}</span>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-500"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;