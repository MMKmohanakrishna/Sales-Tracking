import { forwardRef } from "react";
import { formatMoney, formatDate, statusLabel } from "@/lib/utils";
import type { Customer, BusinessSettings, PaymentStatus } from "@/types";

// html2canvas doesn't reliably resolve Tailwind's custom theme colors
// (text-primary, text-muted, etc. — it can render the wrong color or fall
// back to a browser default). Since this card only exists to be captured
// as an image, every color here is an explicit inline style instead.
const COLORS = {
  primary: "#7A1F3D",
  ink: "#1F1F1F",
  muted: "#6B7280",
  success: "#15803D",
  danger: "#DC2626",
  border: "#E5E7EB",
  warning: "#D97706",
};

/** Inline-styled status pill — mirrors StatusBadge, but with guaranteed
 * colors for html2canvas capture instead of Tailwind theme classes. */
function StatusPill({ status }: { status: PaymentStatus }) {
  const color =
    status === "PAID" ? COLORS.success : status === "PARTIALLY_PAID" ? COLORS.warning : COLORS.danger;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        color,
        background: `${color}1A`,
        borderRadius: 9999,
        padding: "2px 8px",
        marginTop: 2,
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

/**
 * Branded statement card — same visual language as the sale receipt
 * (business header, clean list, totals) but summarizing a customer's whole
 * purchase history and balance. Rendered off-screen and captured to an
 * image for sharing (see lib/share.ts).
 */
export const CustomerStatementCard = forwardRef<
  HTMLDivElement,
  { business?: Partial<BusinessSettings>; customer: Customer; sales: any[] | undefined }
>(function CustomerStatementCard({ business, customer, sales }, ref) {
  return (
    <div
      ref={ref}
      style={{
        background: "#ffffff",
        width: 420,
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        color: COLORS.ink,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
        {business?.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo}
            alt={business.businessName}
            style={{ height: 56, width: 56, borderRadius: "9999px", objectFit: "cover", margin: "0 auto 8px" }}
          />
        )}
        <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.primary, margin: 0 }}>
          {business?.businessName || "AbhiReka"}
        </h2>
        <p style={{ fontSize: 12, color: COLORS.muted, margin: "2px 0 0" }}>Lightings and Photo Frames</p>
        {business?.address && <p style={{ fontSize: 12, color: COLORS.muted, margin: "4px 0 0" }}>{business.address}</p>}
        {business?.phone && <p style={{ fontSize: 12, color: COLORS.muted, margin: 0 }}>{business.phone}</p>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 16 }}>
        <div>
          <p style={{ color: COLORS.muted, margin: 0 }}>Customer Statement</p>
          <p style={{ fontWeight: 700, fontSize: 16, margin: "2px 0" }}>{customer.name}</p>
          {customer.phone && <p style={{ color: COLORS.muted, margin: 0 }}>{customer.phone}</p>}
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: COLORS.muted, margin: 0 }}>Date</p>
          <p style={{ fontWeight: 600, margin: "2px 0" }}>{formatDate(new Date())}</p>
        </div>
      </div>

      {sales && sales.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {sales.map((s: any, idx: number) => (
            <div
              key={s._id}
              style={{
                padding: "10px 0",
                borderTop: idx === 0 ? "none" : `1px solid ${COLORS.border}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>{formatDate(s.saleDate)}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: "2px 0 0" }}>
                    {s.items.map((i: any) => `${i.frameName} × ${i.quantity}`).join(", ")}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{formatMoney(s.totalAmount)}</p>
                  <StatusPill status={s.paymentStatus} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 6, fontSize: 12 }}>
                <span style={{ color: COLORS.success, fontWeight: 600 }}>Paid: {formatMoney(s.paidAmount)}</span>
                <span style={{ color: COLORS.danger, fontWeight: 600 }}>Balance: {formatMoney(s.pendingAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span style={{ color: COLORS.muted }}>Total Purchased</span>
          <span style={{ fontWeight: 600 }}>{formatMoney(customer.totalPurchased)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: COLORS.success, fontWeight: 600 }}>
          <span>Total Paid</span>
          <span>{formatMoney(customer.totalPaid)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: COLORS.danger }}>
          <span>Balance Due</span>
          <span>{formatMoney(customer.totalPending)}</span>
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          color: COLORS.muted,
          marginTop: 20,
          paddingTop: 16,
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        Thank you for your business!
      </p>
    </div>
  );
});
