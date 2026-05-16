import type { RequestHandler } from "express";

import { HttpError } from "../../errors/http-error";
import { getRequiredAuth } from "../auth/auth.middleware";
import {
  createDashboardLink,
  deleteDashboardLink,
  listDashboardLinks,
  reorderDashboardLinks,
  updateDashboardLink,
} from "./dashboard-links.service";
import {
  validateDashboardLinkCreateBody,
  validateDashboardLinksReorderBody,
  validateDashboardLinkUpdateBody,
} from "./dashboard-links.validators";

function validationError(errors: string[]): HttpError {
  return new HttpError(400, `Validation failed: ${errors.join("; ")}`);
}

export const getDashboardLinks: RequestHandler = async (req, res, next) => {
  try {
    const auth = getRequiredAuth(req);
    const links = await listDashboardLinks(auth.profile.id);

    res.status(200).json(links);
  } catch (error) {
    next(error);
  }
};

export const postDashboardLink: RequestHandler = async (req, res, next) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardLinkCreateBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const link = await createDashboardLink(auth.profile.id, validation.value);

    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
};

export const patchDashboardLink: RequestHandler = async (req, res, next) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardLinkUpdateBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const link = await updateDashboardLink(
      auth.profile.id,
      req.params.linkId ?? "",
      validation.value,
    );

    if (!link) {
      throw new HttpError(404, "Dashboard link not found");
    }

    res.status(200).json(link);
  } catch (error) {
    next(error);
  }
};

export const deleteDashboardLinkById: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const didDelete = await deleteDashboardLink(
      auth.profile.id,
      req.params.linkId ?? "",
    );

    if (!didDelete) {
      throw new HttpError(404, "Dashboard link not found");
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const patchDashboardLinksReorder: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardLinksReorderBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const result = await reorderDashboardLinks(
      auth.profile.id,
      validation.value.orderedIds,
    );

    if (!result.ok) {
      throw new HttpError(
        400,
        "orderedIds must contain exactly all link ids for this profile",
      );
    }

    res.status(200).json(result.links);
  } catch (error) {
    next(error);
  }
};
