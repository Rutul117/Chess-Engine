import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaUserFriends } from 'react-icons/fa';
import BackgroundMusic from '../components/audio/BackgroundMusic';

function GamePage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const titleVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <motion.div
        className="container mx-auto px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={titleVariants}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            Welcome to CheckmateX
          </h1>
          <p className="text-xl text-gray-600">
            Experience the royal game of chess like never before
          </p>
        </motion.div>
        
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Choose Your Game Mode
        </h2>
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mt-12">
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="bg-white rounded-xl shadow-xl overflow-hidden cursor-pointer transform transition-transform"
            onClick={() => navigate('/game/pvp')}
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUserFriends className="text-4xl text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Player vs Player</h3>
              <p className="text-gray-600">
                Challenge your friends or random players in an exciting game of chess.
                Test your skills against real opponents!
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="bg-white rounded-xl shadow-xl overflow-hidden cursor-pointer transform transition-transform"
            onClick={() => navigate('/game/bot')}
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaRobot className="text-4xl text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Player vs Bot</h3>
              <p className="text-gray-600">
                Practice your strategies against our intelligent chess bot.
                Perfect for improving your game!
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      <BackgroundMusic />
    </div>
  );
}

export default GamePage;