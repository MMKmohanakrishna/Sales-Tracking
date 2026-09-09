import { Response } from "express";
import { Customer } from "../models/Customer";
import { Sale } from "../models/Sale";
import { Payment } from "../models/Payment";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";

function toCSV(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
}

function sendCSV(res: Response, filename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

export const exportCustomersCSV = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const customers = await Customer.find({ isActive: true }).sort({ name: 1 });
  const rows = [
    ["Name", "Phone", "Address", "Total Purchased", "Total Paid", "Pending"],
    ...customers.map((c) => [
      c.name,
      c.phone || "",
      c.address || "",
      String(c.totalPurchased),
      String(c.totalPaid),
      String(c.totalPending),
    ]),
  ];
  sendCSV(res, "customers.csv", toCSV(rows));
});

export const exportSalesCSV = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const sales = await Sale.find({ isVoided: { $ne: true } })
    .populate("customerId", "name")
    .sort({ saleDate: -1 });
  const rows = [
    ["Sale Number", "Date", "Customer", "Total", "Paid", "Pending", "Status"],
    ...sales.map((s) => [
      s.saleNumber,
      new Date(s.saleDate).toISOString().slice(0, 10),
      (s.customerId as any)?.name || "",
      String(s.totalAmount),
      String(s.paidAmount),
      String(s.pendingAmount),
      s.paymentStatus,
    ]),
  ];
  sendCSV(res, "sales.csv", toCSV(rows));
});

export const exportPaymentsCSV = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const payments = await Payment.find()
    .populate("customerId", "name")
    .populate("saleId", "saleNumber")
    .sort({ paymentDate: -1 });
  const rows = [
    ["Payment Number", "Date", "Customer", "Amount", "Method", "Sale"],
    ...payments.map((p) => [
      p.paymentNumber,
      new Date(p.paymentDate).toISOString().slice(0, 10),
      (p.customerId as any)?.name || "",
      String(p.amount),
      p.paymentMethod,
      (p.saleId as any)?.saleNumber || "",
    ]),
  ];
  sendCSV(res, "payments.csv", toCSV(rows));
});
