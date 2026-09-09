"use client";

import { useState } from "react";
import { UserPlus, Search, Trash2 } from "lucide-react";
import { useCustomers, useDeleteCustomer } from "@/hooks/useCustomers";
import { AddCustomerModal } from "./AddCustomerModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Customer } from "@/types";
import { cn, formatMoney } from "@/lib/utils";

export function CustomerPicker({
  value,
  onChange,
}: {
  value: Customer | null;
  onChange: (customer: Customer) => void;
}) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Customer | null>(null);
  const { data, isLoading } = useCustomers({ search });
  const deleteCustomer = useDeleteCustomer();

  async function confirmRemove() {
    if (!removeTarget) return;
    await deleteCustomer.mutateAsync(removeTarget._id);
    setRemoveTarget(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div>
            <p className="font-bold text-ink">{value.name}</p>
            {value.phone && <p className="text-sm text-muted">{value.phone}</p>}
          </div>
          <button
            onClick={() => onChange(null as any)}
            className="text-primary text-sm font-semibold"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer by name or phone..."
              className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-primary/40 rounded-xl py-3 text-primary font-semibold hover:bg-primary/5"
          >
            <UserPlus className="h-5 w-5" /> Add New Customer
          </button>

          {!isLoading && (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {data?.data.map((c) => (
                <div
                  key={c._id}
                  className={cn(
                    "flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-border hover:bg-black/5"
                  )}
                >
                  <button onClick={() => onChange(c)} className="flex items-center justify-between flex-1 min-w-0 text-left">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted">{c.phone}</p>}
                    </div>
                    {c.totalPending > 0 && (
                      <span className="text-xs font-semibold text-danger shrink-0 ml-2">
                        ₹{c.totalPending} pending
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRemoveTarget(c);
                    }}
                    aria-label={`Remove ${c.name}`}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {data?.data.length === 0 && (
                <p className="text-sm text-muted text-center py-4">No customers found. Add a new one above.</p>
              )}
            </div>
          )}
        </>
      )}

      <AddCustomerModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={onChange} />

      <ConfirmDialog
        open={!!removeTarget}
        title="Delete Customer"
        message={
          removeTarget
            ? removeTarget.totalPending > 0
              ? `⚠️ "${removeTarget.name}" still owes ${formatMoney(removeTarget.totalPending)}. Deleting them will permanently erase this debt, along with ALL their sales and payment history. This cannot be undone.`
              : `Delete "${removeTarget.name}" permanently, along with all their sales and payment history? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete Permanently"
        danger
        loading={deleteCustomer.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
