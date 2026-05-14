import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { postPublicSubmission } from "./public-submission.controller";

export const publicSubmissionRouter: ExpressRouter = Router();

publicSubmissionRouter.post(
  "/public/profiles/:username/endpoints/:endpointSlug/submissions",
  postPublicSubmission
);
