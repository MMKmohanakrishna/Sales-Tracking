"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trash2, PlusCircle, CheckCircle2, Users, Image as ImageIcon } from "lucide-react";
import { CustomerPicker } from "@/components/shared/CustomerPicker";
import { FramePickerModal } from "@/components/shared/FramePickerModal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useCreateSale } from "@/hooks/useSales";
import { formatMoney } from "@/lib/utils";
import type { Customer, Product } from "@/types";

interface SaleLine {
  product: Product;
  quantity: number;
  // Set only when this line's price was entered as an exact lump-sum total
  // (New Sale's quick-add form) rather than a per-unit price — kept as-is
  // all the way to the backend so it's charged exactly, with no rounding
  // drift from dividing and re-multiplying by quantity.
  lineTotal?: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "BANK_TRANSFER" | "OTHER">("CASH");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);

  const createSale = useCreateSale();

  function lineAmount(l: SaleLine) {
    return l.lineTotal ?? l.product.sellingPrice * l.quantity;
  }

  const total = useMemo(() => lines.reduce((sum, l) => sum + lineAmount(l), 0), [lines]);
  const paid = Math.min(parseFloat(paidAmount) || 0, total);
  const pending = Math.max(0, total - paid);
  const status = paid <= 0 ? "Pending" : paid < total ? "Partially Paid" : "Paid";

  function addLine(product: Product, quantity: number, lineTotal?: number) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product._id === product._id);
      if (existing) {
        return prev.map((l) =>
          l.product._id === product._id
            ? {
                ...l,
                quantity: l.quantity + quantity,
                // Combine exact totals if either line has one, so the sum
                // still charges exactly what was typed either time.
                lineTotal:
                  l.lineTotal !== undefined || lineTotal !== undefined
                    ? (l.lineTotal ?? l.product.sellingPrice * l.quantity) + (lineTotal ?? product.sellingPrice * quantity)
                    : undefined,
              }
            : l
        );
      }
      return [...prev, { product, quantity, lineTotal }];
    });
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.product._id !== productId));
  }

  async function handleSubmit() {
    setError("");
    if (!customer) return setError("Please select a customer");
    if (lines.length === 0) return setError("Add at least one frame");
    if (parseFloat(paidAmount || "0") > total) return setError("Paid amount cannot exceed the total amount");

    try {
      const sale = await createSale.mutateAsync({
        customerId: customer._id,
        items: lines.map((l) => ({ productId: l.product._id, quantity: l.quantity, lineTotal: l.lineTotal })),
        paidAmount: paid,
        paymentMethod,
        notes,
      });
      setSuccess(sale);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function resetForNewSale() {
    setCustomer(null);
    setLines([]);
    setPaidAmount("");
    setNotes("");
    setSuccess(null);
    setError("");
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center text-center gap-4 py-10">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <CheckCircle2 className="h-20 w-20 text-success" />
        </motion.div>
        <h1 className="text-2xl font-extrabold text-ink">✓ Sale Recorded Successfully</h1>
        <p className="text-muted">Sale #{success.saleNumber}</p>

        <Card className="w-full text-left">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted">Total</p>
              <p className="text-xl font-extrabold">{formatMoney(success.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Paid</p>
              <p className="text-xl font-extrabold text-success">{formatMoney(success.paidAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Pending</p>
              <p className="text-xl font-extrabold text-danger">{formatMoney(success.pendingAmount)}</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3 w-full">
          <Link href={`/customers/${customer?._id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Customer
            </Button>
          </Link>
          <Button className="flex-1" onClick={resetForNewSale}>
            New Sale
          </Button>
        </div>
        <Link href={`/sales/${success._id}`} className="text-primary text-sm font-semibold">
          View Full Sale Details / Print Receipt
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">New Sale</h1>
        <p className="text-muted mt-0.5">Record what was sold, to whom, and how much was paid</p>
      </div>

      {/* Step 1: Customer */}
      <Card>
        <h2 className="font-bold text-ink mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> 1. Select Customer
        </h2>
        <CustomerPicker value={customer} onChange={setCustomer} />
      </Card>

      {/* Step 2: Frames */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-ink flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" /> 2. Add Photo Frames
          </h2>
        </div>

        {lines.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {lines.map((l) => (
              <div
                key={l.product._id}
                className="flex items-center justify-between bg-background rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {l.product.frameName} × {l.quantity}
                  </p>
                  <p className="text-xs text-muted">
                    {l.lineTotal !== undefined
                      ? "Fixed total for this line"
                      : `${formatMoney(l.product.sellingPrice)} each`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{formatMoney(lineAmount(l))}</span>
                  <button
                    onClick={() => removeLine(l.product._id)}
                    className="text-danger p-1"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center justify-center gap-2 border-2 border-dashed border-primary/40 rounded-xl py-3 text-primary font-semibold hover:bg-primary/5 w-full"
        >
          <PlusCircle className="h-5 w-5" /> Add Another Frame
        </button>

        {lines.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="font-bold text-ink">Total</span>
            <span className="text-2xl font-extrabold text-primary">{formatMoney(total)}</span>
          </div>
        )}
      </Card>

      {/* Step 3: Payment */}
      {lines.length > 0 && (
        <Card>
          <h2 className="font-bold text-ink mb-3">3. Payment</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Input
              label="Paid Now (₹)"
              type="number"
              step="0.01"
              min={0}
              max={total}
              placeholder="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div className="bg-primary/5 rounded-xl p-4 grid grid-cols-3 gap-2 text-center mb-4">
            <div>
              <p className="text-xs text-muted">Total</p>
              <p className="font-bold">{formatMoney(total)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Paid</p>
              <p className="font-bold text-success">{formatMoney(paid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Pending</p>
              <p className="font-bold text-danger">{formatMoney(pending)}</p>
            </div>
          </div>

          <p className="text-sm font-semibold text-center mb-4">
            Status: <span className="text-primary">{status}</span>
          </p>

          <Textarea
            label="Notes"
            placeholder="Customer will pay remaining amount next week."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Card>
      )}

      {error && (
        <p className="text-sm text-danger font-medium bg-danger/10 rounded-xl px-4 py-3">{error}</p>
      )}

      <Button
        size="xl"
        className="w-full sticky bottom-20 lg:bottom-4"
        onClick={handleSubmit}
        loading={createSale.isPending}
        disabled={!customer || lines.length === 0}
      >
        {createSale.isPending ? "Saving Sale..." : "Complete Sale"}
      </Button>

      <FramePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addLine}
        currentPaidAmount={parseFloat(paidAmount) || 0}
        onPaidAmountChange={(amount) => setPaidAmount(String(amount))}
      />
    </div>
  );
}
