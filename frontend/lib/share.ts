import { formatDate, formatMoney } from "./utils";
import type { Customer } from "@/types";

/** Builds a plain-text statement for a customer — what they bought, paid,
 * and still owe — suitable for the native share sheet or clipboard. */
export function buildCustomerStatement(
  businessName: string,
  customer: Customer,
  sales: any[] | undefined
): string {
  const lines: string[] = [];
  lines.push(businessName);
  lines.push("");
  lines.push(customer.name);
  if (customer.phone) lines.push(customer.phone);
  lines.push("");
  lines.push(`Total Purchased: ${formatMoney(customer.totalPurchased)}`);
  lines.push(`Total Paid: ${formatMoney(customer.totalPaid)}`);
  lines.push(`Balance Due: ${formatMoney(customer.totalPending)}`);

  if (sales && sales.length > 0) {
    lines.push("");
    lines.push("Purchase History:");
    for (const s of sales) {
      const items = s.items.map((i: any) => `${i.frameName} x${i.quantity}`).join(", ");
      const status =
        s.paymentStatus === "PAID" ? "Paid" : s.paymentStatus === "PARTIALLY_PAID" ? "Partial" : "Pending";
      lines.push(`• ${formatDate(s.saleDate)} — ${items} — ${formatMoney(s.totalAmount)} (${status})`);
    }
  }

  lines.push("");
  lines.push("Thank you for your business!");

  return lines.join("\n");
}

/**
 * Shares text via the device's native share sheet (WhatsApp, SMS, email —
 * whatever the user has installed). Falls back to copying to the clipboard
 * when the Web Share API isn't available (most desktop browsers).
 * Returns which path was taken, or "cancelled" if the user backed out.
 */
export async function shareOrCopy(
  title: string,
  text: string
): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (err: any) {
      if (err?.name === "AbortError") return "cancelled";
      // Some browsers advertise navigator.share but reject certain payloads —
      // fall through to clipboard rather than surfacing a dead end.
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

/**
 * Renders a DOM element (e.g. CustomerStatementCard) to a PNG image and
 * shares it via the native share sheet as a file — so WhatsApp/etc. show an
 * actual branded receipt image, not plain text. Falls back to downloading
 * the image, then to plain-text share, if image sharing isn't supported.
 */
export async function shareElementAsImage(
  element: HTMLElement,
  filename: string,
  title: string,
  fallbackText: string
): Promise<"shared" | "downloaded" | "copied" | "cancelled" | "failed"> {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(element, { backgroundColor: "#ffffff", scale: 2 });
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not render image");

    const file = new File([blob], filename, { type: "image/png" });

    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({ title, files: [file] });
        return "shared";
      } catch (err: any) {
        if (err?.name === "AbortError") return "cancelled";
        // Fall through to download below.
      }
    }

    // No file-sharing support (most desktop browsers) — download the image
    // so it can still be sent manually.
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return "downloaded";
  } catch {
    // html2canvas failed for some reason — fall back to the plain-text share.
    return shareOrCopy(title, fallbackText);
  }
}
