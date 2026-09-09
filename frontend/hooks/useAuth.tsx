"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("df_user") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("df_token") : null;
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore corrupt storage
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    const { token, user: loggedInUser } = res.data.data;
    localStorage.setItem("df_token", token);
    localStorage.setItem("df_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    router.push("/dashboard");
  }

  function logout() {
    localStorage.removeItem("df_token");
    localStorage.removeItem("df_user");
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
