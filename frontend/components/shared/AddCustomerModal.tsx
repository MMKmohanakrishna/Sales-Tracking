"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CustomerFormFields } from "./CustomerFormFields";
import { useCreateCustomer, useUpdateCustomer, CustomerInput } from "@/hooks/useCustomers";
import type { Customer } from "@/types";

const indianPhone = /^[6-9]\d{9}$/;

const schema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().optional().refine((v) => !v || indianPhone.test(v), "Enter a valid 10-digit phone number"),
  address: z.string().optional(),
  mapLink: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), "Map link must start with http:// or https://"),
  notes: z.string().optional(),
});

export function AddCustomerModal({
  open,
  onClose,
  onCreated,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (customer: Customer) => void;
  /** When provided, the modal edits this customer instead of creating a new one. */
  customer?: Customer | null;
}) {
  const isEdit = !!customer;
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerInput>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset(
        customer
          ? {
              name: customer.name,
              phone: customer.phone,
              address: customer.address,
              mapLink: customer.mapLink,
              notes: customer.notes,
            }
          : { name: "", phone: "", address: "", mapLink: "", notes: "" }
      );
    }
  }, [open, customer, reset]);

  const mutation = isEdit ? updateCustomer : createCustomer;

  async function onSubmit(values: CustomerInput) {
    if (isEdit && customer) {
      const updated = await updateCustomer.mutateAsync({ id: customer._id, input: values });
      onClose();
      onCreated?.(updated);
    } else {
      const created = await createCustomer.mutateAsync(values);
      reset();
      onClose();
      onCreated?.(created);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={isEdit ? "Edit Customer" : "Add Customer"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <CustomerFormFields register={register} errors={errors} />
        {mutation.isError && (
          <p className="text-sm text-danger font-medium">{(mutation.error as Error).message}</p>
        )}
        <Button type="submit" size="lg" loading={mutation.isPending}>
          {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Save Customer"}
        </Button>
      </form>
    </Modal>
  );
}
