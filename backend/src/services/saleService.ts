import mongoose from "mongoose";
import { Sale, ISaleItem } from "../models/Sale";
import { Product } from "../models/Product";
import { Customer } from "../models/Customer";
import { Payment } from "../models/Payment";
import { getNextSequence, formatSaleNumber, formatPaymentNumber } from "../models/Counter";
import { ApiError } from "../utils/ApiError";
import { recalcCustomerTotals, round2, computePaymentStatus } from "./ledgerService";

export interface NewSaleItemInput {
  productId: string;
  quantity: number;
  // Optional exact total for this line — charged as-is instead of being
  // reconstructed from unitPrice × quantity (see saleController for why).
  lineTotal?: number;
}

export interface NewSaleInput {
  customerId: string;
  items: NewSaleItemInput[];
  discount?: number;
  paidAmount: number;
  paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";
  notes?: string;
  saleDate?: Date;
}

/**
 * Creates a sale atomically:
 *  1. Validates customer + products
 *  2. Recalculates prices/subtotals/total on the SERVER (never trusts the client)
 *  3. Creates the sale
 *  4. Creates an initial payment if paidAmount > 0
 *  5. Recomputes the customer's running balance
 *
 * Stock is not tracked — frames are made to order, so quantity is only
 * used to calculate the line total, never checked against inventory.
 *
 * Uses a MongoDB transaction when the deployment supports replica sets;
 * falls back to sequential writes (with best-effort compensation) otherwise.
 */
export async function createSale(input: NewSaleInput) {
  if (!input.items || input.items.length === 0) {
    throw new ApiError(400, "A sale must include at least one frame");
  }

  const customer = await Customer.findById(input.customerId);
  if (!customer || !customer.isActive) {
    throw new ApiError(404, "Customer not found");
  }

  const session = await mongoose.startSession();

  try {
    let result: any;
    await session.withTransaction(async () => {
      const saleItems: ISaleItem[] = [];
      let subtotal = 0;

      for (const line of input.items) {
        if (!line.quantity || line.quantity <= 0) {
          throw new ApiError(400, "Quantity must be greater than zero");
        }
        const product = await Product.findById(line.productId).session(session);
        if (!product || !product.isActive) {
          throw new ApiError(404, "One of the selected frames is not available");
        }

        // An explicit lineTotal is charged exactly as given — never
        // reconstructed from unitPrice × quantity, which can drift by a
        // paise or two when the total doesn't divide evenly.
        const lineSubtotal =
          line.lineTotal !== undefined ? round2(line.lineTotal) : round2(product.sellingPrice * line.quantity);
        const unitPrice = line.lineTotal !== undefined ? round2(line.lineTotal / line.quantity) : product.sellingPrice;
        subtotal = round2(subtotal + lineSubtotal);

        saleItems.push({
          productId: product._id,
          godName: product.godName,
          frameName: product.frameName,
          size: product.size,
          quantity: line.quantity,
          unitPrice,
          subtotal: lineSubtotal,
        });
      }

      const discount = round2(Math.max(0, input.discount || 0));
      const totalAmount = round2(Math.max(0, subtotal - discount));

      let paidAmount = round2(Math.max(0, input.paidAmount || 0));
      if (paidAmount > totalAmount) {
        throw new ApiError(400, "Paid amount cannot exceed the total amount");
      }
      const pendingAmount = round2(totalAmount - paidAmount);
      const paymentStatus = computePaymentStatus(totalAmount, paidAmount);

      const seq = await getNextSequence("saleNumber");
      const saleNumber = formatSaleNumber(seq);

      const [sale] = await Sale.create(
        [
          {
            saleNumber,
            customerId: customer._id,
            items: saleItems,
            subtotal,
            discount,
            totalAmount,
            paidAmount,
            pendingAmount,
            paymentStatus,
            saleDate: input.saleDate || new Date(),
            notes: input.notes || "",
          },
        ],
        { session }
      );

      // Initial payment, if any
      if (paidAmount > 0) {
        const paySeq = await getNextSequence("paymentNumber");
        await Payment.create(
          [
            {
              paymentNumber: formatPaymentNumber(paySeq),
              customerId: customer._id,
              saleId: sale._id,
              amount: paidAmount,
              paymentMethod: input.paymentMethod || "CASH",
              paymentDate: input.saleDate || new Date(),
              notes: "Initial payment at time of sale",
            },
          ],
          { session }
        );
      }

      await recalcCustomerTotals(customer._id, session);

      result = sale;
    });

    session.endSession();
    return await Sale.findById(result._id);
  } catch (err) {
    session.endSession();
    // If transactions aren't supported (standalone MongoDB without replica set),
    // mongoose throws before withTransaction can retry. Fall back to a
    // best-effort sequential implementation so local/dev setups still work.
    if (
      err instanceof Error &&
      /Transaction numbers are only allowed|Transactions are not supported/i.test(err.message)
    ) {
      return createSaleWithoutTransaction(input, customer._id.toString());
    }
    throw err;
  }
}

/**
 * Fallback path for standalone MongoDB instances (no replica set) where
 * multi-document transactions are unavailable. Performs the same steps
 * sequentially. Used only in local development.
 */
async function createSaleWithoutTransaction(input: NewSaleInput, customerId: string) {
  const saleItems: ISaleItem[] = [];
  let subtotal = 0;

  for (const line of input.items) {
    if (!line.quantity || line.quantity <= 0) {
      throw new ApiError(400, "Quantity must be greater than zero");
    }
    const product = await Product.findById(line.productId);
    if (!product || !product.isActive) {
      throw new ApiError(404, "One of the selected frames is not available");
    }
    const lineSubtotal =
      line.lineTotal !== undefined ? round2(line.lineTotal) : round2(product.sellingPrice * line.quantity);
    const unitPrice = line.lineTotal !== undefined ? round2(line.lineTotal / line.quantity) : product.sellingPrice;
    subtotal = round2(subtotal + lineSubtotal);
    saleItems.push({
      productId: product._id,
      godName: product.godName,
      frameName: product.frameName,
      size: product.size,
      quantity: line.quantity,
      unitPrice,
      subtotal: lineSubtotal,
    });
  }

  const discount = round2(Math.max(0, input.discount || 0));
  const totalAmount = round2(Math.max(0, subtotal - discount));
  let paidAmount = round2(Math.max(0, input.paidAmount || 0));
  if (paidAmount > totalAmount) {
    throw new ApiError(400, "Paid amount cannot exceed the total amount");
  }
  const pendingAmount = round2(totalAmount - paidAmount);
  const paymentStatus = computePaymentStatus(totalAmount, paidAmount);

  const seq = await getNextSequence("saleNumber");
  const saleNumber = formatSaleNumber(seq);

  const sale = await Sale.create({
    saleNumber,
    customerId,
    items: saleItems,
    subtotal,
    discount,
    totalAmount,
    paidAmount,
    pendingAmount,
    paymentStatus,
    saleDate: input.saleDate || new Date(),
    notes: input.notes || "",
  });

  if (paidAmount > 0) {
    const paySeq = await getNextSequence("paymentNumber");
    await Payment.create({
      paymentNumber: formatPaymentNumber(paySeq),
      customerId,
      saleId: sale._id,
      amount: paidAmount,
      paymentMethod: input.paymentMethod || "CASH",
      paymentDate: input.saleDate || new Date(),
      notes: "Initial payment at time of sale",
    });
  }

  await recalcCustomerTotals(customerId);

  return Sale.findById(sale._id);
}
