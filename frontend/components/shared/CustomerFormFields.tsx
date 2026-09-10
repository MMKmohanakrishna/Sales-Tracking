"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input, Textarea } from "@/components/ui/Input";
import type { CustomerInput } from "@/hooks/useCustomers";

export function CustomerFormFields({
  register,
  errors,
}: {
  register: UseFormRegister<CustomerInput>;
  errors: FieldErrors<CustomerInput>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Customer Name"
        required
        placeholder="Ramesh Kumar"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Phone Number"
        placeholder="9876543210"
        inputMode="numeric"
        hint="10-digit Indian mobile number (optional)"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Input
        label="Address"
        placeholder="Bengaluru"
        error={errors.address?.message}
        {...register("address")}
      />
      <Input
        label="Map Link"
        placeholder="Paste a Google Maps link"
        hint="Optional — open Google Maps, find the location, tap Share, and paste the link here"
        error={errors.mapLink?.message}
        {...register("mapLink")}
      />
      <Textarea
        label="Notes"
        placeholder="Regular customer"
        error={errors.notes?.message}
        {...register("notes")}
      />
    </div>
  );
}
