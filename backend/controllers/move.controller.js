import { ActiveMatches } from "../game/activeMatches.js";
import { isMoveValid } from "../services/move.service.js";
import { generateMoveProof } from "../services/zk.service.js"; // 👈 IMPORT THIS
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const movePlayer = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { x, y } = req.body;

  const match = ActiveMatches.get(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  // Check if it's the player's turn
  if (match.gameState.current_turn !== req.user._id) {
    throw new ApiError(403, "Not your turn");
  }

  const player = match.gameState.players[req.user._id];
  if (!player) throw new ApiError(403, "Not in match");

  // 1. Capture State BEFORE update (for ZK Inputs)
  const oldX = player.current_pos.x;
  const oldY = player.current_pos.y;
  
  // Check if RAM is currently active (return 1 or 0 for the circuit)
  const ramActive = player.active_effects.includes("RAM_ACTIVE") ? 1 : 0;

  // 2. Validate Logic
  if (!isMoveValid(match, player, { x, y })) {
    throw new ApiError(400, "Invalid move");
  }

  // 3. Update State
  player.previous_pos = player.current_pos;
  player.current_pos = { x, y };
  player.visited_cells.push({ x, y });

  // Clear RAM_ACTIVE effect after use
  if (player.active_effects.includes("RAM_ACTIVE")) {
    player.active_effects = player.active_effects.filter(e => e !== "RAM_ACTIVE");
  }

  // Switch turn
  const allPlayers = Object.keys(match.gameState.players);
  const otherPlayer = allPlayers.find(id => id !== req.user._id);
  if (otherPlayer) {
    match.gameState.current_turn = otherPlayer;
  }

  // =========================================================
  // 4. 🔐 GENERATE ZK PROOF (NEW SECTION)
  // =========================================================
  
  // Extract Secret Map Data from the Match State
  const { grid_layout, map_salt, map_hash } = match.mapCommitment;

  // Prepare Inputs for the Circuit
  const zkInput = {
    oldX: oldX,
    oldY: oldY,
    newX: x,
    newY: y,
    mapHash: map_hash,    // Public Fingerprint
    ramActive: ramActive, // Was the card used?
    mapGrid: grid_layout, // SECRET: The Map Walls
    salt: map_salt        // SECRET: The Random Salt
  };

  // Generate the Proof
  // (We await it because it takes ~100ms)
  const { proof, publicSignals } = await generateMoveProof(zkInput);

  // =========================================================

  res.json(new ApiResponse(200, { 
    position: player.current_pos,
    nextTurn: match.gameState.current_turn,
    // Send proof to client so they can verify!
    zkProof: proof,          
    publicSignals: publicSignals 
  }, "Moved"));
});