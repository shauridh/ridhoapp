"use client";

import { useState, useEffect } from "react";
import { loadDashboardConfig, type WidgetConfig } from "@/lib/domain/dashboard-config";
import { HourlyChart } from "./hourly-chart";
import { DailyChart } from "./daily-chart";
import { TopProductsChart } from "./top-products-chart";
import { CategoryChart } from "./category-chart";
import { TransactionTypeChart } from "./transaction-type-chart";
import type { SellerStat, DayTotal, CategoryStat } from "@/lib/domain/report";

interface OrderCount {
  offline: number;
  gojek: number;
  grab: number;
  shopee: number;
}

interface TransactionBreakdown {
  offline: number;
  gojek: number;
  grab: number;
  shopee: number;
}

interface Props {
  hourlyData: number[];
  topProducts: SellerStat[];
  dailyData: DayTotal[];
  prevDailyData: DayTotal[];
  categories: CategoryStat[];
  cashTotal: number;
  qrisTotal: number;
  paymentBreakdown: Record<string, number>;
  transactionBreakdown: TransactionBreakdown;
  prevTransactionBreakdown: TransactionBreakdown;
  orderCount: OrderCount;
  prevOrderCount: OrderCount;
}

export function DashboardCharts({
  hourlyData,
  topProducts,
  dailyData,
  prevDailyData,
  categories,
  transactionBreakdown,
  prevTransactionBreakdown,
  orderCount,
  prevOrderCount,
}: Props) {
  const [config, setConfig] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfig(loadDashboardConfig());
    const handler = () => setConfig(loadDashboardConfig());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const widgets =
    config.length > 0
      ? config
      : ([
          { id: "hourly", title: "Omzet per Jam", visible: true },
          { id: "top_products", title: "Produk Terlaris", visible: true },
          { id: "daily", title: "Tren Omzet Harian", visible: true },
          { id: "category", title: "Omzet per Kategori", visible: true },
          { id: "payment_method", title: "Jenis Transaksi", visible: true },
        ] as WidgetConfig[]);

  const visible = widgets.filter((w) => w.visible);
  const fullWidth = visible.filter((w) => w.id === "hourly");
  const gridItems = visible.filter((w) => w.id !== "hourly");

  const renderChart = (w: WidgetConfig) => {
    switch (w.id) {
      case "hourly":
        return <HourlyChart key={w.id} data={hourlyData} title={w.title} />;
      case "top_products":
        return <TopProductsChart key={w.id} products={topProducts} title={w.title} />;
      case "daily":
        return <DailyChart key={w.id} data={dailyData} prevData={prevDailyData} title={w.title} />;
      case "category":
        return <CategoryChart key={w.id} categories={categories} title={w.title} />;
      case "payment_method":
        return (
          <TransactionTypeChart
            key={w.id}
            orderCount={orderCount}
            prevOrderCount={prevOrderCount}
            transactionBreakdown={transactionBreakdown}
            prevTransactionBreakdown={prevTransactionBreakdown}
            title={w.title}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {fullWidth.map(renderChart)}
      {gridItems.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">{gridItems.map(renderChart)}</div>
      )}
    </div>
  );
}
