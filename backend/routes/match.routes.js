import { Router } from "express";
import { createMatch, joinMatch } from "../controllers/match.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.post("/create", verifyJWT, createMatch);
router.post("/:matchId/join", verifyJWT, joinMatch);
export default router;