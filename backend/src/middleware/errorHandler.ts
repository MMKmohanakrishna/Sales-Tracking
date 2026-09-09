import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let statusCode = 500;
  let message = "Something went wrong. Please try again.";

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err?.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((e: any) => e.message)
      .join(", ") || "Validation failed";
  } else if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with this ${field} already exists`;
  } else if (err?.name === "CastError") {
    statusCode = 400;
    message = "Invalid identifier supplied";
  } else if (err?.message) {
    // Keep generic messages for unexpected errors in production
    message = process.env.NODE_ENV === "production" ? message : err.message;
  }

  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ success: false, message });
}
