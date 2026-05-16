import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { requireAuth } from "../auth/auth.middleware";
import {
  deleteDashboardEndpointBoundaryById,
  deleteDashboardEndpointById,
  deleteDashboardEndpointFieldById,
  getDashboardEndpointById,
  getDashboardEndpoints,
  patchDashboardEndpoint,
  patchDashboardEndpointBoundary,
  patchDashboardEndpointField,
  patchDashboardEndpointFieldsReorder,
  patchDashboardEndpointsReorder,
  postDashboardEndpoint,
  postDashboardEndpointBoundary,
  postDashboardEndpointField,
} from "./dashboard-endpoints.controller";

export const dashboardEndpointsRouter: ExpressRouter = Router();

dashboardEndpointsRouter.get(
  "/dashboard/endpoints",
  requireAuth,
  getDashboardEndpoints,
);
dashboardEndpointsRouter.post(
  "/dashboard/endpoints",
  requireAuth,
  postDashboardEndpoint,
);
dashboardEndpointsRouter.patch(
  "/dashboard/endpoints/reorder",
  requireAuth,
  patchDashboardEndpointsReorder,
);
dashboardEndpointsRouter.get(
  "/dashboard/endpoints/:endpointId",
  requireAuth,
  getDashboardEndpointById,
);
dashboardEndpointsRouter.patch(
  "/dashboard/endpoints/:endpointId",
  requireAuth,
  patchDashboardEndpoint,
);
dashboardEndpointsRouter.delete(
  "/dashboard/endpoints/:endpointId",
  requireAuth,
  deleteDashboardEndpointById,
);
dashboardEndpointsRouter.post(
  "/dashboard/endpoints/:endpointId/fields",
  requireAuth,
  postDashboardEndpointField,
);
dashboardEndpointsRouter.patch(
  "/dashboard/endpoints/:endpointId/fields/reorder",
  requireAuth,
  patchDashboardEndpointFieldsReorder,
);
dashboardEndpointsRouter.patch(
  "/dashboard/endpoints/:endpointId/fields/:fieldId",
  requireAuth,
  patchDashboardEndpointField,
);
dashboardEndpointsRouter.delete(
  "/dashboard/endpoints/:endpointId/fields/:fieldId",
  requireAuth,
  deleteDashboardEndpointFieldById,
);
dashboardEndpointsRouter.post(
  "/dashboard/endpoints/:endpointId/boundaries",
  requireAuth,
  postDashboardEndpointBoundary,
);
dashboardEndpointsRouter.patch(
  "/dashboard/endpoints/:endpointId/boundaries/:boundaryId",
  requireAuth,
  patchDashboardEndpointBoundary,
);
dashboardEndpointsRouter.delete(
  "/dashboard/endpoints/:endpointId/boundaries/:boundaryId",
  requireAuth,
  deleteDashboardEndpointBoundaryById,
);
