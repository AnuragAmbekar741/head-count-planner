import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  calculateScenarioMetrics,
  formatRunway,
} from "@/utils/scenario-metrics";
import type { CostItem, RevenueItem } from "@/data/cost-item";
import { formatCurrency } from "@/utils/number-format";
import { MatrixCard } from "@/components/matrix-card";

interface ScenarioMetricsProps {
  costs: CostItem[];
  funding: number | null;
  revenue: number | null;
  revenueItems?: RevenueItem[];
  viewType?: "monthly" | "annual";
  selectedMonths?: number[];
}

export const ScenarioMetrics: React.FC<ScenarioMetricsProps> = ({
  costs,
  funding,
  revenue,
  revenueItems,
  viewType = "annual",
  selectedMonths,
}) => {
  const metrics = calculateScenarioMetrics(
    costs,
    funding,
    revenue,
    viewType === "monthly" ? selectedMonths : undefined,
    revenueItems
  );

  // Calculate totals
  // For annual view: annualBurnRate is first-year total
  // For monthly view: annualBurnRate is total for selected months
  const totalCosts = metrics.annualBurnRate ?? 0;

  // For annual view: annualRevenue is first-year total
  // For monthly view: annualRevenue is total for selected months
  const totalRevenue =
    viewType === "monthly"
      ? (metrics.annualRevenue ?? 0) // Total for selected months
      : (metrics.monthlyRevenue ?? 0) * 12; // Annual projection

  const netBurn =
    viewType === "annual"
      ? (metrics.netBurnRate ?? 0) * 12
      : (metrics.netBurnRate ?? 0);

  return (
    <div className="flex items-stretch gap-4 px-6">
      {/* Total Costs Card */}
      <MatrixCard
        value={formatCurrency(totalCosts)}
        label="Total Costs"
        valueColor="text-red-600"
      />

      {/* Total Revenue Card */}
      <MatrixCard
        value={formatCurrency(totalRevenue)}
        label="Total Revenue"
        valueColor="text-green-600"
      />

      {/* Net Burn Card */}
      <MatrixCard
        value={formatCurrency(Math.abs(netBurn))}
        label="Net Burn"
        valueColor={netBurn < 0 ? "text-green-600" : "text-red-600"}
        badge={
          <Badge
            variant={netBurn < 0 ? "default" : "destructive"}
            className="text-xs"
          >
            {netBurn < 0 ? (
              <>
                <TrendingUp className="h-3 w-3 mr-1" />
                Profitable
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 mr-1" />
                Burning
              </>
            )}
          </Badge>
        }
      />

      {/* Growth Rate Card */}
      <MatrixCard
        value={`${metrics.growthRate >= 0 ? "+" : ""}${metrics.growthRate.toFixed(1)}%`}
        label="Growth Rate"
        valueColor={metrics.growthRate >= 0 ? "text-green-600" : "text-red-600"}
        badge={
          metrics.growthRate > 0 ? (
            <Badge variant="default" className="text-xs bg-green-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              Growth
            </Badge>
          ) : metrics.growthRate < 0 ? (
            <Badge variant="destructive" className="text-xs">
              <TrendingDown className="h-3 w-3 mr-1" />
              Decline
            </Badge>
          ) : undefined
        }
      />

      {/* Runway Card */}
      <MatrixCard value={formatRunway(metrics.runway)} label="Runway" />
    </div>
  );
};
