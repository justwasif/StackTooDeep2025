import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";


const app = express();
const PORT = process.env.PORT || 8080;

/* -------------------- dirname setup (ESM) -------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------- Middleware -------------------- */
app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:8000"],
      credentials: true,
    })
);

app.use(express.json());

/* -------------------- Serve Phaser Game Static Files -------------------- */
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* -------------------- In-memory state -------------------- */
const waitingPlayers = [];
const cardMarketQueue = [];
const cardMarketMatches = new Map();
const activeMatches = new Map();

/* -------------------- Game Match -------------------- */
class GameMatch {
  constructor(player1, player2, matchId) {
    this.matchId = matchId;
    this.player1 = player1;
    this.player2 = player2;
    this.currentTurn = 1;
    this.skipNextTurn = false; // For Card 1

    this.gameState = {
      player1Position: { x: 215, y: 420 },
      player2Position: { x: 753, y: 470 },
    };
  }
}

/* -------------------- Helpers -------------------- */
function generateMatchId() {
  return `match_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generatePlayerId() {
  return `player_${Math.random().toString(36).slice(2, 10)}`;
}


const BOARD_BOUNDS = {
  minX: 0,
  maxX: 1024,
  minY: 0,
  maxY: 768,
};

function safeSend(ws, payload) {
  if (!ws || ws.readyState !== 1) return;
  try {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    ws.send(str);
  } catch (err) {
    console.warn('safeSend failed:', err);
  }
}

/* -------------------- REST API -------------------- */
// app.post("/api/v1/matches/start", (req, res) => {
//   res.json({
//     success: true,
//     message: "Matchmaking happens via WebSocket",
//     wsEndpoint: "/ws/game",
//     instruction: "Open WebSocket and send { type: 'join' }"
//   });
// });


app.post("/api/v1/card-direct", (req, res) => {
  res.json({
    success: true,
    message: "Matchmaking happens via WebSocket",
    wsEndpoint: "/ws/game",
    instruction: "Open WebSocket and send { type: 'card-direct' }"
  });
});

/* -------------------- HTTP Server -------------------- */
const server = http.createServer(app);

/* -------------------- WebSocket Server -------------------- */
const wss = new WebSocketServer({
  server,
  path: "/ws/game",
});

wss.on("connection", (ws, req) => {
  console.log('🔌 New WebSocket connection');
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
    } catch (err) {
      console.error('Failed to parse message:', err);
      safeSend(ws, {
        type: "error",
        message: "Invalid message format",
      });
    }
  });

  ws.on("close", () => {
    console.log('🔌 WebSocket connection closed');
    handlePlayerDisconnect(ws);
  });

  ws.on("error", (error) => {
    console.error('WebSocket error:', error);
  });
});

/* -------------------- WebSocket Logic -------------------- */
function handleWebSocketMessage(ws, data) {
  console.log('📨 Received:', data.type);

  switch (data.type) {
    case "authenticate":
      handleAuthenticate(ws, data);
      break;

    case "card-direct":
      handleCardMarketMatchmaking(ws);
      break;

    case "join":
      handleJoinGame(ws, data);
      break;

    case "move":
      handlePlayerMove(ws, data);
      break;

    case "skipTurn":
      handleSkipTurn(ws, data);
      break;

    case "blockDoors":
      handleBlockDoors(ws, data);
      break;
    case "startGame":
      handleStartGame(ws, data);
      break;


    case "win":
      handleWin(ws, data);
      break;

    default:
      safeSend(ws, {
        type: "error",
        message: "Unknown message type: " + data.type,
      });
  }
}

function handleCardMarketMatchmaking(ws) {
  console.log('🎴 Card Market matchmaking request');

  // Check if already in queue
  if (cardMarketQueue.includes(ws)) {
    safeSend(ws, {
      type: "error",
      message: "Already in card market queue"
    });
    return;
  }

  // Player1 waits
  if (cardMarketQueue.length === 0) {
    const matchId = generateMatchId();
    const playerId = generatePlayerId();

    ws.cardMarketMatchId = matchId;
    ws.cardMarketPlayerId = playerId;
    ws.cardMarketPlayerNumber = 1;

    cardMarketQueue.push(ws);

    // ✅ Create match lobby
    cardMarketMatches.set(matchId, {
      matchId,
      player1: ws,
      player2: null,
      ready1: false,
      ready2: false,
      selections1: [],
      selections2: [],
      txHash1: null,
      txHash2: null,
      createdAt: Date.now(),
    });

    console.log(`👤 Player 1 waiting in card market - Match: ${matchId}`);

    safeSend(ws, {
      type: "cardMarketReady",
      playerId,
      matchId,
      playerNumber: 1,
      status: "waiting_for_opponent",
    });

    return;
  }

  // Player2 joins
  const player1 = cardMarketQueue.shift();
  const matchId = player1.cardMarketMatchId;
  const playerId = generatePlayerId();

  ws.cardMarketMatchId = matchId;
  ws.cardMarketPlayerId = playerId;
  ws.cardMarketPlayerNumber = 2;

  const lobby = cardMarketMatches.get(matchId);
  if (!lobby) {
    // edge case: lobby missing (shouldn't happen)
    safeSend(ws, { type: "error", message: "Lobby not found" });
    return;
  }

  lobby.player2 = ws;

  console.log(`🎮 Card Market match formed: ${matchId}`);

  // send to player2
  safeSend(ws, {
    type: "cardMarketReady",
    playerId,
    matchId,
    playerNumber: 2,
    status: "matched",
  });

  // update player1
  safeSend(player1, {
    type: "opponentJoined",
    matchId,
    status: "matched",
  });
}


function handleStartGame(ws, data) {
  const matchId = data.matchId || ws.cardMarketMatchId;

  if (!matchId) {
    safeSend(ws, { type: "error", message: "Missing matchId" });
    return;
  }

  const lobby = cardMarketMatches.get(matchId);
  if (!lobby) {
    safeSend(ws, { type: "error", message: "Card market lobby not found" });
    return;
  }

  // Verify socket is actually part of lobby
  const isP1 = lobby.player1 === ws;
  const isP2 = lobby.player2 === ws;

  if (!isP1 && !isP2) {
    safeSend(ws, { type: "error", message: "Socket not part of this lobby" });
    return;
  }

  const selectedCards = Array.isArray(data.selectedCards) ? data.selectedCards : [];
  const txHash = data.txHash || null;

  // Mark ready + store selections
  if (isP1) {
    lobby.ready1 = true;
    lobby.selections1 = selectedCards;
    lobby.txHash1 = txHash;
  } else {
    lobby.ready2 = true;
    lobby.selections2 = selectedCards;
    lobby.txHash2 = txHash;
  }

  safeSend(ws, {
    type: "loadoutConfirmed",
    matchId,
    selectedCards,
    message: "Loadout confirmed. Waiting for opponent...",
  });

  // If opponent isn't ready yet: notify waiting
  const opponent = isP1 ? lobby.player2 : lobby.player1;
  if (!opponent) {
    safeSend(ws, {
      type: "waiting",
      message: "Opponent not connected yet"
    });
    return;
  }

  // Wait until both ready
  if (!(lobby.ready1 && lobby.ready2)) {
    safeSend(opponent, {
      type: "opponentReady",
      matchId,
      message: "Opponent confirmed their loadout"
    });
    return;
  }

  // ✅ BOTH READY -> create real GameMatch
  console.log(`✅ Both ready. Creating active game match: ${matchId}`);

  const player1 = lobby.player1;
  const player2 = lobby.player2;

  const match = new GameMatch(player1, player2, matchId);

  // Attach loadout info to match (optional but recommended)
  match.loadouts = {
    player1: { cards: lobby.selections1, txHash: lobby.txHash1 },
    player2: { cards: lobby.selections2, txHash: lobby.txHash2 },
  };

  match.disconnectTimeout = null;
  activeMatches.set(matchId, match);

  // Set match identifiers on sockets
  player1.matchId = matchId;
  player2.matchId = matchId;
  player1.playerNumber = 1;
  player2.playerNumber = 2;
  player1.isDisconnected = false;
  player2.isDisconnected = false;

  // remove lobby after creating match
  cardMarketMatches.delete(matchId);

  // send gameStart to both
  safeSend(player1, {
    type: "gameStart",
    matchId,
    playerNumber: 1,
    currentTurn: match.currentTurn,
    opponentUsername: player2.username,
    gameState: match.gameState,
    loadout: match.loadouts.player1,
  });

  safeSend(player2, {
    type: "gameStart",
    matchId,
    playerNumber: 2,
    currentTurn: match.currentTurn,
    opponentUsername: player1.username,
    gameState: match.gameState,
    loadout: match.loadouts.player2,
  });
}


function handleAuthenticate(ws, data) {
  ws.isAuthenticated = true;
  ws.username = data.username || `Player${Math.floor(Math.random() * 1000)}`;

  safeSend(ws, {
    type: "authenticated",
    username: ws.username,
  });

  console.log(`✅ ${ws.username} authenticated`);
}

function handleJoinGame(ws, data) {

  /* ===============================
     🔁 REATTACH EXISTING MATCH
     =============================== */
  if (data.matchId) {
    const match = activeMatches.get(data.matchId) || cardMarketMatches.get(data.matchId);

    if (!match) {
      safeSend(ws, { type: "error", message: "Match not found" });
      return;
    }

    // ✅ Use explicit playerNumber if provided (strong reattach)
    if (data.playerNumber === 1) {
      match.player1 = ws;
      ws.playerNumber = 1;
    } else if (data.playerNumber === 2) {
      match.player2 = ws;
      ws.playerNumber = 2;
    } else {
      // fallback to old logic
      if (match.player1?.isDisconnected) {
        match.player1 = ws;
        ws.playerNumber = 1;
      } else if (match.player2?.isDisconnected) {
        match.player2 = ws;
        ws.playerNumber = 2;
      } else {
        safeSend(ws, { type: "error", message: "Match already active" });
        return;
      }
    }


    ws.matchId = match.matchId;
    ws.isDisconnected = false;

    // ✅ cancel disconnect timeout if both are back
    if (
        match.player1 && !match.player1.isDisconnected &&
        match.player2 && !match.player2.isDisconnected &&
        match.disconnectTimeout
    ) {
      clearTimeout(match.disconnectTimeout);
      match.disconnectTimeout = null;
      console.log("✅ Both players reconnected, canceling disconnect timeout");
    }

    const opponentUsername = ws.playerNumber === 1
        ? match.player2.username
        : match.player1.username;

    safeSend(ws, {
      type: "gameStart",
      matchId: match.matchId,
      playerNumber: ws.playerNumber,
      currentTurn: match.currentTurn,
      opponentUsername: opponentUsername,
      gameState: match.gameState,
    });

    console.log(`🔁 Player reattached as player ${ws.playerNumber}`);
    return;
  }

  /* ===============================
     🎮 MATCHMAKING (NO matchId)
     =============================== */

  if (waitingPlayers.includes(ws)) {
    safeSend(ws, { type: "waiting", message: "Already in queue" });
    return;
  }

  waitingPlayers.push(ws);
  console.log(`➕ ${ws.username} added to waiting queue`);

  if (waitingPlayers.length < 2) {
    safeSend(ws, { type: "waiting", message: "Waiting for opponent..." });
    return;
  }

  const player1 = waitingPlayers.shift();
  const player2 = waitingPlayers.shift();

  const matchId = generateMatchId();
  const match = new GameMatch(player1, player2, matchId);

  match.disconnectTimeout = null;
  activeMatches.set(matchId, match);

  player1.matchId = matchId;
  player2.matchId = matchId;
  player1.playerNumber = 1;
  player2.playerNumber = 2;
  player1.isDisconnected = false;
  player2.isDisconnected = false;

  console.log(`🎮 Match created: ${matchId} - ${player1.username} vs ${player2.username}`);

  safeSend(player1, {
    type: "gameStart",
    matchId,
    playerNumber: 1,
    currentTurn: match.currentTurn,
    opponentUsername: player2.username,
    gameState: match.gameState,
  });

  safeSend(player2, {
    type: "gameStart",
    matchId,
    playerNumber: 2,
    currentTurn: match.currentTurn,
    opponentUsername: player1.username,
    gameState: match.gameState,
  });
}

function handlePlayerMove(ws, data) {
  const match = activeMatches.get(ws.matchId);

  if (!match) {
    safeSend(ws, { type: 'error', message: 'Match not found' });
    return;
  }

  if (match.currentTurn !== ws.playerNumber) {
    safeSend(ws, { type: 'error', message: 'Not your turn' });
    return;
  }

  // Validate coordinates
  if (typeof data.x === 'undefined' || typeof data.y === 'undefined') {
    safeSend(ws, { type: 'error', message: 'Missing coordinates' });
    return;
  }

  const x = Number(data.x);
  const y = Number(data.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    safeSend(ws, { type: 'error', message: 'Invalid coordinates' });
    return;
  }

  // Clamp to board bounds
  const clampedX = Math.min(Math.max(x, BOARD_BOUNDS.minX), BOARD_BOUNDS.maxX);
  const clampedY = Math.min(Math.max(y, BOARD_BOUNDS.minY), BOARD_BOUNDS.maxY);

  console.log(`🎯 ${ws.username} moved to (${clampedX}, ${clampedY})`);

  if (ws.playerNumber === 1) {
    match.gameState.player1Position = { x: clampedX, y: clampedY };
  } else {
    match.gameState.player2Position = { x: clampedX, y: clampedY };
  }

  // Switch turns
  const nextTurn = match.currentTurn === 1 ? 2 : 1;

  // Check if next turn should be skipped (Card 1 effect)
  if (match.skipNextTurn) {
    console.log(`⏭️ Skipping player ${nextTurn}'s turn`);
    match.skipNextTurn = false;
    match.currentTurn = match.currentTurn; // Keep current player's turn

    const opponent = nextTurn === 1 ? match.player1 : match.player2;
    safeSend(opponent, {
      type: 'turnSkipped',
      message: 'Your turn was skipped!'
    });
  } else {
    match.currentTurn = nextTurn;
  }

  const payload = {
    type: "gameUpdate",
    currentTurn: match.currentTurn,
    gameState: match.gameState,
  };

  safeSend(match.player1, payload);
  safeSend(match.player2, payload);
}

