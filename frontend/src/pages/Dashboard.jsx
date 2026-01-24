import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';


function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handlePlayGame = async () => {
    setMessage(null);
    setLoading(true);

    try {
      // 1️⃣ Open WebSocket for matchmaking
      const ws = new WebSocket("ws://localhost:8080/ws/game");

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "authenticate" }));
        ws.send(JSON.stringify({ type: "join" }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "waiting") {
          setMessage("Waiting for opponent...");
        }

        if (data.type === "gameStart") {
          localStorage.setItem("playerId", data.playerId);
          ws.close();
          navigate(`/game?matchId=${data.matchId}`);
        }

      };

      ws.onerror = () => {
        setMessage("Failed to connect to game server");
      };

    } catch (err) {
      console.error(err);
      setMessage("Failed to start matchmaking");
    } finally {
      setLoading(false);
    }
  };


// const handleLogout = async () => {
//   try {
//     await api.post('/users/logout');
//     navigate('/login');
//   } catch (error) {
//     console.error("Logout failed", error);
//     // Navigate to login anyway
//     navigate('/login');
//   }
// };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* <nav className="p-4 bg-gray-800 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold text-blue-400">PolyGame</h1>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 text-sm bg-red-600 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </nav> */}

      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          Ready to Battle?
        </h1>
        
        <div className="p-1 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
          <button 
            onClick={handlePlayGame}
            disabled={loading}
            className="px-12 py-6 bg-gray-900 rounded-xl text-2xl font-bold hover:bg-gray-800 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Initializing..." : "50 token game "}
          </button>
        </div>
        <div className="p-1 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
          <button  onClick={()=>navigate("/card-direct")}
            className="px-12 py-6 bg-gray-900 rounded-xl text-2xl font-bold hover:bg-gray-800 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Initializing..." : "100 token game "}
          </button>
          </div>

        {loading && (
          <p className="text-gray-400 animate-pulse">
            Starting your game session...
          </p>
        )}

        {message && (
          <p className="text-red-400 mt-2">{message}</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;