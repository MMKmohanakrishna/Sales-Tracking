"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const MAX_DIMENSION = 900;

export function CameraCapture({
  open,
  onClose,
  onCapture,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [captured, setCaptured] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      stopStream();
      setCaptured(null);
      setError("");
      return;
    }

    let cancelled = false;
    setError("");

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera not supported in this browser. Please use Upload Photo instead.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setError(
          err?.name === "NotAllowedError"
            ? "Camera access was denied. Please allow camera access, or use Upload Photo instead."
            : "Could not access the camera. Please use Upload Photo instead."
        );
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    setCaptured(canvas.toDataURL("image/jpeg", 0.85));
  }

  function handleUsePhoto() {
    if (!captured) return;
    onCapture(captured);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Take Photo" maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        {error ? (
          <p className="text-sm text-danger font-medium bg-danger/10 rounded-xl px-4 py-3">{error}</p>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center">
            {captured ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={captured} alt="Captured preview" className="h-full w-full object-cover" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            )}
          </div>
        )}

        <div className="flex gap-3">
          {!error && !captured && (
            <Button className="flex-1" onClick={handleCapture} size="lg">
              <Camera className="h-5 w-5" /> Capture
            </Button>
          )}
          {captured && (
            <>
              <Button variant="outline" className="flex-1" onClick={() => setCaptured(null)}>
                <RotateCcw className="h-4 w-4" /> Retake
              </Button>
              <Button className="flex-1" onClick={handleUsePhoto}>
                <Check className="h-4 w-4" /> Use This Photo
              </Button>
            </>
          )}
          {error && (
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <X className="h-4 w-4" /> Close
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
