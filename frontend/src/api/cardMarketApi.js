import axios from "axios";

export async function saveSelectedCards({
  playerId,
  gameId,
  wallet,
  cards,
  totalCost,
}) {
  if (!playerId || !gameId || !wallet) {
    throw new Error("Missing required fields");
  }

  const res = await axios.post("/api/save-cards", {
    playerId,
    gameId,
    wallet,
    cards,
    totalCost,
  });

  return res.data; // axios already parses JSON
}
