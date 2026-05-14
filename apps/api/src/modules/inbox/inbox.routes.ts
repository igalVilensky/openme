import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import {
  getDemoInbox,
  getDemoInboxSubmissionById,
  patchDemoInboxSubmissionStatus
} from "./inbox.controller";

export const inboxRouter: ExpressRouter = Router();

// Temporary MVP dashboard routes: "demo" is the seeded owner until auth lands.
inboxRouter.get("/dashboard/demo/inbox", getDemoInbox);
inboxRouter.get(
  "/dashboard/demo/inbox/:submissionId",
  getDemoInboxSubmissionById
);
inboxRouter.patch(
  "/dashboard/demo/inbox/:submissionId/status",
  patchDemoInboxSubmissionStatus
);
