import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../shared/env.js";
import { createUser, findUserByEmail, findUserByUsername } from "../repositories/users.repo.js";

export async function register({ email, password, fullName, username }) {
  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) {
    const err = new Error("Email already in use");
    err.statusCode = 409;
    throw err;
  }
  const normalizedUsername = String(username || '').trim();
  if (normalizedUsername) {
    const existingUsername = await findUserByUsername(normalizedUsername);
    if (existingUsername) {
      const err = new Error("Username already in use");
      err.statusCode = 409;
      throw err;
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = await createUser({
    email: email.toLowerCase(),
    passwordHash,
    fullName,
    username: normalizedUsername || null,
    role: "USER"
  });
  return { userId };
}

export async function login({ email, password }) {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      cashBalance: Number(user.cash_balance),
    },
  };
}
