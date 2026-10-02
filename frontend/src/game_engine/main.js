import StartGame from "./game/main";

document.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ Read matchId from URL
  const params = new URLSearchParams(window.location.search);
  const matchId = params.get("matchId");

  if (!matchId) {
    console.error("❌ No matchId found in URL");
    document.getElementById("game-container").innerHTML = 
      '<div style="color: white; text-align: center; padding: 50px;">' +
      '<h2>Error: No Match ID</h2>' +
      '<p>Please start a game from the dashboard.</p>' +
      '<a href="http://localhost:5173/dashboard" style="color: #4CAF50;">Return to Dashboard</a>' +
      '</div>';
    return;
  }

//   console.log("🎮 Starting game with matchId:", matchId);

//   // 2️⃣ Get auth token from cookies or localStorage
//   // Since your backend uses cookies, we'll let the browser handle it
//   // For WebSocket auth, we can get the token from localStorage if needed
//   const token = localStorage.getItem('accessToken') || 'dummy';

//   // 3️⃣ Connect to WebSocket on your game server
//   const ws = new WebSocket("ws://localhost:8080/ws/game");

//   ws.onopen = () => {
//     console.log("✅ Connected to game server");
    
//     // Authenticate
//     ws.send(JSON.stringify({
//       type: "authenticate",
//       token: token,
//     }));

//     // Join the specific match
//     ws.send(JSON.stringify({
//       type: "join",
//       matchId: matchId,
//     }));
//   };

//   ws.onmessage = (event) => {
//     let data;
//     try {
//       data = JSON.parse(event.data);
//     } catch (err) {
//       console.error("Failed to parse WS message:", err, "raw:", event.data);
//       return;
//     }

//     console.log("📨 WS Message:", data);

//     // Forward messages to Phaser scene if needed
//     if (window.phaserGame) {
//       const gameScene = window.phaserGame.scene.getScene('Game');
//       if (gameScene && gameScene.handleServerMessage) {
//         gameScene.handleServerMessage(data);
//       }
//     }
//   };

//   ws.onerror = (err) => {
//     console.error("❌ WebSocket error:", err);
//   };

//   ws.onclose = () => {
//     console.log("🔌 WebSocket connection closed");
//   };

//   // 4️⃣ Start Phaser game and store reference globally
//   window.phaserGame = StartGame("game-container");
  
//   // Store websocket reference for the game to use
//   window.gameWebSocket = ws;
//   window.currentMatchId = matchId;
  
//   console.log("🎮 Game started!");
// });