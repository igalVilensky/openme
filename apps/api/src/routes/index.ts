import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { healthRouter } from "../modules/health/health.routes";

export const apiRouter: ExpressRouter = Router();

apiRouter.use(healthRouter);
