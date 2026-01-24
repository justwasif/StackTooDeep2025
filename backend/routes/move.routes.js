import { Router } from "express";
import { movePlayer } from "../controllers/move.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.post("/:matchId/move", verifyJWT, movePlayer);
export default router;
