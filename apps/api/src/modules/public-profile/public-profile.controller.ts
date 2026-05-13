import type { RequestHandler } from "express";

import { HttpError } from "../../errors/http-error";
import { getPublicProfileByUsername } from "./public-profile.service";

export const getPublicProfile: RequestHandler = async (req, res, next) => {
  try {
    const profile = await getPublicProfileByUsername(req.params.username ?? "");

    if (!profile) {
      throw new HttpError(404, "Public profile not found");
    }

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};
