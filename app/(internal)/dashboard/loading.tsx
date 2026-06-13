import { ChartSkeleton } from "@/components/ui/chart-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <ChartSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
