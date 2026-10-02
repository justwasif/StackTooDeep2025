import { useEffect, useRef, useState } from "react";

export default function Game() {
  const wsRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (wsRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const playerNumber = Number(sessionStorage.getItem("playerNumber"));
    const matchId = params.get("matchId");


    if (!matchId) {
      setError("No match ID provided");
      return;
    }

    const ws = new WebSocket("ws://localhost:8080/ws/game");
    wsRef.current = ws;

    const username = sessionStorage.getItem("playerId") || "Player";

    ws.onopen = () => {
      console.log("✅ WS connected (game)");
      setConnectionStatus("connected");

      ws.send(JSON.stringify({
        type: "authenticate",
        username: username
      }));

      ws.send(JSON.stringify({
        type: "join",
        matchId,
        playerNumber,
      }));
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        console.error("Failed to parse WS message:", err, "raw:", event.data);
        return;
      }

      console.log("📨 WS Message:", data);

      if (data.type === 'gameStart') {
        window.currentMatchId = data.matchId;
      }

      if (window.phaserGame) {
        const gameScene = window.phaserGame.scene.getScene('Game');
        if (gameScene && gameScene.handleServerMessage) {
          gameScene.handleServerMessage(data);
        } else {
          if (!window.wsMessageQueue) {
            window.wsMessageQueue = [];
          }
          window.wsMessageQueue.push(data);
        }
      }
    };

    ws.onerror = (e) => {
      console.error("❌ WS error", e);
      setConnectionStatus("error");
      setError("WebSocket connection error");
    };

    ws.onclose = () => {
      console.log("🔌 WS closed");
      setConnectionStatus("disconnected");
    };

    window.gameWebSocket = ws;
    window.currentMatchId = matchId;

    const loadPhaser = async () => {
      try {
        const { default: StartGame } = await import("../game_engine/game/main");
        window.phaserGame = StartGame("game-container");

        if (window.wsMessageQueue) {
          setTimeout(() => {
            const gameScene = window.phaserGame?.scene.getScene('Game');
            if (gameScene && gameScene.handleServerMessage) {
              while (window.wsMessageQueue.length > 0) {
                gameScene.handleServerMessage(window.wsMessageQueue.shift());
              }
            }
          }, 1000);
        }
      } catch (err) {
        console.error("Failed to load Phaser game:", err);
        setError("Failed to load game");
      }
    };

    loadPhaser();

    return () => {
      console.log("🧹 Cleaning up game WS");

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }

      wsRef.current = null;
      window.gameWebSocket = null;
      window.currentMatchId = null;
      window.wsMessageQueue = null;

      if (window.phaserGame) {
        window.phaserGame.destroy(true);
        window.phaserGame = null;
      }
    };
  }, []);

  if (error) {
    return (
        <div className="flex items-center justify-center w-screen h-screen bg-[#f8e692]">
          <div className="text-center p-8 bg-white border-4 border-[#8100c8] rounded-3xl">
            <h1 className="text-3xl font-bold text-[#ff00d6] mb-4">Error</h1>
            <p className="text-[#8100c8] text-lg">{error}</p>
            <button
                onClick={() => window.location.href = '/dashboard'}
                className="mt-6 px-6 py-3 bg-[#74aaee] text-[#8100c8] border-4 border-[#8100c8] rounded-lg hover:bg-[#8100c8] hover:text-[#f8e692] transition font-bold"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="relative w-screen h-screen bg-[#f8e692]">
        {connectionStatus !== "connected" && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white border-4 border-[#8100c8] text-[#8100c8] px-6 py-3 rounded-lg shadow-lg">
              {connectionStatus === "connecting" && (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-[#8100c8] border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting to game...</span>
                  </div>
              )}
              {connectionStatus === "disconnected" && (
                  <span className="text-[#ff00d6]">Disconnected - Attempting to reconnect...</span>
              )}
            </div>
        )}

        <div
            id="game-container"
            className="w-full h-full"
        />
      </div>
  );
}