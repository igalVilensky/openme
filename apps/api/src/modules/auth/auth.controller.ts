import type { RequestHandler } from "express";

import { HttpError } from "../../errors/http-error";
import { clearAuthCookie, setAuthCookie } from "./auth.cookies";
import { getRequiredAuth } from "./auth.middleware";
import { loginUser, registerUser } from "./auth.service";
import { validateLoginBody, validateRegisterBody } from "./auth.validators";

export const postRegister: RequestHandler = async (req, res, next) => {
  try {
    const validation = validateRegisterBody(req.body);

    if (!validation.ok) {
      throw new HttpError(
        400,
        `Validation failed: ${validation.errors.join("; ")}`,
      );
    }

    const session = await registerUser(validation.value);

    setAuthCookie(res, session.user.id);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

export const postLogin: RequestHandler = async (req, res, next) => {
  try {
    const validation = validateLoginBody(req.body);

    if (!validation.ok) {
      throw new HttpError(
        400,
        `Validation failed: ${validation.errors.join("; ")}`,
      );
    }

    const session = await loginUser(validation.value);

    setAuthCookie(res, session.user.id);
    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};

export const postLogout: RequestHandler = (_req, res) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
  });
};

export const getMe: RequestHandler = (req, res, next) => {
  try {
    res.status(200).json(getRequiredAuth(req));
  } catch (error) {
    next(error);
  }
};
