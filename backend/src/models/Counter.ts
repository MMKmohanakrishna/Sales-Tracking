import { Schema, model, Document } from "mongoose";

/**
 * Generic atomic counter used to generate human-friendly sequential
 * numbers such as DF-000001 (sales) and PAY-000001 (payments).
 */
export interface ICounter extends Omit<Document, "_id"> {
  _id: string; // counter key, e.g. "saleNumber"
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = model<ICounter>("Counter", counterSchema);

export async function getNextSequence(key: string): Promise<number> {
  const result = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result!.seq;
}

export function formatSaleNumber(seq: number): string {
  return `DF-${String(seq).padStart(6, "0")}`;
}

export function formatPaymentNumber(seq: number): string {
  return `PAY-${String(seq).padStart(6, "0")}`;
}
