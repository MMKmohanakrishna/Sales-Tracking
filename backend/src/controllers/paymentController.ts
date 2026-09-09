import { Response } from "express";
import { z } from "zod";
import { Payment } from "../models/Payment";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ok, okPaginated } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";
import { recordPayment } from "../services/paymentService";

const newPaymentSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  saleId: z.string().optional(),
  amount: z.coerce.number().positive("Payment amount must be greater than zero"),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "OTHER"]).default("CASH"),
  notes: z.string().optional(),
  paymentDate: z.coerce.date().optional(),
});

export const listPayments = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"))));
  const method = String(req.query.method || "all");
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;

  const query: any = {};
  if (method !== "all") query.paymentMethod = method;
  if (from || to) {
    query.paymentDate = {};
    if (from) query.paymentDate.$gte = from;
    if (to) query.paymentDate.$lte = to;
  }

  const [items, total] = await Promise.all([
    Payment.find(query)
      .populate("customerId", "name phone")
      .populate("saleId", "saleNumber")
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  okPaginated(res, items, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const createPayment = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const parsed = newPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }
  const payment = await recordPayment(parsed.data);
  ok(res, payment, 201);
});

export const getPayment = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const payment = await Payment.findById(req.params.id)
    .populate("customerId", "name phone")
    .populate("saleId", "saleNumber totalAmount");
  if (!payment) throw new ApiError(404, "Payment not found");
  ok(res, payment);
});
