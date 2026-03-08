import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as UserController from "../controllers/user.controller.js";

const router = Router();
router.get('/dashboard', requireAuth, UserController.dashboard);
export default router;
