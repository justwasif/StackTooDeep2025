/**
 * ActiveMatches
 * --------------
 * In-memory God View store for all running matches.
 * 
 * Key   : matchId (string)
 * Value : {
 *   mapCommitment: {
 *     grid_layout,
 *     center_coords,
 *     map_salt,
 *     map_hash
 *   },
 *   gameState: {
 *     players,
 *     dynamic_walls,
 *     current_turn,
 *     skipped_flags
 *   }
 * }
 */

export const ActiveMatches = new Map();

/* ---------- Helper Functions (Optional but Useful) ---------- */

export const createActiveMatch = (matchId, mapCommitment, gameState) => {
  ActiveMatches.set(matchId, {
    mapCommitment,
    gameState,
  });
};

export const getActiveMatch = (matchId) => {
  return ActiveMatches.get(matchId);
};

export const deleteActiveMatch = (matchId) => {
  ActiveMatches.delete(matchId);
};

export const hasActiveMatch = (matchId) => {
  return ActiveMatches.has(matchId);
};
