import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";

export interface OutstandingCustomer {
  _id: string;
  name: string;
  phone?: string;
  totalPending: number;
  oldestPendingDate: string;
}

export function useOutstanding(params: { search?: string; sort?: string }) {
  return useQuery({
    queryKey: ["outstanding", params],
    queryFn: () =>
      unwrap<{ customers: OutstandingCustomer[]; totalOutstanding: number }>(
        api.get("/outstanding", { params })
      ),
  });
}
