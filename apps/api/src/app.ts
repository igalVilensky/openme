import cors from "cors";
import express from "express";
import type { Express } from "express";

import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { apiRouter } from "./routes";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      // WEB_URL is the single frontend origin allowed to send credentialed
      // browser requests. Keep this aligned with the deployed Next.js URL.
      origin: env.webUrl,
      credentials: true
    })
  );
  app.use(express.json());

  app.use(apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
