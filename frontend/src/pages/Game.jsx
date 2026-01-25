import { useEffect, useRef, useState } from "react";

export default function Game() {
  const wsRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [error, setError] = useState(null);

  useEffect(() => {
    // 🔒 Prevent duplicate WS in StrictMode
    if (wsRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");

    if (!matchId) {
      setError("No match ID provided");
      return;
    }

    const ws = new WebSocket("ws://localhost:8080/ws/game");
    wsRef.current = ws;

    const playerId = localStorage.getItem("playerId");
    const username = localStorage.getItem("username") || "Player";

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
        playerId
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

      // Store matchId globally for Phaser access
      if (data.type === 'gameStart') {
        window.currentMatchId = data.matchId;
      }

      // Forward messages to Phaser scene if it exists
      if (window.phaserGame) {
        const gameScene = window.phaserGame.scene.getScene('Game');
        if (gameScene && gameScene.handleServerMessage) {
          gameScene.handleServerMessage(data);
        } else {
          // Queue messages if scene isn't ready yet
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

    // Store WS globally for Phaser access
    window.gameWebSocket = ws;
    window.currentMatchId = matchId;

    // Start Phaser game after WS setup
    const loadPhaser = async () => {
      try {
        // Dynamically import your Phaser game entry point
        const { default: StartGame } = await import("../../../game/src/game/main");
        window.phaserGame = StartGame("game-container");

        // Process any queued messages
        if (window.wsMessageQueue) {
          setTimeout(() => {
            const gameScene = window.phaserGame?.scene.getScene('Game');
            if (gameScene && gameScene.handleServerMessage) {
              while (window.wsMessageQueue.length > 0) {
                gameScene.handleServerMessage(window.wsMessageQueue.shift());
              }
            }
          }, 1000); // Give Phaser time to initialize
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
        <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
            <p className="text-white text-lg">{error}</p>
            <button
                onClick={() => window.location.href = '/dashboard'}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="relative w-screen h-screen bg-black">
        {connectionStatus !== "connected" && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg">
              {connectionStatus === "connecting" && (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting to game...</span>
                  </div>
              )}
              {connectionStatus === "disconnected" && (
                  <span className="text-yellow-400">Disconnected - Attempting to reconnect...</span>
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