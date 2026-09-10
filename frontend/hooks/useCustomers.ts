import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { Customer, Paginated } from "@/types";

export function useCustomers(params: { search?: string; filter?: string; page?: number }) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: async () => {
      const res = await api.get("/customers", { params });
      return { data: res.data.data as Customer[], pagination: res.data.pagination };
    },
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => unwrap<Customer>(api.get(`/customers/${id}`)),
    enabled: !!id,
  });
}

export function useCustomerLedger(id: string | undefined) {
  return useQuery({
    queryKey: ["customer-ledger", id],
    queryFn: () =>
      unwrap<{ customer: Customer; ledger: any[]; currentBalance: number }>(
        api.get(`/customers/${id}/ledger`)
      ),
    enabled: !!id,
  });
}

export function useCustomerSales(id: string | undefined) {
  return useQuery({
    queryKey: ["customer-sales", id],
    queryFn: () => unwrap<any[]>(api.get(`/customers/${id}/sales`)),
    enabled: !!id,
  });
}

export function useCustomerPayments(id: string | undefined) {
  return useQuery({
    queryKey: ["customer-payments", id],
    queryFn: () => unwrap<any[]>(api.get(`/customers/${id}/payments`)),
    enabled: !!id,
  });
}

export interface CustomerInput {
  name: string;
  phone?: string;
  address?: string;
  mapLink?: string;
  notes?: string;
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => unwrap<Customer>(api.post("/customers", input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CustomerInput> }) =>
      unwrap<Customer>(api.put(`/customers/${id}`, input)),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", vars.id] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
