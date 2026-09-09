import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { Payment } from "@/types";

export function usePayments(params: Record<string, any>) {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: async () => {
      const res = await api.get("/payments", { params });
      return { data: res.data.data as Payment[], pagination: res.data.pagination };
    },
  });
}

export interface RecordPaymentInput {
  customerId: string;
  saleId?: string;
  amount: number;
  paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";
  notes?: string;
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => unwrap<Payment>(api.post("/payments", input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer"] });
      qc.invalidateQueries({ queryKey: ["customer-ledger"] });
      qc.invalidateQueries({ queryKey: ["customer-payments"] });
      qc.invalidateQueries({ queryKey: ["customer-sales"] });
      qc.invalidateQueries({ queryKey: ["sale"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["outstanding"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
