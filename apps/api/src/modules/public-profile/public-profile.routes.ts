import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import {
  getPublicEndpoint,
  getPublicProfile
} from "./public-profile.controller";

export const publicProfileRouter: ExpressRouter = Router();

publicProfileRouter.get("/public/profiles/:username", getPublicProfile);
publicProfileRouter.get(
  "/public/profiles/:username/endpoints/:endpointSlug",
  getPublicEndpoint
);
