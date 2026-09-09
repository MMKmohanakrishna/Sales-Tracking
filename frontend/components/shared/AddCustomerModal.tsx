"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CustomerFormFields } from "./CustomerFormFields";
import { useCreateCustomer, CustomerInput } from "@/hooks/useCustomers";
import type { Customer } from "@/types";

const indianPhone = /^[6-9]\d{9}$/;

const schema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().optional().refine((v) => !v || indianPhone.test(v), "Enter a valid 10-digit phone number"),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export function AddCustomerModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (customer: Customer) => void;
}) {
  const createCustomer = useCreateCustomer();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerInput>({ resolver: zodResolver(schema) });

  async function onSubmit(values: CustomerInput) {
    const customer = await createCustomer.mutateAsync(values);
    reset();
    onClose();
    onCreated?.(customer);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add Customer"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <CustomerFormFields register={register} errors={errors} />
        {createCustomer.isError && (
          <p className="text-sm text-danger font-medium">{(createCustomer.error as Error).message}</p>
        )}
        <Button type="submit" size="lg" loading={createCustomer.isPending}>
          {createCustomer.isPending ? "Saving..." : "Save Customer"}
        </Button>
      </form>
    </Modal>
  );
}
