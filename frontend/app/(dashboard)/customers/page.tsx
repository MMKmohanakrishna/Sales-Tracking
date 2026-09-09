"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { UserPlus, Phone, ChevronRight, Users, Trash2 } from "lucide-react";
import { useCustomers, useDeleteCustomer } from "@/hooks/useCustomers";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AddCustomerModal } from "@/components/shared/AddCustomerModal";
import { Pagination } from "@/components/shared/Pagination";
import { formatMoney, cn } from "@/lib/utils";
import type { Customer } from "@/types";

const filters = [
  { key: "all", label: "All" },
  { key: "pending", label: "Has Pending" },
  { key: "paid", label: "Fully Paid" },
];

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setAddOpen(true);
      router.replace("/customers");
    }
  }, [searchParams, router]);

  // Reset to page 1 whenever the search/filter changes — otherwise you can
  // get stuck on e.g. page 3 after a search narrows the results to 1 page.
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const { data, isLoading } = useCustomers({ search, filter, page });
  const deleteCustomer = useDeleteCustomer();

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteCustomer.mutateAsync(deleteTarget._id);
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Customers</h1>
          <p className="text-muted mt-0.5">Manage your customers and their balances</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="hidden sm:inline-flex">
          <UserPlus className="h-5 w-5" /> Add Customer
        </Button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or phone..." />

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap",
              filter === f.key ? "bg-primary text-white border-primary" : "bg-card border-border text-ink/70"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading customers..." />
      ) : !data?.data.length ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to start recording sales."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus className="h-5 w-5" /> Add Customer
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Purchased</th>
                  <th className="px-4 py-3 font-semibold text-right">Paid</th>
                  <th className="px-4 py-3 font-semibold text-right">Pending</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((c) => (
                  <tr key={c._id} className="hover:bg-black/5">
                    <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                    <td className="px-4 py-3 text-muted">{c.phone || "-"}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(c.totalPurchased)}</td>
                    <td className="px-4 py-3 text-right text-success font-semibold">
                      {formatMoney(c.totalPaid)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={c.totalPending > 0 ? "text-danger" : "text-success"}>
                        {formatMoney(c.totalPending)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/customers/${c._id}`} className="text-primary font-semibold text-sm">
                          View Details
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          aria-label={`Delete ${c.name}`}
                          title="Delete customer"
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {data.data.map((c) => (
              <Card key={c._id} className="active:scale-[0.99] transition-transform">
                <Link href={`/customers/${c._id}`} className="block">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-ink">{c.name}</p>
                      {c.phone && (
                        <p className="text-sm text-muted flex items-center gap-1 mt-0.5">
                          <Phone className="h-3.5 w-3.5" /> {c.phone}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted shrink-0" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border text-center">
                    <div>
                      <p className="text-xs text-muted">Total</p>
                      <p className="font-bold text-sm">{formatMoney(c.totalPurchased)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Paid</p>
                      <p className="font-bold text-sm text-success">{formatMoney(c.totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Pending</p>
                      <p className={cn("font-bold text-sm", c.totalPending > 0 ? "text-danger" : "text-success")}>
                        {formatMoney(c.totalPending)}
                      </p>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => setDeleteTarget(c)}
                  className="flex items-center justify-center gap-1.5 w-full mt-3 pt-3 border-t border-border text-danger text-sm font-semibold"
                >
                  <Trash2 className="h-4 w-4" /> Delete Customer
                </button>
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

      {/* Mobile floating add button */}
      <button
        onClick={() => setAddOpen(true)}
        className="sm:hidden fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-white shadow-lift flex items-center justify-center z-30"
        aria-label="Add Customer"
      >
        <UserPlus className="h-6 w-6" />
      </button>

      <AddCustomerModal open={addOpen} onClose={() => setAddOpen(false)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={
          deleteTarget
            ? deleteTarget.totalPending > 0
              ? `⚠️ "${deleteTarget.name}" still owes you ${formatMoney(deleteTarget.totalPending)}. Deleting them will permanently erase this debt, along with ALL their sales and payment history — your reports and totals will update to no longer include them. This cannot be undone. Are you sure?`
              : `Delete "${deleteTarget.name}" permanently, along with all their sales and payment history? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete Permanently"
        danger
        loading={deleteCustomer.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
