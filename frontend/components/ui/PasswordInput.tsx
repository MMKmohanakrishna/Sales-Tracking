"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

/** Same look as <Input>, but with a show/hide eye toggle for password fields. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, required, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id || label?.replace(/\s+/g, "-").toLowerCase();

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "h-12 w-full rounded-xl border border-border bg-white pl-4 pr-12 text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              error && "border-danger focus:ring-danger/30 focus:border-danger",
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted hover:text-ink"
          >
            {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && <p className="text-xs text-danger font-medium">{error}</p>}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
