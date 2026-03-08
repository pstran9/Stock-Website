import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../shared/env.js";
import { createUser, findUserByEmail, findUserById, findUserByUsername } from "../repositories/users.repo.js";

function signUser(user) {
  const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, env.JWT_SECRET, { expiresIn: "7d" });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      cashBalance: Number(user.cash_balance || 0),
    }
  };
}

export async function register({ email, username, password, fullName }) {
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    const err = new Error("Email already exists"); err.statusCode = 409; throw err;
  }
  if (username) {
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      const err = new Error("Username already exists"); err.statusCode = 409; throw err;
    }
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const id = await createUser({ email, username, passwordHash, fullName, role: "USER" });
  const user = await findUserById(id);
  return signUser(user);
}

export async function login({ email, username, password }) {
  const user = email ? await findUserByEmail(email) : await findUserByUsername(username);
  if (!user) { const err = new Error("Invalid credentials"); err.statusCode = 401; throw err; }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) { const err = new Error("Invalid credentials"); err.statusCode = 401; throw err; }
  return signUser(user);
}
