import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Match } from "../models/match.model.js";

// In-memory storage only
const games = new Map(); // matchId -> { players: [], gameState: {} }
const waitingPlayers = [];
const playerConnections = new Map(); // userId -> ws

export function initializeWebSocketServer(wss) {
    wss.on('connection', (ws, req) => {
        console.log('New WebSocket connection');

        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                switch(data.type) {
                    case 'authenticate':
                        await handleAuthentication(ws, data);
                        break;
                    case 'join':
                        await handleJoin(ws, data);
                        break;
                    case 'cardMarket':
                        await handleCardMarket(ws, data);
                        break;
                    case 'move':
                        handleMove(ws, data);
                        break;
                    case 'endGame':
                        await handleEndGame(ws, data);
                        break;
                    case 'disconnect':
                        handleDisconnect(ws);
                        break;
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        });

        ws.on('close', () => {
            handleDisconnect(ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    // Heartbeat to detect broken connections
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });
}

async function handleAuthentication(ws, data) {
    try {
        const { token } = data;

        if (!token) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'No authentication token provided'
            }));
            return;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_ACCESSES_TOKEN);

        // Get user from database
        const user = await User.findById(decoded._id).select('-password -refreshToken');

        if (!user) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'User not found'
            }));
            return;
        }

        // Store user info on WebSocket connection
        ws.userId = user._id.toString();
        ws.username = user.username;
        ws.authenticated = true;

        // Store connection in map
        playerConnections.set(ws.userId, ws);

        ws.send(JSON.stringify({
            type: 'authenticated',
            userId: ws.userId,
            username: ws.username
        }));

        console.log(`User ${ws.username} authenticated`);
    } catch (error) {
        console.error('Authentication error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Authentication failed'
        }));
    }
}

async function handleJoin(ws, data) {
    if (!ws.authenticated) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Not authenticated'
        }));
        return;
    }

    // Check if user is already in a game
    if (ws.gameId) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Already in a game'
        }));
        return;
    }

    const userId = ws.userId;

    if (waitingPlayers.length > 0) {
        // Match with waiting player
        const opponent = waitingPlayers.shift();

        // Make sure opponent is still connected
        if (opponent.readyState !== 1) {
            return handleJoin(ws, data);
        }

        try {
            // Create match in database (minimal info)
            const match = await Match.create({
                player1: opponent.userId,
                player2: userId,
                status: 'active',
                startedAt: new Date()
            });

            const matchId = match._id.toString();

            // Store game state in memory only
            const game = {
                matchId,
                players: [
                    { ws: opponent, userId: opponent.userId, username: opponent.username, playerNumber: 1 },
                    { ws, userId, username: ws.username, playerNumber: 2 }
                ],
                currentTurn: 1,
                turnNumber: 0,
                gameState: {
                    player1Position: { x: 100, y: 450 },
                    player2Position: { x: 900, y: 450 },
                    player1Health: 100,
                    player2Health: 100
                    // Add any other game state you need
                }
            };

            games.set(matchId, game);
            opponent.gameId = matchId;
            ws.gameId = matchId;

            // Notify both players
            opponent.send(JSON.stringify({
                type: 'gameStart',
                playerNumber: 1,
                matchId,
                opponentId: userId,
                opponentUsername: ws.username,
                currentTurn: 1,
                gameState: game.gameState
            }));

            ws.send(JSON.stringify({
                type: 'gameStart',
                playerNumber: 2,
                matchId,
                opponentId: opponent.userId,
                opponentUsername: opponent.username,
                currentTurn: 1,
                gameState: game.gameState
            }));

            console.log(`Game ${matchId} started: ${opponent.username} vs ${ws.username}`);
        } catch (error) {
            console.error('Error creating match:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to create match'
            }));
        }
    } else {
        // Add to waiting queue
        waitingPlayers.push(ws);
        ws.send(JSON.stringify({
            type: 'waiting',
            message: 'Waiting for opponent...'
        }));
        console.log(`${ws.username} waiting for opponent`);
    }
}

