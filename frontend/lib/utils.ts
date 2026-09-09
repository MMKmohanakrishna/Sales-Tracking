import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a number as Indian Rupees with Indian digit grouping, e.g. ₹1,25,000 */
export function formatMoney(amount: number | undefined | null): string {
  const value = amount || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Compact Indian currency for chart axes, e.g. ₹58K, ₹1.2L — full formatMoney is too wide for tick labels. */
export function formatMoneyCompact(amount: number | undefined | null): string {
  const value = amount || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Formats a date like "08 Sep 2026" in the Asia/Kolkata timezone. */
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

export function statusColor(status: "PENDING" | "PARTIALLY_PAID" | "PAID") {
  switch (status) {
    case "PAID":
      return { bg: "bg-success/10", text: "text-success", dot: "bg-success" };
    case "PARTIALLY_PAID":
      return { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" };
    default:
      return { bg: "bg-danger/10", text: "text-danger", dot: "bg-danger" };
  }
}

export function statusLabel(status: "PENDING" | "PARTIALLY_PAID" | "PAID") {
  switch (status) {
    case "PAID":
      return "Paid";
    case "PARTIALLY_PAID":
      return "Partial";
    default:
      return "Pending";
  }
}
