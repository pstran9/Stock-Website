import { Router } from "express";
import { z } from "zod";
import { validate } from "../shared/validate.js";
import { requireAuth } from "../middleware/auth.js";
import * as WalletController from "../controllers/wallet.controller.js";

const router = Router();
const CashSchema = z.object({ body: z.object({ amount: z.number().positive() }) });
router.post('/deposit', requireAuth, validate(CashSchema), WalletController.deposit);
router.post('/withdraw', requireAuth, validate(CashSchema), WalletController.withdraw);
export default router;
