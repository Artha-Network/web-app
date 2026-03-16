import { useMemo } from "react";
import { useMyDeals } from "@/hooks/useDeals";
import {
  computeVolumeByMonth,
  computeStatusBreakdown,
  computeValueTrend,
  computeSummaryStats,
} from "@/utils/analytics";

export function useAnalytics() {
  const { data, isLoading } = useMyDeals({ pageSize: 9999 });
  const deals = data?.deals ?? [];

  const volumeByMonth = useMemo(() => computeVolumeByMonth(deals), [deals]);
  const statusBreakdown = useMemo(() => computeStatusBreakdown(deals), [deals]);
  const valueTrend = useMemo(() => computeValueTrend(deals), [deals]);
  const summary = useMemo(() => computeSummaryStats(deals), [deals]);

  return {
    volumeByMonth,
    statusBreakdown,
    valueTrend,
    summary,
    isLoading,
    totalDeals: data?.total ?? 0,
  };
}
