import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, required, id, onWheel, type, ...props }, ref) => {
    const inputId = id || label?.replace(/\s+/g, "-").toLowerCase();
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            "h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            error && "border-danger focus:ring-danger/30 focus:border-danger",
            className
          )}
          onWheel={
            type === "number"
              ? (e) => {
                  // Prevents the browser's default "scroll to change the
                  // number" behavior — very easy to trigger by accident
                  // while scrolling the page with the cursor over a field.
                  e.currentTarget.blur();
                  onWheel?.(e);
                }
              : onWheel
          }
          {...props}
        />
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && <p className="text-xs text-danger font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s+/g, "-").toLowerCase();
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            "w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none",
            error && "border-danger",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && <p className="text-xs text-danger font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldWrapperProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, required, id, children, ...props }, ref) => {
    const inputId = id || label?.replace(/\s+/g, "-").toLowerCase();
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            error && "border-danger",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && <p className="text-xs text-danger font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
