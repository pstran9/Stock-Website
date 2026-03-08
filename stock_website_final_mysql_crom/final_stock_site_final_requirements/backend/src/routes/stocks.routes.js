import { Router } from "express";
import * as StocksController from "../controllers/stocks.controller.js";

const router = Router();

router.get("/", StocksController.list);
router.get("/:ticker", StocksController.get);
router.get("/:ticker/quote", StocksController.quote);
router.get("/:ticker/history", StocksController.history);

export default router;
