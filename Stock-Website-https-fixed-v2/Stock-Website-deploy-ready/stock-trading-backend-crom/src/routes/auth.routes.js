import { Router } from "express";
import { z } from "zod";
import { validate } from "../shared/validate.js";
import * as AuthController from "../controllers/auth.controller.js";

const router = Router();

const RegisterSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(1),
    username: z.string().trim().min(1).max(50).optional(),
  })
});

router.post("/register", validate(RegisterSchema), AuthController.register);

const LoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })
});

router.post("/login", validate(LoginSchema), AuthController.login);

export default router;
