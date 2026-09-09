import { Response } from "express";

export function ok(res: Response, data: unknown, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function okPaginated(
  res: Response,
  items: unknown[],
  pagination: { page: number; limit: number; total: number; totalPages: number }
) {
  return res.status(200).json({ success: true, data: items, pagination });
}

export function fail(res: Response, statusCode: number, message: string) {
  return res.status(statusCode).json({ success: false, message });
}
