import { Response } from "express";
import { z } from "zod";
import { Customer } from "../models/Customer";
import { Sale } from "../models/Sale";
import { Payment } from "../models/Payment";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ok, okPaginated } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";
import { deleteCustomerCascade } from "../services/customerService";

const indianPhoneRegex = /^[6-9]\d{9}$/;

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required").trim(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || indianPhoneRegex.test(v), {
      message: "Enter a valid 10-digit Indian phone number",
    }),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const listCustomers = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"))));
  const search = String(req.query.search || "").trim();
  const filter = String(req.query.filter || "all");

  const query: any = { isActive: true };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }
  if (filter === "pending") query.totalPending = { $gt: 0 };
  if (filter === "paid") query.totalPending = { $lte: 0 };

  const [items, total] = await Promise.all([
    Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Customer.countDocuments(query),
  ]);

  okPaginated(res, items, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const createCustomer = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }
  const customer = await Customer.create(parsed.data);
  ok(res, customer, 201);
});

export const getCustomer = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, "Customer not found");
  ok(res, customer);
});

export const updateCustomer = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const parsed = customerSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }
  const customer = await Customer.findByIdAndUpdate(req.params.id, parsed.data, {
    new: true,
    runValidators: true,
  });
  if (!customer) throw new ApiError(404, "Customer not found");
  ok(res, customer);
});

export const deleteCustomer = asyncHandler(async (req: AuthedRequest, res: Response) => {
  // Permanently deletes the customer AND all of their sales/payments.
  // Irreversible by design — the frontend confirms this explicitly before calling it.
  await deleteCustomerCascade(req.params.id);
  ok(res, { message: "Customer and all their sales/payments deleted permanently" });
});

export const getCustomerLedger = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, "Customer not found");

  const [sales, payments] = await Promise.all([
    Sale.find({ customerId: customer._id }).sort({ saleDate: 1 }),
    Payment.find({ customerId: customer._id }).sort({ paymentDate: 1 }),
  ]);

  type LedgerEntry = {
    date: Date;
    type: "PURCHASE" | "PAYMENT";
    description: string;
    amount: number;
    reference: string;
  };

  const entries: LedgerEntry[] = [];
  for (const s of sales) {
    if (s.isVoided) continue;
    entries.push({
      date: s.saleDate,
      type: "PURCHASE",
      description: s.items.map((i) => `${i.frameName} × ${i.quantity}`).join(", "),
      amount: s.totalAmount,
      reference: s.saleNumber,
    });
  }
  for (const p of payments) {
    entries.push({
      date: p.paymentDate,
      type: "PAYMENT",
      description: `Payment received (${p.paymentMethod})`,
      amount: p.amount,
      reference: p.paymentNumber,
    });
  }

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = 0;
  const ledger = entries.map((e) => {
    runningBalance += e.type === "PURCHASE" ? e.amount : -e.amount;
    return { ...e, balance: Math.round(runningBalance * 100) / 100 };
  });

  ok(res, {
    customer,
    ledger,
    currentBalance: customer.totalPending,
  });
});

export const getCustomerSales = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const sales = await Sale.find({ customerId: req.params.id }).sort({ saleDate: -1 });
  ok(res, sales);
});

export const getCustomerPayments = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const payments = await Payment.find({ customerId: req.params.id }).sort({ paymentDate: -1 });
  ok(res, payments);
});
