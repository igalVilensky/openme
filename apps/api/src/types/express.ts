import type { AuthSessionSummary } from "../modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthSessionSummary;
    }
  }
}

export {};
