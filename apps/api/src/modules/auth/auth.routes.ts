import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { createRateLimit } from "../../middleware/rate-limit";
import { getMe, postLogin, postLogout, postRegister } from "./auth.controller";
import { requireAuth } from "./auth.middleware";

export const authRouter: ExpressRouter = Router();

const authRateLimit = createRateLimit({
  bucket: "auth",
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
});

authRouter.post("/auth/register", authRateLimit, postRegister);
authRouter.post("/auth/login", authRateLimit, postLogin);
authRouter.post("/auth/logout", postLogout);
authRouter.get("/auth/me", requireAuth, getMe);
