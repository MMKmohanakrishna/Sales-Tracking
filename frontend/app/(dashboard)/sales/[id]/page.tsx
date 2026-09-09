"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Printer, CreditCard } from "lucide-react";
import { useSale } from "@/hooks/useSales";
import { useSettings } from "@/hooks/useSettings";
import { LoadingState } from "@/components/shared/LoadingState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RecordPaymentModal } from "@/components/shared/RecordPaymentModal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatMoney, formatDate, formatDateTime } from "@/lib/utils";
import type { Customer } from "@/types";

export default function SaleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useSale(id);
  const { data: settings } = useSettings();
  const [payOpen, setPayOpen] = useState(false);

  if (isLoading || !data) return <LoadingState label="Loading sale..." />;

  const { sale, payments } = data;
  const customer = sale.customerId as Customer;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div className="flex items-start justify-between no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Sale #{sale.saleNumber}</h1>
          <p className="text-muted mt-0.5">{formatDate(sale.saleDate)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          {sale.pendingAmount > 0 && (
            <Button size="sm" onClick={() => setPayOpen(true)}>
              <CreditCard className="h-4 w-4" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Receipt */}
      <Card id="receipt">
        <div className="text-center mb-4 pb-4 border-b border-border">
          <h2 className="text-xl font-extrabold text-primary">{settings?.businessName || "AbhiReka"}</h2>
          {settings?.address && <p className="text-xs text-muted">{settings.address}</p>}
          {settings?.phone && <p className="text-xs text-muted">{settings.phone}</p>}
        </div>

        <div className="flex justify-between text-sm mb-4">
          <div>
            <p className="text-muted">Customer</p>
            <p className="font-bold text-ink">{customer?.name}</p>
            {customer?.phone && <p className="text-muted">{customer.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-muted">Date</p>
            <p className="font-semibold">{formatDate(sale.saleDate)}</p>
            <StatusBadge status={sale.paymentStatus} />
          </div>
        </div>

        <div className="flex flex-col divide-y divide-border mb-4">
          {sale.items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2">
              <div>
                <p className="font-semibold text-ink">
                  {item.frameName} × {item.quantity}
                </p>
                <p className="text-xs text-muted">
                  {item.godName} {item.size ? `· ${item.size}` : ""} · {formatMoney(item.unitPrice)} each
                </p>
              </div>
              <p className="font-bold">{formatMoney(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3 flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span>{formatMoney(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted">Discount</span>
              <span>-{formatMoney(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-lg">
            <span>Total</span>
            <span>{formatMoney(sale.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-success font-semibold">
            <span>Paid</span>
            <span>{formatMoney(sale.paidAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-danger font-semibold">
            <span>Balance</span>
            <span>{formatMoney(sale.pendingAmount)}</span>
          </div>
        </div>

        {sale.notes && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted">Notes</p>
            <p className="text-sm">{sale.notes}</p>
          </div>
        )}
      </Card>

      {/* Payment history for this sale */}
      <Card className="no-print">
        <h2 className="font-bold text-ink mb-3">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted">No payments recorded for this sale yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {payments.map((p: any) => (
              <div key={p._id} className="flex justify-between py-2 text-sm">
                <div>
                  <p className="font-semibold">{p.paymentNumber}</p>
                  <p className="text-xs text-muted">{formatDateTime(p.paymentDate)} · {p.paymentMethod.replace("_", " ")}</p>
                </div>
                <p className="font-bold text-success">{formatMoney(p.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <RecordPaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        customer={customer}
        saleId={sale._id}
        outstandingOverride={sale.pendingAmount}
      />
    </div>
  );
}
