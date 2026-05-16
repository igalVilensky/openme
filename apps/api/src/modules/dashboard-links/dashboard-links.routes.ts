import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware";
import {
  deleteDashboardLinkById,
  getDashboardLinks,
  patchDashboardLink,
  patchDashboardLinksReorder,
  postDashboardLink,
} from "./dashboard-links.controller";

export const dashboardLinksRouter: ExpressRouter = Router();

dashboardLinksRouter.get("/dashboard/links", requireAuth, getDashboardLinks);
dashboardLinksRouter.post("/dashboard/links", requireAuth, postDashboardLink);
dashboardLinksRouter.patch(
  "/dashboard/links/reorder",
  requireAuth,
  patchDashboardLinksReorder,
);
dashboardLinksRouter.patch(
  "/dashboard/links/:linkId",
  requireAuth,
  patchDashboardLink,
);
dashboardLinksRouter.delete(
  "/dashboard/links/:linkId",
  requireAuth,
  deleteDashboardLinkById,
);
