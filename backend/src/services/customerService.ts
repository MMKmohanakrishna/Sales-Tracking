import mongoose, { Types } from "mongoose";
import { Customer } from "../models/Customer";
import { Sale } from "../models/Sale";
import { Payment } from "../models/Payment";
import { ApiError } from "../utils/ApiError";

/**
 * Permanently deletes a customer AND every sale/payment record linked to
 * them.
 *
 * This is a deliberate, irreversible action (by explicit product decision —
 * this app normally preserves financial history). Once deleted:
 *  - The customer's revenue no longer counts toward any report/total.
 *  - Nothing here can be recovered.
 */
export async function deleteCustomerCascade(customerId: string) {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(404, "Customer not found");

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await cascadeDelete(customer._id, session);
    });
    session.endSession();
  } catch (err) {
    session.endSession();
    if (
      err instanceof Error &&
      /Transaction numbers are only allowed|Transactions are not supported/i.test(err.message)
    ) {
      // Standalone MongoDB (no replica set) — fall back to sequential writes.
      await cascadeDelete(customer._id, undefined);
      return;
    }
    throw err;
  }
}

async function cascadeDelete(customerId: Types.ObjectId, session?: mongoose.ClientSession) {
  await Payment.deleteMany({ customerId }).session(session ?? null);
  await Sale.deleteMany({ customerId }).session(session ?? null);
  await Customer.deleteOne({ _id: customerId }).session(session ?? null);
}
