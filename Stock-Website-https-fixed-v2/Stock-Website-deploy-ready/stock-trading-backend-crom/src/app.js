import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import YAML from "yaml";

import { env } from "./shared/env.js";
import { notFound, errorHandler } from "./shared/errors.js";

import authRoutes from "./routes/auth.routes.js";
import stockRoutes from "./routes/stocks.routes.js";
import tradeRoutes from "./routes/trades.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();
const allowedOrigins = new Set(env.CORS_ORIGINS);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.options("*", cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    at: new Date().toISOString(),
    allowedOrigins: env.CORS_ORIGINS,
  });
});

const openapi = YAML.parse(
  fs.readFileSync(new URL("./openapi.yaml", import.meta.url), "utf-8")
);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
