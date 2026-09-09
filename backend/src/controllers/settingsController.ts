import { Response } from "express";
import { z } from "zod";
import { BusinessSettings } from "../models/BusinessSettings";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";
import { uploadImageIfNeeded, deleteImageIfCloudinary } from "../services/imageService";

const settingsSchema = z.object({
  businessName: z.string().min(1).optional(),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
  currency: z.string().optional(),
  paymentMethods: z
    .array(z.object({ key: z.string(), label: z.string(), enabled: z.boolean() }))
    .optional(),
  allowNegativeStock: z.boolean().optional(),
});

export const getSettings = asyncHandler(async (req: AuthedRequest, res: Response) => {
  let settings = await BusinessSettings.findOne();
  if (!settings) {
    settings = await BusinessSettings.create({});
  }
  ok(res, settings);
});

export const updateSettings = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues.map((i) => i.message).join(", "),
    });
  }

  let settings = await BusinessSettings.findOne();

  const update = { ...parsed.data };
  if (parsed.data.logo !== undefined) {
    const previousLogo = settings?.logo;
    update.logo = await uploadImageIfNeeded(parsed.data.logo, "logo");
    if (previousLogo && update.logo !== previousLogo) {
      await deleteImageIfCloudinary(previousLogo);
    }
  }

  if (!settings) {
    settings = await BusinessSettings.create(update);
  } else {
    Object.assign(settings, update);
    await settings.save();
  }
  ok(res, settings);
});
