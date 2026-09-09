import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";
import { ApiError } from "../utils/ApiError";

/**
 * The frontend sends photos as compressed base64 data URIs (see
 * frontend/lib/image.ts). This uploads any such data URI to Cloudinary and
 * returns the resulting hosted URL instead — so MongoDB documents stay
 * small and images get a CDN, resizing, etc.
 *
 * - Already-hosted URLs (http/https) or an empty value pass through unchanged
 *   (e.g. re-saving a frame without changing its photo).
 * - If Cloudinary isn't configured (no API keys set), the original data URI
 *   is stored as-is so the app keeps working in local/dev setups without it.
 */
export async function uploadImageIfNeeded(
  value: string | undefined,
  folder: string
): Promise<string | undefined> {
  if (!value) return value;
  if (!value.startsWith("data:")) return value; // already a URL, nothing to do

  if (!isCloudinaryConfigured()) {
    // No Cloudinary credentials configured — fall back to storing the data
    // URI directly (works, just less efficient). Never silently drop the photo.
    return value;
  }

  try {
    const result = await cloudinary.uploader.upload(value, {
      folder: `divine-frames/${folder}`,
      resource_type: "image",
      overwrite: false,
    });
    return result.secure_url;
  } catch (err) {
    throw new ApiError(502, "Could not upload photo. Please try again.");
  }
}

/**
 * Same as uploadImageIfNeeded, but for a frame's full photo gallery — each
 * entry is uploaded (or passed through) independently, in parallel.
 */
export async function uploadImagesIfNeeded(
  values: string[] | undefined,
  folder: string
): Promise<string[]> {
  if (!values || values.length === 0) return [];
  const uploaded = await Promise.all(values.map((v) => uploadImageIfNeeded(v, folder)));
  return uploaded.filter((v): v is string => !!v);
}

/**
 * Deletes an image from Cloudinary given its hosted URL, if it's a
 * Cloudinary URL under our folder. Best-effort — failures are swallowed so
 * a failed cleanup never blocks the user's actual request.
 */
export async function deleteImageIfCloudinary(url: string | undefined): Promise<void> {
  if (!url || !isCloudinaryConfigured()) return;
  if (!url.includes("res.cloudinary.com")) return;

  try {
    const match = url.match(/\/divine-frames\/[^/.]+\/[^/.]+/);
    if (!match) return;
    const publicId = match[0].replace(/^\//, "");
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Non-fatal — an orphaned image in Cloudinary is not worth failing the request for.
  }
}
