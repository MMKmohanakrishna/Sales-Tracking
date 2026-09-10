import { Schema, model, Document, Types } from "mongoose";

export interface ICustomer extends Document {
  _id: Types.ObjectId;
  name: string;
  phone?: string;
  address?: string;
  mapLink?: string;
  notes?: string;
  totalPurchased: number;
  totalPaid: number;
  totalPending: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    // A pasted Google Maps (or any map) link — optional, so the owner can
    // find a customer's location later without having to remember it.
    mapLink: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    // Denormalized totals for fast reads. These are NEVER incremented blindly —
    // they are recomputed from Sale/Payment documents (the source of truth)
    // by services/ledgerService.ts every time a sale or payment is written.
    totalPurchased: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

customerSchema.index({ name: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ totalPending: -1 });

export const Customer = model<ICustomer>("Customer", customerSchema);
