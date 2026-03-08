import jwt from "jsonwebtoken";
import { env } from "../shared/env.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Bearer token" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload; // { userId, role, email }
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}
