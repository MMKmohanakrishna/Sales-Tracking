"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function ImageLightbox({
  images,
  startIndex = 0,
  title,
  onClose,
}: {
  images: string[];
  startIndex?: number;
  title?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  if (images.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>

        {title && (
          <p className="absolute top-4 left-4 text-white font-semibold text-sm">{title}</p>
        )}

        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="max-w-full max-h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[index]}
            alt={title || `Photo ${index + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </motion.div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => Math.max(i - 1, 0));
              }}
              disabled={index === 0}
              aria-label="Previous photo"
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => Math.min(i + 1, images.length - 1));
              }}
              disabled={index === images.length - 1}
              aria-label="Next photo"
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <p className="absolute bottom-4 text-white/70 text-sm font-medium">
              {index + 1} / {images.length}
            </p>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
