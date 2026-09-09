import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  godName: string;
  frameName: string;
  size?: string;
  sellingPrice: number;
  costPrice: number;
  images: string[];
  description?: string;
  isActive: boolean;
  // True for frames created inline from the New Sale form (a one-off entry
  // for that sale) rather than from the Photo Frames catalog page. Kept in
  // the database so the sale/inventory records stay valid, but excluded
  // from the Photo Frames screen by default — it's still searchable/reusable
  // from within New Sale itself.
  isQuickEntry: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    godName: { type: String, required: true, trim: true },
    // Optional — falls back to godName when left blank (see productController).
    frameName: { type: String, trim: true, default: "" },
    size: { type: String, trim: true, default: "" },
    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isQuickEntry: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ godName: 1 });
productSchema.index({ frameName: 1 });
productSchema.index({ isActive: 1 });

export const Product = model<IProduct>("Product", productSchema);
