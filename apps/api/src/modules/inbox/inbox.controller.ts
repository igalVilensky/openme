import type { RequestHandler } from "express";

import { HttpError } from "../../errors/http-error";
import { getRequiredAuth } from "../auth/auth.middleware";
import {
  getInboxSubmission,
  getDemoInboxSubmission,
  listInboxSubmissions,
  listDemoInboxSubmissions,
  updateInboxSubmissionStatus,
  updateDemoInboxSubmissionStatus,
} from "./inbox.service";
import { validateInboxStatusBody } from "./inbox.validators";

export const getInbox: RequestHandler = async (req, res, next) => {
  try {
    const auth = getRequiredAuth(req);
    const submissions = await listInboxSubmissions(auth.profile.id);

    res.status(200).json(submissions);
  } catch (error) {
    next(error);
  }
};

export const getDemoInbox: RequestHandler = async (_req, res, next) => {
  try {
    const submissions = await listDemoInboxSubmissions();

    res.status(200).json(submissions);
  } catch (error) {
    next(error);
  }
};

export const getInboxSubmissionById: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const submission = await getInboxSubmission(
      auth.profile.id,
      req.params.submissionId ?? "",
    );

    if (!submission) {
      throw new HttpError(404, "Inbox submission not found");
    }

    res.status(200).json(submission);
  } catch (error) {
    next(error);
  }
};

export const getDemoInboxSubmissionById: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const submission = await getDemoInboxSubmission(
      req.params.submissionId ?? "",
    );

    if (!submission) {
      throw new HttpError(404, "Inbox submission not found");
    }

    res.status(200).json(submission);
  } catch (error) {
    next(error);
  }
};

export const patchInboxSubmissionStatus: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateInboxStatusBody(req.body);

    if (!validation.ok) {
      throw new HttpError(
        400,
        `Validation failed: ${validation.errors.join("; ")}`,
      );
    }

    const submission = await updateInboxSubmissionStatus(
      auth.profile.id,
      req.params.submissionId ?? "",
      validation.value.status,
    );

    if (!submission) {
      throw new HttpError(404, "Inbox submission not found");
    }

    res.status(200).json(submission);
  } catch (error) {
    next(error);
  }
};

export const patchDemoInboxSubmissionStatus: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const validation = validateInboxStatusBody(req.body);

    if (!validation.ok) {
      throw new HttpError(
        400,
        `Validation failed: ${validation.errors.join("; ")}`,
      );
    }

    const submission = await updateDemoInboxSubmissionStatus(
      req.params.submissionId ?? "",
      validation.value.status,
    );

    if (!submission) {
      throw new HttpError(404, "Inbox submission not found");
    }

    res.status(200).json(submission);
  } catch (error) {
    next(error);
  }
};
