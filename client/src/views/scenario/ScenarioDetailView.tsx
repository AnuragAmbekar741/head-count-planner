import React, { useMemo } from "react";
import { useGetScenario } from "@/hooks/scenario";
import { useGetCostsByScenario } from "@/hooks/cost";
import { BaseModal } from "@/components/base-modal/BaseModal";
import { DataTable } from "@/components/data-table/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CostItem } from "@/data/cost-item";

interface ScenarioDetailViewProps {
  scenarioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Transform CostResponse to CostItem
const transformCostToCostItem = (cost: {
  id: string;
  title: string;
  value: number;
  category: string;
  starts_at: number;
  end_at: number | null;
  freq: string;
  scenario_id: string;
}): CostItem => {
  // Map backend frequency to frontend frequency
  const frequencyMap: Record<string, CostItem["frequency"]> = {
    monthly: "MONTHLY",
    quarterly: "QUARTERLY",
    yearly: "YEARLY",
    annual: "YEARLY",
    one_time: "ONE_TIME",
  };

  return {
    id: cost.id,
    title: cost.title,
    category: cost.category,
    startAt: cost.starts_at,
    endsAt: cost.end_at,
    annualValue: cost.value,
    frequency: frequencyMap[cost.freq.toLowerCase()] || "MONTHLY",
    scenarioId: cost.scenario_id,
  };
};

export const ScenarioDetailView: React.FC<ScenarioDetailViewProps> = ({
  scenarioId,
  open,
  onOpenChange,
}) => {
  const { data: scenario, isLoading: isLoadingScenario } =
    useGetScenario(scenarioId);
  const { data: costs, isLoading: isLoadingCosts } =
    useGetCostsByScenario(scenarioId);

  const costItems = useMemo(() => {
    if (!costs) return [];
    return costs.map(transformCostToCostItem);
  }, [costs]);

  const isLoading = isLoadingScenario || isLoadingCosts;

  if (isLoading) {
    return (
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Scenario Details"
        submitLabel="Close"
        onSubmit={() => onOpenChange(false)}
      >
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </BaseModal>
    );
  }

  if (!scenario) {
    return (
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Error"
        submitLabel="Close"
        onSubmit={() => onOpenChange(false)}
      >
        <p className="text-destructive">
          Failed to load scenario details. Please try again.
        </p>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={scenario.name}
      description={scenario.description || "Scenario details and costs"}
      submitLabel="Close"
      onSubmit={() => onOpenChange(false)}
      className="sm:max-w-6xl"
    >
      <div className="space-y-6">
        {/* Scenario Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
            <Badge variant="outline">{scenario.name}</Badge>
          </div>
          {scenario.description && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">
                Description
              </h3>
              <p className="text-sm">{scenario.description}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Created
            </h3>
            <Badge variant="secondary">
              {new Date(scenario.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Costs Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Costs</h3>
            <Badge variant="secondary">
              {costItems.length} {costItems.length === 1 ? "item" : "items"}
            </Badge>
          </div>
          {costItems.length > 0 ? (
            <DataTable data={costItems} />
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No costs added to this scenario yet.
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};
