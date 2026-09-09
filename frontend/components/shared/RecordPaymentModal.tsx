"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useRecordPayment } from "@/hooks/usePayments";
import { formatMoney } from "@/lib/utils";
import type { Customer } from "@/types";

const schema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "OTHER"]),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function RecordPaymentModal({
  open,
  onClose,
  customer,
  saleId,
  outstandingOverride,
}: {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  saleId?: string;
  outstandingOverride?: number;
}) {
  const recordPayment = useRecordPayment();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "CASH" },
  });

  useEffect(() => {
    if (open) reset({ paymentMethod: "CASH", amount: undefined, notes: "" });
  }, [open, reset]);

  const outstanding = outstandingOverride ?? customer?.totalPending ?? 0;
  const amountValue = watch("amount") || 0;
  const remaining = Math.max(0, outstanding - amountValue);

  async function onSubmit(values: FormValues) {
    if (!customer) return;
    if (values.amount > outstanding) return;
    await recordPayment.mutateAsync({
      customerId: customer._id,
      saleId,
      amount: values.amount,
      paymentMethod: values.paymentMethod,
      notes: values.notes,
    });
    onClose();
  }

  if (!customer) return null;

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="bg-background rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Customer</p>
            <p className="font-bold text-ink">{customer.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Outstanding</p>
            <p className="font-bold text-danger">{formatMoney(outstanding)}</p>
          </div>
        </div>

        <Input
          label="Payment Amount"
          type="number"
          step="0.01"
          required
          placeholder="0"
          error={errors.amount?.message}
          {...register("amount")}
        />

        <Select label="Payment Method" required {...register("paymentMethod")}>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="OTHER">Other</option>
        </Select>

        <Textarea label="Notes" placeholder="Optional" {...register("notes")} />

        {amountValue > 0 && (
          <div className="bg-primary/5 rounded-xl p-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted">Previous</p>
              <p className="font-bold text-sm">{formatMoney(outstanding)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Payment</p>
              <p className="font-bold text-sm text-success">{formatMoney(amountValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Remaining</p>
              <p className="font-bold text-sm text-danger">{formatMoney(remaining)}</p>
            </div>
          </div>
        )}

        {amountValue > outstanding && (
          <p className="text-sm text-danger font-medium">
            Payment cannot exceed the outstanding balance of {formatMoney(outstanding)}.
          </p>
        )}
        {recordPayment.isError && (
          <p className="text-sm text-danger font-medium">{(recordPayment.error as Error).message}</p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={recordPayment.isPending}
          disabled={amountValue > outstanding}
        >
          {recordPayment.isPending ? "Recording Payment..." : "Record Payment"}
        </Button>
      </form>
    </Modal>
  );
}
