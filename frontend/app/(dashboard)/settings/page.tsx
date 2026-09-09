"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { LogOut, Save, KeyRound } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/shared/LoadingState";
import { api } from "@/lib/api";
import type { BusinessSettings } from "@/types";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { user, logout } = useAuth();

  const { register, handleSubmit, reset } = useForm<Partial<BusinessSettings>>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  async function onSubmit(values: Partial<BusinessSettings>) {
    await updateSettings.mutateAsync(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function togglePaymentMethod(key: string) {
    if (!settings) return;
    const updated = settings.paymentMethods.map((m) =>
      m.key === key ? { ...m, enabled: !m.enabled } : m
    );
    await updateSettings.mutateAsync({ paymentMethods: updated });
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (pwForm.newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    try {
      await api.post("/auth/change-password", pwForm);
      setPwSuccess(true);
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  }

  if (isLoading || !settings) return <LoadingState label="Loading settings..." />;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        <p className="text-muted mt-0.5">Configure your business details and preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="flex flex-col gap-4">
          <h2 className="font-bold text-ink">Business Information</h2>
          <Input label="Business Name" {...register("businessName")} />
          <Input label="Owner Name" {...register("ownerName")} />
          <Input label="Phone" {...register("phone")} />
          <Input label="Address" {...register("address")} />
          <Button type="submit" loading={updateSettings.isPending} className="self-start">
            <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save Changes"}
          </Button>
        </Card>
      </form>

      <Card className="flex flex-col gap-4">
        <h2 className="font-bold text-ink">Payment Methods</h2>
        <p className="text-sm text-muted -mt-2">Enable or disable payment methods offered at checkout</p>
        <div className="flex flex-col divide-y divide-border">
          {settings.paymentMethods.map((m) => (
            <div key={m.key} className="flex items-center justify-between py-3">
              <span className="font-semibold text-ink">{m.label}</span>
              <button
                onClick={() => togglePaymentMethod(m.key)}
                className={`h-7 w-12 rounded-full transition-colors relative ${
                  m.enabled ? "bg-success" : "bg-black/15"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                    m.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-bold text-ink">Currency</h2>
        <p className="text-sm text-muted">Default currency: <strong>INR (₹)</strong></p>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-bold text-ink flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          {pwError && <p className="text-sm text-danger font-medium">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-success font-medium">Password updated successfully.</p>}
          <PasswordInput
            label="Current Password"
            required
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
          />
          <PasswordInput
            label="New Password"
            required
            hint="Minimum 6 characters"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
          />
          <Button type="submit" loading={pwLoading} className="self-start">
            Update Password
          </Button>
        </form>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <p className="font-bold text-ink">{user?.name}</p>
          <p className="text-sm text-muted">{user?.email}</p>
        </div>
        <Button variant="danger" onClick={logout}>
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </Card>
    </div>
  );
}
