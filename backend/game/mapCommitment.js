import crypto from "crypto";

export const createMapCommitment = (grid, center) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(grid) + JSON.stringify(center) + salt)
    .digest("hex");

  return { grid_layout: grid, center_coords: center, map_salt: salt, map_hash: hash };
};
