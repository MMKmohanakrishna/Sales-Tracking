import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/User";

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Not authenticated");
    }
    const token = header.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new ApiError(500, "Server misconfigured");

    const decoded = jwt.verify(token, secret) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, "User no longer exists");

    req.user = { id: user._id.toString(), email: user.email, role: user.role };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, "Invalid or expired session"));
  }
}
