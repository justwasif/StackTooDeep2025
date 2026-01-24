import { useEffect, useRef } from "react";
import StartGame from "../../../game-game/src/game/main";

export default function Game() {
  const wsRef = useRef(null);

  useEffect(() => {
    if (wsRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");
    if (!matchId) return;

    const ws = new WebSocket("ws://localhost:8080/ws/game");
    wsRef.current = ws;

    const playerId = localStorage.getItem("playerId");


    ws.onopen = () => {
      console.log("✅ WS connected (game)");
      ws.send(JSON.stringify({ type: "authenticate" }));
      ws.send(JSON.stringify({ type: "join", matchId, playerId, }));
    };

    window.phaserGame = StartGame("game-container");
    window.gameWebSocket = ws;

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        console.error("Failed to parse WS message:", err, "raw:", event.data);
        return;
      }


      console.log(" WS Message:", data);

      // Forward messages to Phaser scene if needed
      if (window.phaserGame) {
        const gameScene = window.phaserGame.scene.getScene('Game');
        if (gameScene && gameScene.handleServerMessage) {
          gameScene.handleServerMessage(data);
        }
      }
    };


    ws.onerror = (e) => {
      console.error("❌ WS error", e);
    };

    return () => {
      console.log("🧹 Cleaning up game WS");
      ws.close();
      wsRef.current = null;
      window.phaserGame?.destroy(true);
    };
  }, []);

  return (
    <div
      id="game-container"
      style={{ width: "100vw", height: "100vh", background: "black" }}
    />
  );
}
