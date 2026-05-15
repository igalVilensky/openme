import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import {
  getInbox,
  getDemoInbox,
  getInboxSubmissionById,
  getDemoInboxSubmissionById,
  patchInboxSubmissionStatus,
  patchDemoInboxSubmissionStatus,
} from "./inbox.controller";
import { requireAuth } from "../auth/auth.middleware";

export const inboxRouter: ExpressRouter = Router();

inboxRouter.get("/dashboard/inbox", requireAuth, getInbox);
inboxRouter.get(
  "/dashboard/inbox/:submissionId",
  requireAuth,
  getInboxSubmissionById,
);
inboxRouter.patch(
  "/dashboard/inbox/:submissionId/status",
  requireAuth,
  patchInboxSubmissionStatus,
);

// Legacy demo-only routes for local demo compatibility.
inboxRouter.get("/dashboard/demo/inbox", getDemoInbox);
inboxRouter.get(
  "/dashboard/demo/inbox/:submissionId",
  getDemoInboxSubmissionById,
);
inboxRouter.patch(
  "/dashboard/demo/inbox/:submissionId/status",
  patchDemoInboxSubmissionStatus,
);
