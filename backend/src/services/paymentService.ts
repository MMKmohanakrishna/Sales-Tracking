import mongoose from "mongoose";
import { Sale } from "../models/Sale";
import { Payment } from "../models/Payment";
import { Customer } from "../models/Customer";
import { ApiError } from "../utils/ApiError";
import { getNextSequence, formatPaymentNumber } from "../models/Counter";
import { recalcCustomerTotals, round2, computePaymentStatus } from "./ledgerService";

export interface RecordPaymentInput {
  customerId: string;
  saleId?: string; // if provided, applies to this specific sale
  amount: number;
  paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";
  notes?: string;
  paymentDate?: Date;
}

/**
 * Records a payment against a customer. If `saleId` is given the payment is
 * applied to that specific sale's pending balance. If not, it is applied
 * across the customer's outstanding sales oldest-first (FIFO allocation) so
 * we never silently create an ambiguous/incorrect allocation.
 */
export async function recordPayment(input: RecordPaymentInput) {
  const amount = round2(input.amount);
  if (!amount || amount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than zero");
  }

  const customer = await Customer.findById(input.customerId);
  if (!customer) throw new ApiError(404, "Customer not found");

  if (input.saleId) {
    const sale = await Sale.findOne({ _id: input.saleId, customerId: customer._id });
    if (!sale) throw new ApiError(404, "Sale not found for this customer");
    if (sale.isVoided) throw new ApiError(400, "Cannot record payment against a voided sale");

    if (amount > round2(sale.pendingAmount)) {
      throw new ApiError(
        400,
        `Payment (₹${amount}) exceeds this sale's pending balance (₹${sale.pendingAmount})`
      );
    }

    sale.paidAmount = round2(sale.paidAmount + amount);
    sale.pendingAmount = round2(sale.totalAmount - sale.paidAmount);
    sale.paymentStatus = computePaymentStatus(sale.totalAmount, sale.paidAmount);
    await sale.save();

    const seq = await getNextSequence("paymentNumber");
    const payment = await Payment.create({
      paymentNumber: formatPaymentNumber(seq),
      customerId: customer._id,
      saleId: sale._id,
      amount,
      paymentMethod: input.paymentMethod || "CASH",
      paymentDate: input.paymentDate || new Date(),
      notes: input.notes || "",
    });

    await recalcCustomerTotals(customer._id);
    return payment;
  }

  // No specific sale chosen: allocate FIFO across outstanding sales.
  const outstandingSales = await Sale.find({
    customerId: customer._id,
    isVoided: { $ne: true },
    pendingAmount: { $gt: 0 },
  }).sort({ saleDate: 1 });

  const totalOutstanding = round2(
    outstandingSales.reduce((sum, s) => sum + s.pendingAmount, 0)
  );

  if (amount > totalOutstanding) {
    throw new ApiError(
      400,
      `Payment (₹${amount}) exceeds this customer's total outstanding balance (₹${totalOutstanding})`
    );
  }

  let remaining = amount;
  const seq = await getNextSequence("paymentNumber");
  const paymentNumber = formatPaymentNumber(seq);
  let firstSaleId: mongoose.Types.ObjectId | undefined;

  for (const sale of outstandingSales) {
    if (remaining <= 0) break;
    const applyAmount = Math.min(remaining, sale.pendingAmount);
    sale.paidAmount = round2(sale.paidAmount + applyAmount);
    sale.pendingAmount = round2(sale.totalAmount - sale.paidAmount);
    sale.paymentStatus = computePaymentStatus(sale.totalAmount, sale.paidAmount);
    await sale.save();
    remaining = round2(remaining - applyAmount);
    if (!firstSaleId) firstSaleId = sale._id;
  }

  const payment = await Payment.create({
    paymentNumber,
    customerId: customer._id,
    saleId: firstSaleId,
    amount,
    paymentMethod: input.paymentMethod || "CASH",
    paymentDate: input.paymentDate || new Date(),
    notes: input.notes || "",
  });

  await recalcCustomerTotals(customer._id);
  return payment;
}
