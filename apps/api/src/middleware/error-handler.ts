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

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const shouldExpose = error instanceof HttpError ? error.expose : false;
  const message =
    shouldExpose && error instanceof Error ? error.message : "Internal server error";

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
