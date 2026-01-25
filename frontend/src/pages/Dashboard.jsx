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

  return (
      <div className="flex flex-col min-h-screen bg-[#f8e692] text-[#8100c8]">

        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <h1 className="text-6xl font-game text-[#8100c8]">
            Ready to Battle?
          </h1>

          <div className="p-1 rounded-2xl bg-[#ff00d6] border-4 border-[#8100c8]">
            <button
                onClick={handlePlayGame}
                disabled={loading}
                className="px-12 py-6 bg-white rounded-xl text-2xl font-marker hover:bg-[#74aaee] transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-[#8100c8] border-2 border-[#8100c8] uppercase"
            >
              {loading ? "Initializing..." : "50 token game "}
            </button>
          </div>
          <div className="p-1 rounded-2xl bg-[#8100c8] border-4 border-[#8100c8]">
            <button  onClick={()=>navigate("/card-direct")}
                     className="px-12 py-6 bg-white rounded-xl text-2xl font-marker hover:bg-[#74aaee] transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-[#8100c8] border-2 border-[#8100c8] uppercase"
            >
              {loading ? "Initializing..." : "100 token game "}
            </button>
          </div>

          {loading && (
              <p className="text-[#8100c8] animate-pulse font-marker text-lg">
                Starting your game session...
              </p>
          )}

          {message && (
              <p className="text-[#ff00d6] mt-2 font-marker text-lg">{message}</p>
          )}
        </div>
      </div>
  );
}

export default Dashboard;
