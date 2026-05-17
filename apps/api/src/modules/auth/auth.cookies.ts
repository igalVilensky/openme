import type { Request, Response } from "express";
import type { CookieOptions } from "express";

import { env } from "../../config/env";
import { signAuthToken } from "./auth.service";

export const AUTH_COOKIE_NAME = "openme_auth";

const AUTH_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

function getAuthCookieSameSite(): CookieOptions["sameSite"] {
  return env.nodeEnv === "production" ? "none" : "lax";
}

function getBaseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    path: "/",
    // Local/dev auth stays SameSite=Lax on localhost. Production free-tier
    // frontend/API hosts are often split, so SameSite=None pairs with Secure.
    sameSite: getAuthCookieSameSite(),
    secure: env.nodeEnv === "production",
    // Intentionally no domain: localhost and deployment hosts own their cookies.
  };
}

function parseCookieHeader(value: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();

  if (!value) {
    return cookies;
  }

  for (const part of value.split(";")) {
    const [rawName, ...rawValueParts] = part.split("=");
    const name = rawName?.trim();

    if (!name) {
      continue;
    }

    const rawValue = rawValueParts.join("=").trim();

    try {
      cookies.set(name, decodeURIComponent(rawValue));
    } catch {
      cookies.set(name, rawValue);
    }
  }

  return cookies;
}

export function setAuthCookie(res: Response, userId: string): void {
  res.cookie(AUTH_COOKIE_NAME, signAuthToken(userId), {
    ...getBaseCookieOptions(),
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, getBaseCookieOptions());
}

export function getAuthTokenFromRequest(req: Request): string | null {
  return parseCookieHeader(req.headers.cookie).get(AUTH_COOKIE_NAME) ?? null;
}
