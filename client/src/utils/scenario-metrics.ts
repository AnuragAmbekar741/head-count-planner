import type { CostItem, RevenueItem } from "@/data/cost-item";

export interface ScenarioMetrics {
  monthlyBurnRate: number; // Total monthly costs
  monthlyRevenue: number; // Monthly revenue (if provided)
  netBurnRate: number; // Monthly burn - monthly revenue
  annualBurnRate: number; // Total annual costs
  annualRevenue: number; // Total annual revenue (first-year or selected months total)
  runway: number | null; // Months until funding runs out (null if no funding or positive cash flow)
  growthRate: number; // Percentage growth (can be calculated from revenue trends)
}

/**
 * Calculate scenario financial metrics
 */
export function calculateScenarioMetrics(
  costs: CostItem[],
  funding: number | null,
  revenue: number | null, // Keep for backward compatibility, but will be calculated from revenueItems
  selectedMonths?: number[],
  revenueItems?: RevenueItem[] // Add this parameter
): ScenarioMetrics {
  let monthlyBurnRate: number;
  let annualBurnRate: number;
  let monthlyRevenue: number;
  let annualRevenue: number;

  // Helper to calculate first-year value based on startAt/endsAt (same as Pipeline)
  const calculateFirstYearValue = (item: CostItem | RevenueItem): number => {
    if (!item.isActive) return 0;

    // Treat annualValue as annual rate, convert to monthly
    const monthly = item.annualValue / 12;
    const yearStartMonth = 1;
    const yearEndMonth = 12;

    // Calculate active months in first year
    const firstActive = Math.max(yearStartMonth, item.startAt);
    const lastActive =
      item.endsAt !== null ? Math.min(yearEndMonth, item.endsAt) : yearEndMonth;

    // If not active in first year at all
    if (firstActive > yearEndMonth || lastActive < yearStartMonth) {
      return 0;
    }

    const activeMonths = lastActive - firstActive + 1;
    return monthly * activeMonths;
  };

  // Helper to calculate monthly value for selected months (same as DataTable)
  const calculateMonthlyValueForSelectedMonths = (
    item: CostItem | RevenueItem
  ): number => {
    if (!selectedMonths || selectedMonths.length === 0) return 0;
    if (!item.isActive) return 0;

    // Use same logic as DataTable: treat annualValue as annual rate
    // Convert to monthly, then count only active months in selected months
    const monthly = item.annualValue / 12;

    // Count how many of the selected months are within the item's active period
    const activeMonthsInSelection = selectedMonths.filter((month) => {
      // Check if month is after startAt
      if (month < item.startAt) return false;
      // Check if month is before endsAt (or endsAt is null)
      if (item.endsAt !== null && month > item.endsAt) return false;
      return true;
    }).length;

    return monthly * activeMonthsInSelection;
  };

  // Calculate revenue from revenue items if provided, otherwise use scenario revenue
  if (revenueItems && revenueItems.length > 0) {
    if (selectedMonths && selectedMonths.length > 0) {
      // Monthly view: use same logic as DataTable and costs
      const totalRevenueForSelectedMonths = revenueItems
        .filter((rev) => rev.isActive)
        .reduce(
          (sum, rev) => sum + calculateMonthlyValueForSelectedMonths(rev),
          0
        );

      // Total revenue for selected months (not average)
      annualRevenue = totalRevenueForSelectedMonths;
      monthlyRevenue = totalRevenueForSelectedMonths / selectedMonths.length;
    } else {
      // For annual view, use same logic as Pipeline
      const totalFirstYearRevenue = revenueItems
        .filter((rev) => rev.isActive)
        .reduce((sum, rev) => sum + calculateFirstYearValue(rev), 0);

      annualRevenue = totalFirstYearRevenue;
      monthlyRevenue = annualRevenue / 12;
    }
  } else {
    // Fallback to scenario revenue field (backward compatibility)
    monthlyRevenue = revenue ? revenue / 12 : 0;
    annualRevenue = revenue || 0;
  }

  // Calculate costs
  if (selectedMonths && selectedMonths.length > 0) {
    // Monthly view: use same logic as DataTable
    const totalCostForSelectedMonths = costs
      .filter((cost) => cost.isActive)
      .reduce(
        (sum, cost) => sum + calculateMonthlyValueForSelectedMonths(cost),
        0
      );

    // Total cost for selected months (not average)
    annualBurnRate = totalCostForSelectedMonths;
    monthlyBurnRate = totalCostForSelectedMonths / selectedMonths.length;
  } else {
    // For annual view, use same logic as Pipeline
    const totalFirstYearCosts = costs
      .filter((cost) => cost.isActive)
      .reduce((sum, cost) => sum + calculateFirstYearValue(cost), 0);

    annualBurnRate = totalFirstYearCosts;
    monthlyBurnRate = annualBurnRate / 12;
  }

  // Net burn rate = costs - revenue
  const netBurnRate = monthlyBurnRate - monthlyRevenue;

  // Calculate runway: funding / net burn rate
  let runway: number | null = null;
  if (funding && netBurnRate > 0) {
    runway = funding / netBurnRate;
  } else if (funding && netBurnRate <= 0) {
    runway = Infinity;
  }

  // Growth rate calculation - use annual revenue from items or scenario field
  const growthRate =
    annualRevenue > 0 && annualBurnRate > 0
      ? ((annualRevenue - annualBurnRate) / annualBurnRate) * 100
      : 0;

  return {
    monthlyBurnRate,
    monthlyRevenue,
    netBurnRate,
    annualBurnRate,
    annualRevenue,
    runway,
    growthRate,
  };
}

/**
 * Format runway for display
 */
export function formatRunway(runway: number | null): string {
  if (runway === null) return "N/A";
  if (runway === Infinity) return "∞ (Profitable)";
  if (runway < 1) {
    const days = Math.floor(runway * 30);
    return `${days} days`;
  }
  if (runway < 12) {
    return `${Math.round(runway * 10) / 10} months`;
  }
  const years = Math.floor(runway / 12);
  const months = Math.round(runway % 12);
  return months > 0 ? `${years}y ${months}m` : `${years} years`;
}
