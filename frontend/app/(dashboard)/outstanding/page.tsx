"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { useOutstanding } from "@/hooks/useOutstanding";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { RecordPaymentModal } from "@/components/shared/RecordPaymentModal";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatMoney, formatDate, cn } from "@/lib/utils";
import type { Customer } from "@/types";

const sortOptions = [
  { key: "highest", label: "Highest Amount" },
  { key: "lowest", label: "Lowest Amount" },
  { key: "oldest", label: "Oldest Pending" },
  { key: "newest", label: "Newest Pending" },
  { key: "name", label: "Customer Name" },
];

export default function OutstandingPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("highest");
  const [payTarget, setPayTarget] = useState<Customer | null>(null);

  const { data, isLoading } = useOutstanding({ search, sort });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink flex items-center gap-2">
          Money to Collect
        </h1>
        <Card className="mt-4 bg-danger/5 border-danger/20">
          <p className="text-sm text-muted">Total Outstanding</p>
          <p className="text-3xl font-extrabold text-danger">{formatMoney(data?.totalOutstanding)}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search customer..." />
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="sm:w-56">
          {sortOptions.map((o) => (
            <option key={o.key} value={o.key}>
              Sort: {o.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <LoadingState label="Loading outstanding balances..." />
      ) : !data?.customers.length ? (
        <EmptyState emoji="🎉" title="No pending payments" description="All customers are fully paid." />
      ) : (
        <div className="flex flex-col gap-3">
          {data.customers.map((c) => (
            <Card key={c._id} className="flex items-center justify-between gap-3">
              <Link href={`/customers/${c._id}`} className="min-w-0 flex-1">
                <p className="font-bold text-ink truncate">{c.name}</p>
                {c.phone && <p className="text-sm text-muted">{c.phone}</p>}
                <p className="text-xs text-muted mt-0.5">Pending since {formatDate(c.oldestPendingDate)}</p>
              </Link>
              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                <p className="text-lg font-extrabold text-danger">{formatMoney(c.totalPending)}</p>
                <Button size="sm" onClick={() => setPayTarget(c as unknown as Customer)}>
                  <CreditCard className="h-4 w-4" /> Record Payment
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RecordPaymentModal open={!!payTarget} onClose={() => setPayTarget(null)} customer={payTarget} />
    </div>
  );
}
