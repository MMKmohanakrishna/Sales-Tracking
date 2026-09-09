import { Schema, model, Document } from "mongoose";

export interface IBusinessSettings extends Document {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  logo: string;
  currency: string;
  paymentMethods: { key: string; label: string; enabled: boolean }[];
  allowNegativeStock: boolean;
  updatedAt: Date;
}

const businessSettingsSchema = new Schema<IBusinessSettings>(
  {
    businessName: { type: String, default: "Divine Frames" },
    ownerName: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    logo: { type: String, default: "" },
    currency: { type: String, default: "INR" },
    paymentMethods: {
      type: [
        {
          key: String,
          label: String,
          enabled: Boolean,
          _id: false,
        },
      ],
      default: [
        { key: "CASH", label: "Cash", enabled: true },
        { key: "UPI", label: "UPI", enabled: true },
        { key: "BANK_TRANSFER", label: "Bank Transfer", enabled: true },
        { key: "OTHER", label: "Other", enabled: true },
      ],
    },
    allowNegativeStock: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const BusinessSettings = model<IBusinessSettings>(
  "BusinessSettings",
  businessSettingsSchema
);
