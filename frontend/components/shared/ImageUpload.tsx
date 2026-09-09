"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2, Camera, Plus } from "lucide-react";
import { fileToCompressedDataUrl } from "@/lib/image";
import { CameraCapture } from "./CameraCapture";
import { cn } from "@/lib/utils";

/** A gallery of photos for one frame — take/upload as many as you like. */
export function ImageUpload({
  value,
  onChange,
  label = "Photos",
}: {
  value: string[];
  onChange: (images: string[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      setError("Please choose image files");
      return;
    }
    setLoading(true);
    try {
      const dataUrls = await Promise.all(validFiles.map((f) => fileToCompressedDataUrl(f)));
      onChange([...value, ...dataUrls]);
    } catch (err: any) {
      setError(err.message || "Could not process image");
    } finally {
      setLoading(false);
    }
  }

  function handleCapture(dataUrl: string) {
    onChange([...value, dataUrl]);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink">{label}</label>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {value.map((img, i) => (
          <div
            key={i}
            className="h-24 w-24 rounded-xl border border-border bg-background overflow-hidden shrink-0 relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={`Frame photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded">
                Cover
              </span>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={cn(
            "h-24 w-24 rounded-xl border-2 border-dashed border-primary/40 shrink-0 flex flex-col items-center justify-center gap-1 text-primary hover:bg-primary/5",
            loading && "opacity-50"
          )}
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
          <span className="text-[11px] font-semibold">{loading ? "Adding..." : "Add Photo"}</span>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCameraOpen(true)}
          className="px-3 py-2 rounded-xl border border-border bg-white text-sm font-semibold hover:bg-black/5 flex items-center gap-1.5"
        >
          <Camera className="h-4 w-4" /> Take Photo
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-3 py-2 rounded-xl border border-border bg-white text-sm font-semibold hover:bg-black/5 flex items-center gap-1.5"
        >
          <ImagePlus className="h-4 w-4" /> Upload
        </button>
      </div>
      <p className="text-xs text-muted">JPG or PNG. Add as many as you like — the first is the cover photo.</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = ""; // allow re-selecting the same file(s) later
        }}
      />

      {error && <p className="text-xs text-danger font-medium">{error}</p>}

      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleCapture} />
    </div>
  );
}
