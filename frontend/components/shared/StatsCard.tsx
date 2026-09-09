import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "secondary";
  delay?: number;
}

const tones: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  secondary: "bg-secondary/10 text-secondary-dark",
};

export function StatsCard({ label, value, sublabel, icon: Icon, tone = "primary", delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-card rounded-2xl border border-border shadow-card p-4 sm:p-5 flex flex-col gap-3"
    >
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-ink tracking-tight">{value}</p>
        <p className="text-sm font-medium text-muted mt-0.5">{label}</p>
        {sublabel && <p className="text-xs text-muted/80 mt-0.5">{sublabel}</p>}
      </div>
    </motion.div>
  );
}
