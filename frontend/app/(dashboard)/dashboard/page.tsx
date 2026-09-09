"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Wallet,
  Users,
  ImageIcon,
  PlusCircle,
  UserPlus,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { useDashboardReport } from "@/hooks/useReports";
import { StatsCard } from "@/components/shared/StatsCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/Card";
import { formatMoney, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

function greeting() {
  const hour = new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" });
  const h = parseInt(hour);
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardReport();
  const { user } = useAuth();

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
          {greeting()} 👋
        </h1>
        <p className="text-muted mt-1">
          Welcome back to AbhiReka{user?.name ? `, ${user.name}` : ""} · {today}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/sales/new"
          className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-5 font-bold text-lg shadow-lift hover:bg-primary-dark transition-colors"
        >
          <PlusCircle className="h-6 w-6" /> New Sale
        </Link>
        <Link
          href="/customers?add=1"
          className="flex flex-col items-center justify-center gap-1.5 bg-card border border-border rounded-2xl py-4 font-semibold text-sm hover:bg-black/5"
        >
          <UserPlus className="h-5 w-5 text-primary" /> Add Customer
        </Link>
        <Link
          href="/frames?add=1"
          className="flex flex-col items-center justify-center gap-1.5 bg-card border border-border rounded-2xl py-4 font-semibold text-sm hover:bg-black/5"
        >
          <ImageIcon className="h-5 w-5 text-primary" /> Add Frame
        </Link>
        <Link
          href="/outstanding"
          className="flex flex-col items-center justify-center gap-1.5 bg-card border border-border rounded-2xl py-4 font-semibold text-sm hover:bg-black/5"
        >
          <CreditCard className="h-5 w-5 text-primary" /> Record Payment
        </Link>
      </div>

      {isLoading ? (
        <LoadingState label="Loading dashboard..." />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <StatsCard
              label="Today's Sales"
              value={formatMoney(data?.todaySales?.amount)}
              sublabel={`${data?.todaySales?.count || 0} sales today`}
              icon={IndianRupee}
              tone="primary"
            />
            <StatsCard
              label="Collected Today"
              value={formatMoney(data?.collectedToday)}
              sublabel="Received today"
              icon={Wallet}
              tone="success"
              delay={0.05}
            />
            <StatsCard
              label="Pending Amount"
              value={formatMoney(data?.totalOutstanding)}
              sublabel="From customers"
              icon={CreditCard}
              tone="danger"
              delay={0.1}
            />
            <StatsCard
              label="Total Customers"
              value={String(data?.totalCustomers || 0)}
              sublabel="Registered customers"
              icon={Users}
              tone="secondary"
              delay={0.15}
            />
            <StatsCard
              label="Frames Sold"
              value={String(data?.framesSoldThisMonth || 0)}
              sublabel="This month"
              icon={ImageIcon}
              tone="primary"
              delay={0.2}
            />
          </div>

          {/* Money to collect */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-danger" /> Money to Collect
                </h2>
                <Link href="/outstanding" className="text-primary text-sm font-semibold flex items-center gap-0.5">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              {!data?.topOutstanding?.length ? (
                <EmptyState emoji="🎉" title="No pending payments" description="All customers are fully paid." />
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {data.topOutstanding.map((c: any) => (
                    <Link
                      key={c._id}
                      href={`/customers/${c._id}`}
                      className="flex items-center justify-between py-3 hover:bg-black/5 -mx-2 px-2 rounded-lg"
                    >
                      <span className="font-semibold text-ink">{c.name}</span>
                      <span className="text-danger font-bold">{formatMoney(c.totalPending)} pending</span>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Recent sales */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ink">Recent Sales</h2>
                <Link href="/sales" className="text-primary text-sm font-semibold flex items-center gap-0.5">
                  View All Sales <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              {!data?.recentSales?.length ? (
                <EmptyState
                  emoji="🖼️"
                  title="No sales recorded yet"
                  description="Record your first sale to see it here."
                  action={
                    <Link href="/sales/new" className="text-primary font-semibold">
                      + New Sale
                    </Link>
                  }
                />
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {data.recentSales.map((s: any) => (
                    <Link
                      key={s._id}
                      href={`/sales/${s._id}`}
                      className="flex items-center justify-between py-3 hover:bg-black/5 -mx-2 px-2 rounded-lg gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{s.customerId?.name || "Customer"}</p>
                        <p className="text-xs text-muted truncate">
                          {s.items?.map((i: any) => i.frameName).join(", ")} · {formatDate(s.saleDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-ink">{formatMoney(s.totalAmount)}</span>
                        <StatusBadge status={s.paymentStatus} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
