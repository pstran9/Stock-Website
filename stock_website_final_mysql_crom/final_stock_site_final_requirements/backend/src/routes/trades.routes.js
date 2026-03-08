import { Router } from "express";
import { z } from "zod";
import { validate } from "../shared/validate.js";
import { requireAuth } from "../middleware/auth.js";
import * as TradesController from "../controllers/trades.controller.js";

const router = Router();

router.get("/portfolio", requireAuth, TradesController.portfolio);
router.get("/transactions", requireAuth, TradesController.transactions);

const TradeSchema = z.object({
  body: z.object({
    ticker: z.string().min(1).max(10),
    shares: z.number().positive(),
  })
});

router.post("/buy", requireAuth, validate(TradeSchema), TradesController.buy);
router.post("/sell", requireAuth, validate(TradeSchema), TradesController.sell);

export default router;
