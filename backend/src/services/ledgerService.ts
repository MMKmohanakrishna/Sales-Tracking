import { ClientSession, Types } from "mongoose";
import { Sale } from "../models/Sale";
import { Payment } from "../models/Payment";
import { Customer } from "../models/Customer";

/**
 * Recomputes a customer's totalPurchased / totalPaid / totalPending directly
 * from Sale and Payment documents (the source of truth) rather than trusting
 * incremental updates. Call this after any sale or payment write so the
 * denormalized Customer totals can never drift.
 */
export async function recalcCustomerTotals(
  customerId: Types.ObjectId | string,
  session?: ClientSession
) {
  const [saleAgg] = await Sale.aggregate([
    { $match: { customerId: new Types.ObjectId(customerId), isVoided: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalPurchased: { $sum: "$totalAmount" },
        totalPaid: { $sum: "$paidAmount" },
      },
    },
  ]).session(session ?? null);

  const totalPurchased = saleAgg?.totalPurchased ?? 0;
  const totalPaid = saleAgg?.totalPaid ?? 0;
  const totalPending = Math.max(0, round2(totalPurchased - totalPaid));

  await Customer.findByIdAndUpdate(
    customerId,
    {
      totalPurchased: round2(totalPurchased),
      totalPaid: round2(totalPaid),
      totalPending,
    },
    { session }
  );

  return { totalPurchased: round2(totalPurchased), totalPaid: round2(totalPaid), totalPending };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computePaymentStatus(totalAmount: number, paidAmount: number) {
  if (paidAmount <= 0) return "PENDING" as const;
  if (paidAmount >= totalAmount) return "PAID" as const;
  return "PARTIALLY_PAID" as const;
}
