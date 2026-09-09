import { Schema, model, Document, Types } from "mongoose";

export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";

export interface IPayment extends Document {
  _id: Types.ObjectId;
  paymentNumber: string;
  customerId: Types.ObjectId;
  saleId?: Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  notes?: string;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    paymentNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    saleId: { type: Schema.Types.ObjectId, ref: "Sale" },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "BANK_TRANSFER", "OTHER"],
      required: true,
      default: "CASH",
    },
    paymentDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

paymentSchema.index({ customerId: 1 });
paymentSchema.index({ saleId: 1 });
paymentSchema.index({ paymentDate: -1 });

export const Payment = model<IPayment>("Payment", paymentSchema);
