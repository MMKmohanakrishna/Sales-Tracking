import { Schema, model, Document, Types } from "mongoose";

export type PaymentStatus = "PENDING" | "PARTIALLY_PAID" | "PAID";

export interface ISaleItem {
  productId: Types.ObjectId;
  godName: string;
  frameName: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ISale extends Document {
  _id: Types.ObjectId;
  saleNumber: string;
  customerId: Types.ObjectId;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  saleDate: Date;
  notes?: string;
  isVoided: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    // Snapshot fields so historical sales stay accurate even if the
    // product's name/price changes later.
    godName: { type: String, required: true },
    frameName: { type: String, required: true },
    size: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const saleSchema = new Schema<ISale>(
  {
    saleNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    items: { type: [saleItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    pendingAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PARTIALLY_PAID", "PAID"],
      required: true,
      default: "PENDING",
    },
    saleDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, default: "" },
    isVoided: { type: Boolean, default: false },
  },
  { timestamps: true }
);

saleSchema.index({ customerId: 1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ paymentStatus: 1 });

export const Sale = model<ISale>("Sale", saleSchema);
