import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../shared/validate.js";
import * as OrdersController from "../controllers/orders.controller.js";

const router = Router();
router.use(requireAuth);

const OrderSchema = z.object({
  body: z.object({
    ticker: z.string().min(1).max(10),
    type: z.enum(["BUY", "SELL"]),
    shares: z.number().positive(),
  })
});

router.get('/', OrdersController.list);
router.post('/', validate(OrderSchema), OrdersController.create);
router.post('/:id/cancel', OrdersController.cancel);

export default router;
