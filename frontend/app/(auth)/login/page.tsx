"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setServerError("");
    try {
      await login(values.email, values.password);
    } catch (err: any) {
      setServerError(err.message || "Invalid email or password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-white font-extrabold text-2xl shadow-lift mb-4">
            DF
          </div>
          <h1 className="text-2xl font-extrabold text-ink">AbhiReka</h1>
          <p className="text-muted text-sm mt-1">Lightings and Photo Frames</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-card border border-border rounded-2xl shadow-card p-6 flex flex-col gap-4"
        >
          <h2 className="text-lg font-bold text-ink mb-1">Owner Login</h2>

          {serverError && (
            <div className="flex items-center gap-2 bg-danger/10 text-danger text-sm font-medium rounded-xl px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            autoComplete="username"
            placeholder="owner@divineframes.local"
            error={errors.email?.message}
            {...register("email")}
          />
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <Button type="submit" size="lg" className="w-full mt-2" loading={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          Contact your administrator if you don&apos;t have login access.
        </p>
      </motion.div>
    </div>
  );
}
