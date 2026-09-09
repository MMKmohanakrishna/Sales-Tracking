"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, ShoppingBag } from "lucide-react";
import { useSales } from "@/hooks/useSales";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/shared/Pagination";
import { formatMoney, formatDate, cn } from "@/lib/utils";

const statusFilters = [
  { key: "all", label: "All" },
  { key: "PAID", label: "Paid" },
  { key: "PARTIALLY_PAID", label: "Partial" },
  { key: "PENDING", label: "Pending" },
];

export default function SalesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const { data, isLoading } = useSales({ search, status, page });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Sales History</h1>
          <p className="text-muted mt-0.5">Every sale you have recorded</p>
        </div>
        <Link href="/sales/new" className="hidden sm:block">
          <Button>
            <PlusCircle className="h-5 w-5" /> New Sale
          </Button>
        </Link>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by sale number..." />

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap",
              status === f.key ? "bg-primary text-white border-primary" : "bg-card border-border text-ink/70"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading sales..." />
      ) : !data?.data.length ? (
        <EmptyState
          icon={ShoppingBag}
          title="No sales recorded yet"
          action={
            <Link href="/sales/new">
              <Button>
                <PlusCircle className="h-5 w-5" /> New Sale
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Card className="hidden md:block p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Sale ID</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold text-right">Paid</th>
                  <th className="px-4 py-3 font-semibold text-right">Pending</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((s: any) => (
                  <tr key={s._id} className="hover:bg-black/5">
                    <td className="px-4 py-3">
                      <Link href={`/sales/${s._id}`} className="text-primary font-semibold">
                        {s.saleNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatDate(s.saleDate)}</td>
                    <td className="px-4 py-3">{s.customerId?.name}</td>
                    <td className="px-4 py-3 text-muted max-w-xs truncate">
                      {s.items.map((i: any) => i.frameName).join(", ")}
                    </td>
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
          </Card>

          <div className="flex flex-col gap-3 md:hidden">
            {data.data.map((s: any) => (
              <Link key={s._id} href={`/sales/${s._id}`}>
                <Card>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-ink">{s.customerId?.name}</p>
                      <p className="text-xs text-muted">
                        {s.saleNumber} · {formatDate(s.saleDate)}
                      </p>
                    </div>
                    <StatusBadge status={s.paymentStatus} />
                  </div>
                  <p className="text-sm text-muted mb-2 truncate">
                    {s.items.map((i: any) => `${i.frameName} × ${i.quantity}`).join(", ")}
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center">
                    <div>
                      <p className="text-xs text-muted">Total</p>
                      <p className="font-bold text-sm">{formatMoney(s.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Paid</p>
                      <p className="font-bold text-sm text-success">{formatMoney(s.paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Pending</p>
                      <p className="font-bold text-sm text-danger">{formatMoney(s.pendingAmount)}</p>
                    </div>
                  </div>
                </Card>
              </Link>
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

      <Link
        href="/sales/new"
        className="sm:hidden fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-white shadow-lift flex items-center justify-center z-30"
        aria-label="New Sale"
      >
        <PlusCircle className="h-6 w-6" />
      </Link>
    </div>
  );
}
