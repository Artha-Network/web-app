import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  DollarSign,
  Activity,
  CheckCircle,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import PageLayout from "@/components/layouts/PageLayout";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { ChartConfig } from "@/components/ui/chart";

const volumeChartConfig: ChartConfig = {
  count: {
    label: "Deals",
    color: "hsl(215, 85%, 55%)",
  },
};

const valueChartConfig: ChartConfig = {
  total: {
    label: "Value (USDC)",
    color: "hsl(140, 70%, 45%)",
  },
};

const Analytics: React.FC = () => {
  const { volumeByMonth, statusBreakdown, valueTrend, summary, isLoading } =
    useAnalytics();

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  const hasData = summary.totalDeals > 0;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your escrow activity and deal performance.
          </p>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Deals
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalDeals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.activeDeals} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg ${summary.avgDealValue.toLocaleString()} per deal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.successRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.completedDeals} completed deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disputes
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.disputedDeals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalDeals > 0
                  ? `${((summary.disputedDeals / summary.totalDeals) * 100).toFixed(1)}% dispute rate`
                  : "No deals yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {!hasData ? (
          <Card>
            <CardContent className="pt-6 text-center py-16">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Deal Data Yet</h3>
              <p className="text-muted-foreground">
                Create your first escrow deal to see analytics here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Deal Volume by Month */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Deal Volume
                  </CardTitle>
                  <CardDescription>Number of deals created per month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={volumeChartConfig} className="h-[300px] w-full">
                    <BarChart data={volumeByMonth} accessibilityLayer>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Status Breakdown Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Status Breakdown
                  </CardTitle>
                  <CardDescription>Distribution of deal statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={Object.fromEntries(
                      statusBreakdown.map((s) => [
                        s.status,
                        { label: s.status, color: s.fill },
                      ])
                    )}
                    className="h-[300px] w-full"
                  >
                    <PieChart accessibilityLayer>
                      <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                      <Pie
                        data={statusBreakdown}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={2}
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {statusBreakdown.map((entry) => (
                          <Cell key={entry.status} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Value Trend - Full Width */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Value Trend
                </CardTitle>
                <CardDescription>
                  Total USDC volume transacted per month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={valueChartConfig} className="h-[300px] w-full">
                  <LineChart data={valueTrend} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="var(--color-total)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Analytics;
