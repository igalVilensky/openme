import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { createRateLimit } from "../../middleware/rate-limit";
import { postPublicSubmission } from "./public-submission.controller";

export const publicSubmissionRouter: ExpressRouter = Router();

const publicSubmissionRateLimit = createRateLimit({
  bucket: "public-submission",
  maxRequests: 20,
  windowMs: 15 * 60 * 1000,
});

publicSubmissionRouter.post(
  "/public/profiles/:username/endpoints/:endpointSlug/submissions",
  publicSubmissionRateLimit,
  postPublicSubmission
);
