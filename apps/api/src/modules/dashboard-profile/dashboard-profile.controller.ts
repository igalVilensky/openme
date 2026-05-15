import type { RequestHandler } from "express";

import { HttpError } from "../../errors/http-error";
import { getRequiredAuth } from "../auth/auth.middleware";
import {
  getDashboardProfile,
  updateDashboardProfile,
} from "./dashboard-profile.service";
import { validateDashboardProfileUpdateBody } from "./dashboard-profile.validators";

export const getDashboardProfileByOwner: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const profile = await getDashboardProfile(auth.profile.id);

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const patchDashboardProfileByOwner: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardProfileUpdateBody(req.body);

    if (!validation.ok) {
      throw new HttpError(
        400,
        `Validation failed: ${validation.errors.join("; ")}`,
      );
    }

    const profile = await updateDashboardProfile(
      auth.profile.id,
      validation.value,
    );

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};
