import type { ErrorRequestHandler } from "express";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (!error) return next();
  const status = error instanceof ApiError ? error.status : 500;
  const message = error instanceof Error ? error.message : "an error occurred";
  res.status(status).json({ error: message });
};
