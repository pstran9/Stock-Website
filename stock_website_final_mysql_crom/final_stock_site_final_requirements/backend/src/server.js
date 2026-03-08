import http from "http";
import app from "./app.js";
import { env } from "./shared/env.js";

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
