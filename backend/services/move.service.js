export const isMoveValid = (state, player, to) => {
  const grid = state.mapCommitment.grid_layout;
  
  // Check if coordinates are within bounds
  if (to.x < 0 || to.x >= grid.length || to.y < 0 || to.y >= grid[0].length) {
    return false;
  }
  
  // Check if player has RAM_ACTIVE effect (ignores walls)
  const ignore = player.active_effects?.includes("RAM_ACTIVE");
  
  // Check if cell is a wall
  if (!ignore && grid[to.x][to.y] === 1) {
    return false;
  }

  // Check for dynamic walls
  const blocked = state.gameState.dynamic_walls.some(
    w => w.x === to.x && w.y === to.y
  );
  if (!ignore && blocked) {
    return false;
  }

  // Check if move is adjacent (only 1 cell away)
  const dx = Math.abs(to.x - player.current_pos.x);
  const dy = Math.abs(to.y - player.current_pos.y);
  if (dx + dy !== 1) {
    return false; // Not an adjacent move
  }

  return true;
};