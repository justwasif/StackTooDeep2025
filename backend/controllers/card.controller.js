
import { ActiveMatches } from "../game/activeMatches.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const useCard = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { card, payload } = req.body;

  const match = ActiveMatches.get(matchId);
  if (!match) throw new ApiError(404, "Match not found");

  const player = match.gameState.players[req.user._id];
  if (!player) throw new ApiError(403, "Not player");

  switch (card) {
    case 1:
      player.active_effects.push("RAM_ACTIVE");
      break;

    case 3:
      const opponent = Object.values(match.gameState.players)
        .find(p => p !== player);
      opponent.visited_cells = [opponent.current_pos];
      break;

    case 4:
      match.gameState.skipped_flags[payload.target] = true;
      break;

    case 5:
      match.gameState.dynamic_walls.push(payload);
      break;

    default:
      throw new ApiError(400, "Unknown card");
  }

  res.json(new ApiResponse(200, {}, "Card used"));
});
