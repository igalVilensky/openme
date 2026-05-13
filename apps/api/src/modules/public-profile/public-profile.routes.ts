import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { getPublicProfile } from "./public-profile.controller";

export const publicProfileRouter: ExpressRouter = Router();

publicProfileRouter.get("/public/profiles/:username", getPublicProfile);
