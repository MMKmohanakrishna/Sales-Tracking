import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

/**
 * Validates req.body against a Zod schema. On success, replaces req.body
 * with the parsed (and coerced/defaulted) value.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return next(new ApiError(400, message));
    }
    req.body = result.data;
    next();
  };
}
