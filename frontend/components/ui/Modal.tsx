"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={`relative w-full ${maxWidth} bg-card rounded-t-2xl sm:rounded-2xl shadow-lift max-h-[90vh] overflow-y-auto`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="sticky top-0 bg-card flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-ink">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