function handleMove(ws, data) {
    const gameId = ws.gameId;
    const game = games.get(gameId);

    if (!game) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Game not found'
        }));
        return;
    }

    const player = game.players.find(p => p.ws === ws);

    // Verify it's this player's turn
    if (player.playerNumber !== game.currentTurn) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Not your turn!'
        }));
        return;
    }

    // Update game state IN MEMORY ONLY
    if (player.playerNumber === 1) {
        game.gameState.player1Position = { x: data.x, y: data.y };
    } else {
        game.gameState.player2Position = { x: data.x, y: data.y };
    }

    // Update any other game state (health, cards, etc.)
    if (data.damage) {
        const targetPlayer = player.playerNumber === 1 ? 'player2Health' : 'player1Health';
        game.gameState[targetPlayer] = Math.max(0, game.gameState[targetPlayer] - data.damage);
    }

    // Increment turn number
    game.turnNumber++;

    // Switch turns
    game.currentTurn = game.currentTurn === 1 ? 2 : 1;

    console.log(`Move: ${ws.username} to (${data.x}, ${data.y})`);

    // Check win condition
    if (game.gameState.player1Health <= 0 || game.gameState.player2Health <= 0) {
        const winner = game.gameState.player1Health > 0 ? 1 : 2;
        handleGameEnd(game, winner);
        return;
    }

    // Broadcast to both players
    game.players.forEach(p => {
        if (p.ws.readyState === 1) {
            p.ws.send(JSON.stringify({
                type: 'gameUpdate',
                gameState: game.gameState,
                currentTurn: game.currentTurn,
                movedPlayer: player.playerNumber,
                turnNumber: game.turnNumber
            }));
        }
    });
}

async function handleEndGame(ws, data) {
    const gameId = ws.gameId;
    const game = games.get(gameId);

    if (!game) return;

    await handleGameEnd(game, data.winner);
}

async function handleGameEnd(game, winnerNumber) {
    try {
        const winner = game.players.find(p => p.playerNumber === winnerNumber);

        // Save only the final result to database
        await Match.findByIdAndUpdate(game.matchId, {
            status: 'completed',
            winner: winner.userId,
            endedAt: new Date()
        });

        // Notify both players
        game.players.forEach(p => {
            if (p.ws.readyState === 1) {
                p.ws.send(JSON.stringify({
                    type: 'gameEnd',
                    winner: winnerNumber,
                    winnerUsername: winner.username,
                    isWinner: p.playerNumber === winnerNumber
                }));
                p.ws.gameId = null; // Clear game ID
            }
        });

        // Clean up memory
        games.delete(game.matchId);
        console.log(`Game ${game.matchId} ended. Winner: ${winner.username}`);
    } catch (error) {
        console.error('Error ending game:', error);
    }
}

function handleDisconnect(ws) {
    // Remove from player connections
    if (ws.userId) {
        playerConnections.delete(ws.userId);
        console.log(`User ${ws.username} disconnected`);
    }

    // Remove from waiting queue
    const waitingIndex = waitingPlayers.indexOf(ws);
    if (waitingIndex > -1) {
        waitingPlayers.splice(waitingIndex, 1);
        console.log(`${ws.username} removed from waiting queue`);
        return;
    }

    // Handle game disconnect
    const gameId = ws.gameId;
    if (gameId) {
        const game = games.get(gameId);
        if (game) {
            // Find opponent
            const opponent = game.players.find(p => p.ws !== ws);

            // Save match as abandoned with opponent as winner
            Match.findByIdAndUpdate(game.matchId, {
                status: 'abandoned',
                winner: opponent?.userId || null,
                endedAt: new Date()
            }).catch(err => console.error('Error updating match:', err));

            // Notify opponent
            if (opponent && opponent.ws.readyState === 1) {
                opponent.ws.send(JSON.stringify({
                    type: 'opponentDisconnected',
                    message: `${ws.username} disconnected. You win!`
                }));
                opponent.ws.gameId = null;
            }

            // Clean up memory
            games.delete(gameId);
            console.log(`Game ${gameId} ended - ${ws.username} disconnected`);
        }
    }
}
async function handleCardMarket(ws, data) {
    if (!ws.authenticated) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
        return;
    }

    // Generate a fresh Match ID immediately for the market session
    // We import mongoose to generate a valid ObjectId-like string
    const matchId = new Date().getTime().toString(); // Simple timestamp ID for demo
    // OR if you have mongoose imported: const matchId = new mongoose.Types.ObjectId().toString();

    console.log(`Market session started for ${ws.username}`);

    // Send back the IDs to unlock the loading screen
    ws.send(JSON.stringify({
        type: 'cardMarketReady',
        playerId: ws.userId,
        playerNumber: 1, // Default to Player 1 for market view
        matchId: matchId
    }));
}