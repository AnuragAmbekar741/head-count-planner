import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import {
  calculateScenarioMetrics,
  formatRunway,
} from "@/utils/scenario-metrics";
import type { CostItem, RevenueItem } from "@/data/cost-item";
import { formatCurrency } from "@/utils/number-format";

interface ScenarioMetricsProps {
  costs: CostItem[];
  funding: number | null;
  revenue: number | null; // Keep for backward compatibility
  revenueItems?: RevenueItem[]; // Add this prop
  viewType?: "monthly" | "annual";
  selectedMonths?: number[];
}

export const ScenarioMetrics: React.FC<ScenarioMetricsProps> = ({
  costs,
  funding,
  revenue,
  revenueItems, // Add this prop
  viewType = "annual",
  selectedMonths,
}) => {
  const metrics = calculateScenarioMetrics(
    costs,
    funding,
    revenue,
    viewType === "monthly" ? selectedMonths : undefined,
    revenueItems // Pass revenue items
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Burn Rate Card */}
      <Card>
        <CardHeader className="pb-0.5 pt-2 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {viewType === "monthly" ? "Monthly Burn Rate" : "Annual Burn Rate"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-1 pb-2">
          <div className="text-2xl font-bold">
            {formatCurrency(
              viewType === "monthly"
                ? metrics.monthlyBurnRate
                : metrics.annualBurnRate
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {viewType === "monthly" ? (
              <>{formatCurrency(metrics.annualBurnRate)} annually</>
            ) : (
              <>{formatCurrency(metrics.monthlyBurnRate)} monthly</>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Net Burn Rate */}
      <Card>
        <CardHeader className="pb-0.5 pt-2 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Burn Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-1 pb-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {formatCurrency(
                viewType === "monthly"
                  ? metrics.netBurnRate
                  : metrics.netBurnRate * 12
              )}
            </div>
            {metrics.netBurnRate < 0 ? (
              <Badge variant="default" className="bg-green-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                Profitable
              </Badge>
            ) : (
              <Badge variant="destructive">
                <TrendingDown className="h-3 w-3 mr-1" />
                Burning
              </Badge>
            )}
          </div>
          {revenue && (
            <div className="text-xs text-muted-foreground mt-1">
              Revenue:{" "}
              {formatCurrency(
                viewType === "monthly"
                  ? metrics.monthlyRevenue
                  : metrics.monthlyRevenue * 12
              )}
              {viewType === "monthly" ? "/mo" : "/yr"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Runway */}
      <Card>
        <CardHeader className="pb-0.5 pt-2 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Runway
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-1 pb-2">
          <div className="text-2xl font-bold">
            {formatRunway(metrics.runway)}
          </div>
          {funding && (
            <div className="text-xs text-muted-foreground mt-1">
              Funding: {formatCurrency(funding)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Growth Rate */}
      <Card>
        <CardHeader className="pb-0.5 pt-2 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Growth Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-1 pb-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {metrics.growthRate >= 0 ? "+" : ""}
              {metrics.growthRate.toFixed(1)}%
            </div>
            {metrics.growthRate > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {revenue && metrics.annualBurnRate > 0
              ? "Revenue vs Costs"
              : "No revenue data"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
