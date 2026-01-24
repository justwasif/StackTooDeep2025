import { ActiveMatches } from "../game/activeMatches.js";
import { createMapCommitment } from "../game/mapCommitment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "crypto";

export const createMatch = asyncHandler(async (req, res) => {
  const matchId = crypto.randomUUID();

  const grid = Array.from({ length: 10 }, () => Array(10).fill(0));
  const center = { x: 5, y: 5 };

  ActiveMatches.set(matchId, {
    mapCommitment: createMapCommitment(grid, center),
    gameState: {
      players: {},
      dynamic_walls: [],
      current_turn: null,
      skipped_flags: {}
    }
  });

  res.json(new ApiResponse(201, { matchId }, "Match created"));
});

export const joinMatch = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  
  const match = ActiveMatches.get(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  const playerCount = Object.keys(match.gameState.players).length;
  if (playerCount >= 2) throw new ApiError(400, "Match is full");

  // Initialize player state
  const startPos = playerCount === 0 ? { x: 0, y: 0 } : { x: 9, y: 9 };
  
  match.gameState.players[req.user._id] = {
    current_pos: startPos,
    previous_pos: null,
    visited_cells: [startPos],
    active_effects: [],
    cards: []
  };

  // Set first player's turn
  if (!match.gameState.current_turn) {
    match.gameState.current_turn = req.user._id;
  }

  res.json(new ApiResponse(200, { 
    matchId, 
    playerPosition: startPos,
    isYourTurn: match.gameState.current_turn === req.user._id
  }, "Joined match"));
});