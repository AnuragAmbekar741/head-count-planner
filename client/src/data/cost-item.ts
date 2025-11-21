export type CostFrequency =
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "YEARLY"
  | "ONE_TIME";
export type CostCategory = "Engineering" | "Office" | "Tools" | string;

export interface CostItem {
  id: string;
  title: string;
  category: CostCategory;
  startAt: number; // month number (1 = first month of plan)
  endsAt: number | null; // last month it's active (null = until end of horizon)
  annualValue: number; // amount per year (always)
  frequency: CostFrequency; // how that annual amount is charged
  isActive: boolean; // Add this field
  scenarioId: string; // which scenario this belongs to
}

export const costs: CostItem[] = [
  {
    id: "c1",
    title: "Senior Eng #1",
    category: "Engineering",
    startAt: 1,
    endsAt: 24,
    annualValue: 180_000,
    frequency: "MONTHLY",
    scenarioId: "scenario-1",
    isActive: true,
  },
  {
    id: "c2",
    title: "CS Manager",
    category: "Engineering",
    startAt: 6,
    endsAt: 24,
    annualValue: 90_000,
    frequency: "MONTHLY",
    scenarioId: "scenario-1",
    isActive: true,
  },
  {
    id: "c3",
    title: "SF Office Lease",
    category: "Office",
    startAt: 1,
    endsAt: null, // until end of horizon
    annualValue: 96_000, // 8k per month * 12
    frequency: "MONTHLY",
    scenarioId: "scenario-1",
    isActive: true,
  },
  {
    id: "c4",
    title: "Annual Software License",
    category: "Tools",
    startAt: 1,
    endsAt: 1,
    annualValue: 12_000,
    frequency: "ONE_TIME",
    scenarioId: "scenario-1",
    isActive: true,
  },
];
