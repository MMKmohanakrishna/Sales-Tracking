"use client";

import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Download, TrendingUp } from "lucide-react";
import { useSalesReport, usePaymentsReport, useTopFramesReport } from "@/hooks/useReports";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatMoney, formatMoneyCompact, formatDate, cn } from "@/lib/utils";
import { api } from "@/lib/api";

const rangeOptions = [
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "month", label: "This Month" },
];

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lift px-3 py-2">
      <p className="text-xs text-muted font-medium mb-0.5">{formatDate(point.date)}</p>
      <p className="text-sm font-extrabold text-primary">{formatMoney(point.amount)}</p>
    </div>
  );
}

function downloadCSV(path: string, filename: string) {
  api.get(path, { responseType: "blob" }).then((res) => {
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
}

export default function ReportsPage() {
  const [range, setRange] = useState("7d");
  const { data: sales, isLoading: salesLoading } = useSalesReport(range);
  const { data: payments } = usePaymentsReport();
  const { data: topFrames } = useTopFramesReport();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Reports</h1>
          <p className="text-muted mt-0.5">Understand how your business is doing</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => downloadCSV("/export/customers.csv", "customers.csv")}>
            <Download className="h-4 w-4" /> Customers
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCSV("/export/sales.csv", "sales.csv")}>
            <Download className="h-4 w-4" /> Sales
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCSV("/export/payments.csv", "payments.csv")}>
            <Download className="h-4 w-4" /> Payments
          </Button>
        </div>
      </div>

      {/* Sales summary */}
      <Card>
        <h2 className="font-bold text-ink mb-4">Sales Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-muted mb-1">Today</p>
            <p className="text-xl font-extrabold">{formatMoney(sales?.today)}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">This Week</p>
            <p className="text-xl font-extrabold">{formatMoney(sales?.thisWeek)}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">This Month</p>
            <p className="text-xl font-extrabold">{formatMoney(sales?.thisMonth)}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">All Time</p>
            <p className="text-xl font-extrabold">{formatMoney(sales?.allTime)}</p>
          </div>
        </div>
      </Card>

      {/* Payment summary */}
      <Card>
        <h2 className="font-bold text-ink mb-4">Payment Summary</h2>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-muted mb-1">Collected Today</p>
            <p className="text-xl font-extrabold text-success">{formatMoney(payments?.collectedToday)}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Collected This Month</p>
            <p className="text-xl font-extrabold text-success">{formatMoney(payments?.collectedThisMonth)}</p>
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card>
        <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-ink flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" /> Sales Trend
            </h2>
            {!!sales?.chart?.length && (
              <p className="text-xs text-muted mt-0.5">
                {formatMoney(sales.chart.reduce((sum: number, d: any) => sum + d.amount, 0))} total in this period
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {rangeOptions.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border",
                  range === r.key ? "bg-primary text-white border-primary" : "border-border text-ink/70"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {salesLoading ? (
          <LoadingState label="Loading chart..." />
        ) : !sales?.chart?.length ? (
          <EmptyState emoji="📈" title="No sales in this period yet" />
        ) : (
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sales.chart} barCategoryGap="30%" margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesBarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7A1F3D" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7A1F3D" stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDate(d)}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatMoneyCompact(v)}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#7A1F3D", fillOpacity: 0.06 }} />
                <Bar dataKey="amount" fill="url(#salesBarFill)" radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Top selling frames */}
      <Card>
        <h2 className="font-bold text-ink mb-4">Most Sold Frames</h2>
        {!topFrames?.length ? (
          <p className="text-sm text-muted">No sales yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {topFrames.map((f: any, idx: number) => (
              <div key={f._id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{f.frameName}</p>
                    <p className="text-xs text-muted">{f.godName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{f.quantitySold} sold</p>
                  <p className="text-xs text-muted">{formatMoney(f.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
