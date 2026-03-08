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
    username: z.string().optional(),
  })
});

router.post("/register", validate(RegisterSchema), AuthController.register);

const LoginSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    username: z.string().optional(),
    password: z.string().min(1),
  }).refine((v) => Boolean(v.email || v.username), { message: "Email or username is required" })
});

router.post("/login", validate(LoginSchema), AuthController.login);

export default router;
