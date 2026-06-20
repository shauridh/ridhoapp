"use client";

import { useState, useEffect } from "react";
import { loadDashboardConfig, type WidgetConfig } from "@/lib/domain/dashboard-config";
import { HourlyChart } from "./hourly-chart";
import { DailyChart } from "./daily-chart";
import { TopProductsChart } from "./top-products-chart";
import { CategoryChart } from "./category-chart";
import { PaymentMethodChart } from "./payment-method-chart";
import type { SellerStat, DayTotal, CategoryStat } from "@/lib/domain/report";

interface Props {
  hourlyData: number[];
  topProducts: SellerStat[];
  dailyData: DayTotal[];
  prevDailyData: DayTotal[];
  categories: CategoryStat[];
  cashTotal: number;
  qrisTotal: number;
}

export function DashboardCharts({
  hourlyData,
  topProducts,
  dailyData,
  prevDailyData,
  categories,
  cashTotal,
  qrisTotal,
}: Props) {
  const [config, setConfig] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfig(loadDashboardConfig());

    // Re-load config saat setting berubah (localStorage event dari tab lain)
    const handler = () => setConfig(loadDashboardConfig());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Sebelum config loaded dari localStorage, render default order
  const widgets =
    config.length > 0
      ? config
      : ([
          { id: "hourly", title: "Omzet per Jam", visible: true },
          { id: "top_products", title: "Produk Terlaris", visible: true },
          { id: "daily", title: "Tren Omzet Harian", visible: true },
          { id: "category", title: "Omzet per Kategori", visible: true },
          { id: "payment_method", title: "Metode Pembayaran", visible: true },
        ] as WidgetConfig[]);

  const visible = widgets.filter((w) => w.visible);

  // Pisahkan menjadi fullwidth dan grid-2
  // hourly selalu fullwidth, sisanya berpasangan dalam grid 2 kolom
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
        return <PaymentMethodChart key={w.id} cash={cashTotal} qris={qrisTotal} title={w.title} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Full-width charts */}
      {fullWidth.map(renderChart)}

      {/* Grid charts: 2 kolom di desktop */}
      {gridItems.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">{gridItems.map(renderChart)}</div>
      )}
    </div>
  );
}
