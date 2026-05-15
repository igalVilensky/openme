import type { Request, RequestHandler } from "express";

import { HttpError } from "../../errors/http-error";
import { getAuthSessionByUserId, verifyAuthToken } from "./auth.service";
import { getAuthTokenFromRequest } from "./auth.cookies";
import type { AuthSessionSummary } from "./auth.types";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = getAuthTokenFromRequest(req);
    const userId = token ? verifyAuthToken(token) : null;

    if (!userId) {
      throw new HttpError(401, "Authentication required");
    }

    const session = await getAuthSessionByUserId(userId);

    if (!session) {
      throw new HttpError(401, "Authentication required");
    }

    req.auth = session;
    next();
  } catch (error) {
    next(error);
  }
};

export function getRequiredAuth(req: Request): AuthSessionSummary {
  if (!req.auth) {
    throw new HttpError(401, "Authentication required");
  }

  return req.auth;
}
