"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { usePayments } from "@/hooks/usePayments";
import { usePaymentsReport } from "@/hooks/useReports";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { Pagination } from "@/components/shared/Pagination";
import { formatMoney, formatDate } from "@/lib/utils";
import type { Customer, Sale } from "@/types";

const methodFilters = [
  { key: "all", label: "All Methods" },
  { key: "CASH", label: "Cash" },
  { key: "UPI", label: "UPI" },
  { key: "BANK_TRANSFER", label: "Bank Transfer" },
  { key: "OTHER", label: "Other" },
];

const dateFilters = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

function dateRangeFor(key: string) {
  const now = new Date();
  if (key === "today") {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { from: from.toISOString() };
  }
  if (key === "week") {
    const day = now.getDay() || 7;
    const from = new Date(now);
    from.setDate(now.getDate() - day + 1);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString() };
  }
  if (key === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: from.toISOString() };
  }
  return {};
}

export default function PaymentsPage() {
  const [method, setMethod] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [method, dateRange]);

  const { data, isLoading } = usePayments({ method, page, ...dateRangeFor(dateRange) });
  // Computed server-side from ALL matching payments (not just the current
  // page of the filtered list above), so this stays correct regardless of
  // pagination or which filters are active.
  const { data: paymentsReport } = usePaymentsReport();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Payments</h1>
        <p className="text-muted mt-0.5">Every payment received from customers</p>
      </div>

      <Card className="bg-success/5 border-success/20">
        <p className="text-sm text-muted">Total Payments Today</p>
        <p className="text-2xl font-extrabold text-success">{formatMoney(paymentsReport?.collectedToday)}</p>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={method} onChange={(e) => setMethod(e.target.value)} className="sm:w-56">
          {methodFilters.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </Select>
        <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="sm:w-56">
          {dateFilters.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <LoadingState label="Loading payments..." />
      ) : !data?.data.length ? (
        <EmptyState icon={CreditCard} title="No payments recorded yet" />
      ) : (
        <>
          <Card className="hidden md:block p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Sale</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((p) => (
                  <tr key={p._id} className="hover:bg-black/5">
                    <td className="px-4 py-3">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3 font-semibold">{(p.customerId as Customer)?.name}</td>
                    <td className="px-4 py-3 text-right text-success font-semibold">{formatMoney(p.amount)}</td>
                    <td className="px-4 py-3">{p.paymentMethod.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-muted">{(p.saleId as Sale)?.saleNumber || "-"}</td>
                    <td className="px-4 py-3 text-muted">{p.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="flex flex-col gap-3 md:hidden">
            {data.data.map((p) => (
              <Card key={p._id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-ink">{(p.customerId as Customer)?.name}</p>
                    <p className="text-xs text-muted">
                      {formatDate(p.paymentDate)} · {p.paymentMethod.replace("_", " ")}
                    </p>
                  </div>
                  <p className="font-extrabold text-success">{formatMoney(p.amount)}</p>
                </div>
              </Card>
            ))}
          </div>

          {data?.pagination && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
