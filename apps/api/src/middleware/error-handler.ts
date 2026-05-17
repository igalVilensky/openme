import type { ErrorRequestHandler } from "express";

import { env } from "../config/env";
import { HttpError } from "../errors/http-error";

type ErrorResponse = {
  error: {
    message: string;
    statusCode: number;
    stack?: string;
  };
};

type HttpLikeError = Error & {
  status?: unknown;
  statusCode?: unknown;
  expose?: unknown;
  type?: unknown;
};

function isHttpLikeError(error: unknown): error is HttpLikeError {
  return typeof error === "object" && error !== null;
}

function getHttpLikeStatusCode(error: HttpLikeError): number | null {
  const statusCode = error.statusCode ?? error.status;

  return typeof statusCode === "number" && statusCode >= 400 && statusCode < 600
    ? statusCode
    : null;
}

function getStatusCode(error: unknown): number {
  if (error instanceof HttpError) {
    return error.statusCode;
  }

  return isHttpLikeError(error) ? (getHttpLikeStatusCode(error) ?? 500) : 500;
}

function getErrorMessage(error: unknown, statusCode: number): string {
  if (error instanceof HttpError) {
    return error.expose ? error.message : "Internal server error";
  }

  if (statusCode === 413) {
    return "Request body is too large";
  }

  if (
    isHttpLikeError(error) &&
    error.expose === true &&
    error instanceof Error
  ) {
    return error.message;
  }

  return "Internal server error";
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = getStatusCode(error);
  const message = getErrorMessage(error, statusCode);

  if (statusCode >= 500) {
    console.error(error);
  }

  const response: ErrorResponse = {
    error: {
      message,
      statusCode
    }
  };

  if (env.nodeEnv !== "production" && error instanceof Error) {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
};
