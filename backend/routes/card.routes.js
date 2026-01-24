
import { Router } from "express";
import { useCard } from "../controllers/card.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.post("/:matchId/use", verifyJWT, useCard);
export default router;
