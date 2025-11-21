import type { CostItem } from "@/data/cost-item";

export interface ScenarioMetrics {
  monthlyBurnRate: number; // Total monthly costs
  monthlyRevenue: number; // Monthly revenue (if provided)
  netBurnRate: number; // Monthly burn - monthly revenue
  annualBurnRate: number; // Total annual costs
  runway: number | null; // Months until funding runs out (null if no funding or positive cash flow)
  growthRate: number; // Percentage growth (can be calculated from revenue trends)
}

/**
 * Calculate monthly cost for a single cost item
 */
function calculateMonthlyCost(cost: CostItem): number {
  if (!cost.isActive) return 0;

  switch (cost.frequency) {
    case "MONTHLY":
      return cost.annualValue / 12;
    case "QUARTERLY":
      return cost.annualValue / 4;
    case "HALF_YEARLY":
      return cost.annualValue / 2;
    case "YEARLY":
      return cost.annualValue / 12; // Average monthly
    case "ONE_TIME":
      // For one-time costs, amortize over 12 months if in current period
      // Or return 0 if already occurred
      return cost.annualValue / 12; // Simplified: amortize over year
    default:
      return cost.annualValue / 12;
  }
}

/**
 * Calculate monthly cost for a single cost item for a specific month
 */
function calculateCostForMonth(cost: CostItem, month: number): number {
  if (!cost.isActive) return 0;

  // Check if cost has started - if month is before startAt, return 0
  if (month < cost.startAt) return 0;

  // Check if cost has ended - if month is after endsAt, return 0
  if (cost.endsAt !== null && month > cost.endsAt) return 0;

  // Now calculate cost based on frequency
  switch (cost.frequency) {
    case "MONTHLY":
      // Monthly costs are active every month after startAt
      return cost.annualValue / 12;

    case "QUARTERLY": {
      // Quarterly costs occur every 3 months starting from startAt
      // Check if this month is in the same quarter cycle as startAt
      const monthsSinceStart = month - cost.startAt;
      if (monthsSinceStart < 0) return 0;
      // Check if this month is a quarter month (0, 3, 6, 9 months after start)
      return monthsSinceStart % 3 === 0 ? cost.annualValue / 4 : 0;
    }

    case "YEARLY": {
      // Yearly costs occur every 12 months starting from startAt
      const monthsSinceStartYearly = month - cost.startAt;
      if (monthsSinceStartYearly < 0) return 0;
      // Check if this month is exactly 12 months after start (or 0, 12, 24, etc.)
      return monthsSinceStartYearly % 12 === 0 ? cost.annualValue : 0;
    }

    case "ONE_TIME":
      // One-time costs only occur in the exact start month
      return month === cost.startAt ? cost.annualValue : 0;

    default:
      return cost.annualValue / 12;
  }
}

/**
 * Calculate scenario financial metrics
 */
export function calculateScenarioMetrics(
  costs: CostItem[],
  funding: number | null,
  revenue: number | null,
  selectedMonths?: number[] // Add this parameter
): ScenarioMetrics {
  let monthlyBurnRate: number;
  let annualBurnRate: number;

  if (selectedMonths && selectedMonths.length > 0) {
    // Calculate based on selected months
    const totalCostForSelectedMonths = costs
      .filter((cost) => cost.isActive)
      .reduce((sum, cost) => {
        return (
          sum +
          selectedMonths.reduce(
            (monthSum, month) => monthSum + calculateCostForMonth(cost, month),
            0
          )
        );
      }, 0);

    // Average monthly burn rate for selected months
    monthlyBurnRate = totalCostForSelectedMonths / selectedMonths.length;

    // Annualize: multiply by 12 to get annual equivalent
    annualBurnRate = monthlyBurnRate * 12;
  } else {
    // Original calculation (all months)
    monthlyBurnRate = costs
      .filter((cost) => cost.isActive)
      .reduce((sum, cost) => sum + calculateMonthlyCost(cost), 0);

    annualBurnRate = costs
      .filter((cost) => cost.isActive)
      .reduce((sum, cost) => {
        switch (cost.frequency) {
          case "MONTHLY":
            return sum + cost.annualValue;
          case "QUARTERLY":
            return sum + cost.annualValue;
          case "HALF_YEARLY":
            return sum + cost.annualValue;
          case "YEARLY":
            return sum + cost.annualValue;
          case "ONE_TIME":
            return sum + cost.annualValue;
          default:
            return sum + cost.annualValue;
        }
      }, 0);
  }

  // Assume revenue is annual, convert to monthly
  const monthlyRevenue = revenue ? revenue / 12 : 0;

  // Net burn rate = costs - revenue
  const netBurnRate = monthlyBurnRate - monthlyRevenue;

  // Calculate runway: funding / net burn rate
  let runway: number | null = null;
  if (funding && netBurnRate > 0) {
    runway = funding / netBurnRate;
  } else if (funding && netBurnRate <= 0) {
    runway = Infinity;
  }

  // Growth rate calculation
  const growthRate =
    revenue && annualBurnRate > 0
      ? ((revenue - annualBurnRate) / annualBurnRate) * 100
      : 0;

  return {
    monthlyBurnRate,
    monthlyRevenue,
    netBurnRate,
    annualBurnRate,
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
