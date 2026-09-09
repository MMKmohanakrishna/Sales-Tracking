import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("df_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("df_token");
      localStorage.removeItem("df_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    const message =
      error.response?.data?.message ||
      (error.request && !error.response
        ? "Cannot reach the server. Check your connection and try again."
        : "Something went wrong. Please try again.");
    return Promise.reject(new Error(message));
  }
);

export function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  return promise.then((res) => res.data.data);
}
