import { Response } from "express";
import { z } from "zod";
import { Sale } from "../models/Sale";
import { Payment } from "../models/Payment";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ok, okPaginated } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";
import { createSale } from "../services/saleService";

const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  // Optional exact total for this line (e.g. a negotiated lump-sum price
  // entered directly in New Sale). When given, this is charged exactly —
  // it is NOT reconstructed from unitPrice × quantity, which avoids paise
  // of rounding drift when the total doesn't divide evenly by quantity.
  lineTotal: z.coerce.number().min(0).optional(),
});

const newSaleSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  items: z.array(saleItemSchema).min(1, "Add at least one frame"),
  discount: z.coerce.number().min(0).optional(),
  paidAmount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "OTHER"]).default("CASH"),
  notes: z.string().optional(),
  saleDate: z.coerce.date().optional(),
});

export const listSales = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"))));
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "all");
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;

  const query: any = { isVoided: { $ne: true } };
  if (status !== "all") query.paymentStatus = status;
  if (from || to) {
    query.saleDate = {};
    if (from) query.saleDate.$gte = from;
    if (to) query.saleDate.$lte = to;
  }

  let customerIds: string[] | null = null;
  if (search) {
    query.$or = [{ saleNumber: { $regex: search, $options: "i" } }];
  }

  const [items, total] = await Promise.all([
    Sale.find(query)
      .populate("customerId", "name phone")
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Sale.countDocuments(query),
  ]);

  okPaginated(res, items, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const createSaleHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const parsed = newSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }
  const sale = await createSale(parsed.data);
  ok(res, sale, 201);
});

export const getSale = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const sale = await Sale.findById(req.params.id).populate("customerId", "name phone address");
  if (!sale) throw new ApiError(404, "Sale not found");

  const payments = await Payment.find({ saleId: sale._id }).sort({ paymentDate: 1 });

  ok(res, { sale, payments });
});

export const updateSaleNotes = asyncHandler(async (req: AuthedRequest, res: Response) => {
  // Deliberately limited: only notes can be edited on a completed sale to
  // avoid dangerous mutation of financial history (Rule: paid sales should
  // not be casually editable).
  const schema = z.object({ notes: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid input");

  const sale = await Sale.findByIdAndUpdate(
    req.params.id,
    { notes: parsed.data.notes || "" },
    { new: true }
  );
  if (!sale) throw new ApiError(404, "Sale not found");
  ok(res, sale);
});
