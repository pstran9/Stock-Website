import dotenv from "dotenv";

dotenv.config();

function req(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function parseAllowedOrigins() {
  const raw =
    process.env.CORS_ORIGIN ||
    [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://stocktrader-frontend-pt-tm20.s3-website-us-east-1.amazonaws.com",
      "https://stocktrader-frontend-pt-tm20.s3.us-east-1.amazonaws.com",
    ].join(",");

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: process.env.NODE_ENV || "development",

  JWT_SECRET: req("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",

  DB_HOST: req("DB_HOST"),
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: req("DB_USER"),
  DB_PASSWORD: req("DB_PASSWORD"),
  DB_NAME: req("DB_NAME"),

  // Supports comma-separated origins in .env
  CORS_ORIGINS: parseAllowedOrigins(),

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 120),
};
