import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { Sale } from "@/types";

export function useSales(params: Record<string, any>) {
  return useQuery({
    queryKey: ["sales", params],
    queryFn: async () => {
      const res = await api.get("/sales", { params });
      return { data: res.data.data as Sale[], pagination: res.data.pagination };
    },
  });
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ["sale", id],
    queryFn: () => unwrap<{ sale: Sale; payments: any[] }>(api.get(`/sales/${id}`)),
    enabled: !!id,
  });
}

export interface NewSaleInput {
  customerId: string;
  items: { productId: string; quantity: number; lineTotal?: number }[];
  discount?: number;
  paidAmount: number;
  paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";
  notes?: string;
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewSaleInput) => unwrap<Sale>(api.post("/sales", input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["frames"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["outstanding"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}
