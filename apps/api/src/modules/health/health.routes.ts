import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { getHealth } from "./health.controller";

export const healthRouter: ExpressRouter = Router();

healthRouter.get("/health", getHealth);
