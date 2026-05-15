import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { getMe, postLogin, postLogout, postRegister } from "./auth.controller";
import { requireAuth } from "./auth.middleware";

export const authRouter: ExpressRouter = Router();

authRouter.post("/auth/register", postRegister);
authRouter.post("/auth/login", postLogin);
authRouter.post("/auth/logout", postLogout);
authRouter.get("/auth/me", requireAuth, getMe);
