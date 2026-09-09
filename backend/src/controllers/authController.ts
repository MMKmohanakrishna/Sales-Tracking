import { Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ok } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

function signToken(userId: string) {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: userId }, secret, { expiresIn } as jwt.SignOptions);
}

export const login = asyncHandler(async (req, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) throw new ApiError(401, "Invalid email or password");

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new ApiError(401, "Invalid email or password");

  const token = signToken(user._id.toString());
  ok(res, {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(404, "User not found");
  ok(res, { id: user._id, name: user.name, email: user.email, role: user.role });
});

export const changePassword = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await User.findById(req.user!.id).select("+passwordHash");
  if (!user) throw new ApiError(404, "User not found");

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new ApiError(401, "Current password is incorrect");

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  ok(res, { message: "Password updated successfully" });
});
