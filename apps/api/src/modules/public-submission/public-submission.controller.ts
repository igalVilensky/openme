import type { RequestHandler } from "express";

import { createPublicSubmission } from "./public-submission.service";

export const postPublicSubmission: RequestHandler = async (req, res, next) => {
  try {
    const submission = await createPublicSubmission(
      req.params.username ?? "",
      req.params.endpointSlug ?? "",
      req.body
    );

    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};
