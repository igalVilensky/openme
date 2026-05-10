import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`OpenMe API listening on port ${env.port}`);
});

function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} received, shutting down API`);
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
