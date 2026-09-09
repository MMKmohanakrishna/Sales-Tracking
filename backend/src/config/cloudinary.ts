import { v2 as cloudinary } from "cloudinary";

let configured = false;

/**
 * Configures the Cloudinary SDK from environment variables. Safe to call
 * repeatedly — only configures once. Returns whether Cloudinary is usable
 * (all three env vars present) so callers can fall back gracefully.
 */
export function isCloudinaryConfigured(): boolean {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return false;
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return true;
}

export { cloudinary };