function handleSkipTurn(ws, data) {
  const match = activeMatches.get(ws.matchId);

  if (!match) {
    safeSend(ws, { type: 'error', message: 'Match not found' });
    return;
  }

  if (match.currentTurn !== ws.playerNumber) {
    safeSend(ws, { type: 'error', message: 'Not your turn' });
    return;
  }

  console.log(`🃏 Player ${ws.playerNumber} used Skip Turn card`);
  match.skipNextTurn = true;

  safeSend(ws, {
    type: 'cardActivated',
    card: 'skipTurn',
    message: 'Opponent\'s next turn will be skipped'
  });
}

function handleBlockDoors(ws, data) {
  const match = activeMatches.get(ws.matchId);

  if (!match) {
    safeSend(ws, { type: 'error', message: 'Match not found' });
    return;
  }

  if (match.currentTurn !== ws.playerNumber) {
    safeSend(ws, { type: 'error', message: 'Not your turn' });
    return;
  }

  console.log(`🚪 Player ${ws.playerNumber} blocked doors at (${data.tileX}, ${data.tileY})`);

  // Broadcast door block to both players
  const payload = {
    type: 'doorsBlocked',
    tileX: data.tileX,
    tileY: data.tileY,
    doorList: data.doorList
  };

  safeSend(match.player1, payload);
  safeSend(match.player2, payload);
}

