import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

const variants: Record<string, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark shadow-lift",
  secondary: "bg-secondary text-white hover:bg-secondary-dark",
  outline: "border border-border bg-white text-ink hover:bg-background",
  ghost: "text-ink hover:bg-black/5",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizes: Record<string, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-4 text-base rounded-xl",
  lg: "h-13 px-6 text-lg rounded-xl",
  xl: "h-16 px-6 text-xl rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
