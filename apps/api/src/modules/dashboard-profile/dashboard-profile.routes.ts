import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware";
import {
  getDashboardProfileByOwner,
  patchDashboardProfileByOwner,
} from "./dashboard-profile.controller";

export const dashboardProfileRouter: ExpressRouter = Router();

dashboardProfileRouter.get(
  "/dashboard/profile",
  requireAuth,
  getDashboardProfileByOwner,
);
dashboardProfileRouter.patch(
  "/dashboard/profile",
  requireAuth,
  patchDashboardProfileByOwner,
);
