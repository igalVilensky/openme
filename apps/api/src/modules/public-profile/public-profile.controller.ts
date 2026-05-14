import type { RequestHandler } from "express";

import { HttpError } from "../../errors/http-error";
import {
  getPublicEndpointByUsernameAndSlug,
  getPublicProfileByUsername
} from "./public-profile.service";

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

export const getPublicEndpoint: RequestHandler = async (req, res, next) => {
  try {
    const endpoint = await getPublicEndpointByUsernameAndSlug(
      req.params.username ?? "",
      req.params.endpointSlug ?? ""
    );

    if (!endpoint) {
      throw new HttpError(404, "Public endpoint not found");
    }

    res.status(200).json(endpoint);
  } catch (error) {
    next(error);
  }
};
