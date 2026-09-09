"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Phone, MapPin, StickyNote, CreditCard, Share2, Check } from "lucide-react";
import { useCustomer, useCustomerSales, useCustomerPayments } from "@/hooks/useCustomers";
import { useSettings } from "@/hooks/useSettings";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RecordPaymentModal } from "@/components/shared/RecordPaymentModal";
import { CustomerStatementCard } from "@/components/shared/CustomerStatementCard";
import { formatMoney, formatDate, cn } from "@/lib/utils";
import { buildCustomerStatement, shareElementAsImage } from "@/lib/share";
import Link from "next/link";

type Tab = "purchases" | "payments";

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("purchases");
  const [payOpen, setPayOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const [sharing, setSharing] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);

  const { data: customer, isLoading } = useCustomer(id);
  const { data: sales } = useCustomerSales(id);
  const { data: payments } = useCustomerPayments(id);
  const { data: settings } = useSettings();

  if (isLoading || !customer) return <LoadingState label="Loading customer..." />;

  async function handleShare() {
    if (!customer || !statementRef.current) return;
    setSharing(true);
    try {
      const text = buildCustomerStatement(settings?.businessName || "AbhiReka", customer, sales);
      const result = await shareElementAsImage(
        statementRef.current,
        `${customer.name.replace(/\s+/g, "-")}-statement.png`,
        `${customer.name} — Statement`,
        text
      );
      if (result === "downloaded") {
        setShareFeedback("Statement image downloaded — ready to send.");
        setTimeout(() => setShareFeedback(""), 3000);
      } else if (result === "copied") {
        setShareFeedback("Copied to clipboard!");
        setTimeout(() => setShareFeedback(""), 2500);
      } else if (result === "failed") {
        setShareFeedback("Couldn't share. Please try again.");
        setTimeout(() => setShareFeedback(""), 3000);
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">{customer.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted">
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {customer.phone}
                </span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {customer.address}
                </span>
              )}
              {customer.notes && (
                <span className="flex items-center gap-1">
                  <StickyNote className="h-3.5 w-3.5" /> {customer.notes}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleShare} loading={sharing}>
              <Share2 className="h-5 w-5" /> {sharing ? "Preparing..." : "Share"}
            </Button>
            {customer.totalPending > 0 && (
              <Button onClick={() => setPayOpen(true)}>
                <CreditCard className="h-5 w-5" /> Record Payment
              </Button>
            )}
          </div>
        </div>

        {shareFeedback && (
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-success bg-success/10 rounded-lg px-3 py-2">
            <Check className="h-4 w-4" /> {shareFeedback}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border text-center">
          <div>
            <p className="text-xs text-muted mb-1">Total Purchases</p>
            <p className="text-xl font-extrabold">{formatMoney(customer.totalPurchased)}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Total Paid</p>
            <p className="text-xl font-extrabold text-success">{formatMoney(customer.totalPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Total Pending</p>
            <p className={cn("text-xl font-extrabold", customer.totalPending > 0 ? "text-danger" : "text-success")}>
              {formatMoney(customer.totalPending)}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(["purchases", "payments"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold border capitalize whitespace-nowrap",
              tab === t ? "bg-primary text-white border-primary" : "bg-card border-border text-ink/70"
            )}
          >
            {t === "purchases" ? "Purchase History" : "Payment History"}
          </button>
        ))}
      </div>

      {tab === "purchases" && (
        <Card className="p-0 overflow-hidden">
          {!sales?.length ? (
            <EmptyState emoji="🖼️" title="No purchases yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background text-muted text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Items</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                    <th className="px-4 py-3 font-semibold text-right">Paid</th>
                    <th className="px-4 py-3 font-semibold text-right">Pending</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sales.map((s: any) => (
                    <tr key={s._id} className="hover:bg-black/5">
                      <td className="px-4 py-3">
                        <Link href={`/sales/${s._id}`} className="text-primary font-semibold">
                          {formatDate(s.saleDate)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{s.items.map((i: any) => `${i.frameName} × ${i.quantity}`).join(", ")}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(s.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-success">{formatMoney(s.paidAmount)}</td>
                      <td className="px-4 py-3 text-right text-danger">{formatMoney(s.pendingAmount)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.paymentStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "payments" && (
        <Card className="p-0 overflow-hidden">
          {!payments?.length ? (
            <EmptyState emoji="💳" title="No payments recorded yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background text-muted text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold">Method</th>
                    <th className="px-4 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p: any) => (
                    <tr key={p._id} className="hover:bg-black/5">
                      <td className="px-4 py-3">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-success">{formatMoney(p.amount)}</td>
                      <td className="px-4 py-3">{p.paymentMethod.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-muted">{p.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <RecordPaymentModal open={payOpen} onClose={() => setPayOpen(false)} customer={customer} />

      {/* Rendered off-screen — captured to an image when Share is clicked */}
      <div className="fixed -left-[9999px] top-0" aria-hidden="true">
        <CustomerStatementCard ref={statementRef} business={settings} customer={customer} sales={sales} />
      </div>
    </div>
  );
}