function handleWin(ws, data) {
  const match = activeMatches.get(ws.matchId);

  if (!match) {
    safeSend(ws, { type: 'error', message: 'Match not found' });
    return;
  }

  const winner = ws.playerNumber;
  const loser = winner === 1 ? 2 : 1;
  const winnerWs = winner === 1 ? match.player1 : match.player2;
  const loserWs = winner === 1 ? match.player2 : match.player1;

  console.log(`🏆 Player ${winner} (${ws.username}) won the game!`);

  safeSend(winnerWs, {
    type: 'gameEnd',
    isWinner: true,
    winnerUsername: ws.username
  });

  safeSend(loserWs, {
    type: 'gameEnd',
    isWinner: false,
    winnerUsername: ws.username
  });

  // Clean up match after a delay
  setTimeout(() => {
    activeMatches.delete(match.matchId);
    console.log(`🧹 Match ${match.matchId} cleaned up`);
  }, 10000);
}

function handlePlayerDisconnect(ws) {
  // 0️⃣ Remove from card market queue
  const cardMarketIndex = cardMarketQueue.indexOf(ws);
  if (cardMarketIndex !== -1) {
    cardMarketQueue.splice(cardMarketIndex, 1);
    console.log(`❌ ${ws.username} removed from card market queue`);
    return;
  }

  // 1️⃣ Remove from waiting queue (lobby phase)
  const i = waitingPlayers.indexOf(ws);
  if (i !== -1) {
    waitingPlayers.splice(i, 1);
    console.log(`❌ ${ws.username} removed from queue`);
    return;
  }

  // 2️⃣ Handle in-game disconnect
  if (!ws.matchId) return;

  const match = activeMatches.get(ws.matchId);
  if (!match) return;

  ws.isDisconnected = true;

  console.log(
      `⏳ Player${ws.playerNumber} disconnected, waiting for reconnect...`
  );

  // Notify opponent
  const opponent = ws.playerNumber === 1 ? match.player2 : match.player1;
  if (opponent && !opponent.isDisconnected) {
    safeSend(opponent, {
      type: 'opponentDisconnected',
      message: 'Opponent disconnected'
    });
  }

  // 3️⃣ Only ONE timeout per match
  if (match.disconnectTimeout) return;

  match.disconnectTimeout = setTimeout(() => {
    const p1Disconnected = match.player1?.isDisconnected;
    const p2Disconnected = match.player2?.isDisconnected;

    // If anyone is still gone → end match
    if (p1Disconnected || p2Disconnected) {
      activeMatches.delete(match.matchId);
      console.log(
          `🏁 Match ${match.matchId} ended after disconnect timeout`
      );
    }

    match.disconnectTimeout = null;
  }, 5000);
}

/* -------------------- Heartbeat -------------------- */
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log('💀 Terminating dead connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

/* -------------------- Start Server -------------------- */
server.listen(PORT, () => {
  console.log(`🎮 Game Server running at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws/game`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
});