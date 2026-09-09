import { Response } from "express";
import { z } from "zod";
import { Product } from "../models/Product";
import { Sale } from "../models/Sale";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ok, okPaginated } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";
import { uploadImagesIfNeeded, deleteImageIfCloudinary } from "../services/imageService";

const productSchema = z.object({
  godName: z.string().min(1, "God name is required").trim(),
  // Optional — defaults to godName when left blank (see createProduct/updateProduct).
  frameName: z.string().trim().optional(),
  size: z.string().trim().optional(),
  sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative"),
  images: z.array(z.string()).optional(),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  isQuickEntry: z.boolean().optional(),
});

export const listProducts = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "50"))));
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "all"); // all | active | inactive
  const includeQuickEntries = String(req.query.includeQuickEntries || "") === "true";

  const query: any = {};
  if (search) {
    query.$or = [
      { godName: { $regex: search, $options: "i" } },
      { frameName: { $regex: search, $options: "i" } },
    ];
  }
  if (status === "active") query.isActive = true;
  if (status === "inactive") query.isActive = false;
  // Frames added inline from New Sale stay out of the main Photo Frames
  // catalog view unless explicitly requested (New Sale's own frame search).
  if (!includeQuickEntries) query.isQuickEntry = { $ne: true };

  const [items, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  okPaginated(res, items, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const createProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }
  const images = await uploadImagesIfNeeded(parsed.data.images, "frames");
  const frameName = parsed.data.frameName?.trim() || parsed.data.godName;
  const product = await Product.create({ ...parsed.data, images, frameName });
  ok(res, product, 201);
});

export const getProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Frame not found");
  ok(res, product);
});

export const updateProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }

  const existing = await Product.findById(req.params.id);
  if (!existing) throw new ApiError(404, "Frame not found");

  const update = { ...parsed.data };
  if ("frameName" in parsed.data && !parsed.data.frameName?.trim()) {
    update.frameName = (parsed.data.godName ?? existing.godName).trim();
  }
  if (parsed.data.images !== undefined) {
    update.images = await uploadImagesIfNeeded(parsed.data.images, "frames");
    // Clean up any photos that were removed from the gallery.
    const removed = (existing.images || []).filter((url) => !update.images!.includes(url));
    await Promise.all(removed.map((url) => deleteImageIfCloudinary(url)));
  }

  const product = await Product.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, "Frame not found");
  ok(res, product);
});

export const deleteProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const hasSales = await Sale.exists({ "items.productId": req.params.id });
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Frame not found");

  if (hasSales) {
    product.isActive = false;
    await product.save();
    return ok(res, { message: "Frame marked inactive (sales history preserved)" });
  }

  await Promise.all((product.images || []).map((url) => deleteImageIfCloudinary(url)));
  await product.deleteOne();
  ok(res, { message: "Frame deleted" });
});
