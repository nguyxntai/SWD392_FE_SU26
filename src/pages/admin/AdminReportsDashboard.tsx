import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, BarChart3, CalendarDays, PackageSearch, ReceiptText, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { getApiErrorMessage } from "@/services/apiError";
import { getLowStockReport, getRevenueReport, getTopProductsReport } from "@/services/reportService";
import { LowStockReportItem, ReportPeriod, RevenueReport, TopProductReportItem } from "@/types/report";
import { formatVnd } from "@/utils/format";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function AdminReportsDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [period, setPeriod] = useState<ReportPeriod>("today");
  const [fromDate, setFromDate] = useState(todayIso());
  const [toDate, setToDate] = useState(todayIso());
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductReportItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    if (period === "range" && (!fromDate || !toDate)) {
      toast.error("Please select date range");
      return;
    }

    setLoading(true);
    const range = period === "range" ? { from: fromDate, to: toDate } : undefined;
    const [revenueResult, topProductsResult, lowStockResult] = await Promise.allSettled([
      getRevenueReport(period, range),
      getTopProductsReport(period, range),
      getLowStockReport(),
    ]);

    if (revenueResult.status === "fulfilled") {
      setRevenue(revenueResult.value);
    } else {
      toast.error(getApiErrorMessage(revenueResult.reason, "Could not load revenue report"));
    }

    if (topProductsResult.status === "fulfilled") {
      setTopProducts(topProductsResult.value);
    } else {
      toast.error(getApiErrorMessage(topProductsResult.reason, "Could not load top products report"));
    }

    if (lowStockResult.status === "fulfilled") {
      setLowStock(lowStockResult.value);
    } else {
      toast.error(getApiErrorMessage(lowStockResult.reason, "Could not load low stock report"));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const maxTopRevenue = Math.max(...topProducts.map((item) => item.revenue || 0), 0);

  const managementTabs = [
    { label: "Products", path: "/admin/products" },
    { label: "Categories", path: "/admin/categories" },
    { label: "Inventory", path: "/admin/inventory" },
    { label: "Reports", path: "/admin/reports" },
  ];

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <Navigation />

      <main className="container mx-auto px-4 pt-24">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-primary">
              <BarChart3 className="h-8 w-8" />
              Reports Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">Revenue, top products, and low stock reports</p>
          </div>

          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-border w-full md:w-auto">
            {managementTabs.map((tab) => (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex-1 md:flex-none px-5 py-2 rounded-lg font-medium transition-all ${
                  location.pathname === tab.path
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {([
                ["today", "Today"],
                ["month", "This Month"],
                ["range", "Custom Range"],
              ] as Array<[ReportPeriod, string]>).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`rounded-xl px-5 py-3 font-bold transition-colors ${
                    period === value
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {period === "range" && (
                <>
                  <label className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-transparent outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-transparent outline-none"
                    />
                  </label>
                </>
              )}
              <button
                onClick={loadReports}
                disabled={loading}
                className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Apply"}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReportCard
            title="Paid Orders"
            value={(revenue?.paidOrderCount ?? 0).toLocaleString()}
            icon={<ReceiptText className="h-6 w-6" />}
          />
          <ReportCard title="Gross Revenue" value={formatVnd(revenue?.grossRevenue)} icon={<TrendingUp className="h-6 w-6" />} />
          <ReportCard title="Discount Total" value={formatVnd(revenue?.discountTotal)} icon={<PackageSearch className="h-6 w-6" />} />
          <ReportCard title="Net Revenue" value={formatVnd(revenue?.netRevenue)} icon={<BarChart3 className="h-6 w-6" />} highlight />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-border bg-white shadow-sm">
            <div className="border-b border-border p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-primary">
                <TrendingUp className="h-5 w-5" />
                Top Products
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider">Sold</th>
                    <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                        No top product data
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((item) => {
                      const width = maxTopRevenue > 0 ? `${Math.max(8, ((item.revenue || 0) / maxTopRevenue) * 100)}%` : "8%";
                      return (
                        <tr key={item.productId || item.productName}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-primary">{item.productName}</div>
                            <div className="mt-2 h-2 rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width }} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold">{item.quantitySold ?? 0}</td>
                          <td className="px-6 py-4 text-right font-bold">{formatVnd(item.revenue)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-white shadow-sm">
            <div className="border-b border-border p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-primary">
                <AlertTriangle className="h-5 w-5" />
                Low Stock
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider">Min</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lowStock.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                        No low stock products
                      </td>
                    </tr>
                  ) : (
                    lowStock.map((item) => (
                      <tr key={item.productId || item.barcode || item.productName}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-primary">{item.productName}</div>
                          {item.barcode && <div className="font-mono text-xs text-muted-foreground">{item.barcode}</div>}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-destructive">{item.quantity ?? 0}</td>
                        <td className="px-6 py-4 text-right font-semibold">{item.minStockLevel ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ReportCard({
  title,
  value,
  icon,
  highlight = false,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-white p-5 shadow-sm ${highlight ? "ring-1 ring-primary/20" : ""}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-black text-primary">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      </div>
    </div>
  );
}
