import React, { useState, useMemo } from "react";
import { useGetScenarios } from "@/hooks/scenario";
import { useDeleteScenario } from "@/hooks/scenario";
import { useGetScenario } from "@/hooks/scenario";
import { useGetCostsByScenario } from "@/hooks/cost";
import { FolderOpen, Eye, Trash2, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { CreateScenarioModal } from "@/components/modal";
import { DataTable } from "@/components/data-table/DataTable";
import type { CostItem } from "@/data/cost-item";
import { DeleteScenarioModal } from "@/components/modal";
import { ScenarioMetrics } from "@/components/scenario-metrics/ScenarioMetrics";
import { AddCostModal } from "@/components/modal/AddCostModal";
import {
  calculateScenarioMetrics,
  formatRunway,
} from "@/utils/scenario-metrics";
import { formatCurrency } from "@/utils/number-format";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Flame,
} from "lucide-react";
import { useGetCosts } from "@/hooks/cost";
import { useGetRevenuesByScenario } from "@/hooks/revenue";
import type { RevenueResponse } from "@/api/revenue";
import type { RevenueItem } from "@/data/cost-item";
import { useGetRevenues } from "@/hooks/revenue/useGetRevenues";

// Transform CostResponse to CostItem
const transformCostToCostItem = (cost: {
  id: string;
  title: string;
  value: number;
  category: string;
  starts_at: number;
  end_at: number | null;
  freq: string;
  is_active: boolean; // Add this field
  scenario_id: string;
}): CostItem => {
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
    isActive: cost.is_active,
    scenarioId: cost.scenario_id,
  };
};

const transformRevenueToRevenueItem = (
  revenue: RevenueResponse
): RevenueItem => {
  const frequencyMap: Record<string, CostItem["frequency"]> = {
    monthly: "MONTHLY",
    quarterly: "QUARTERLY",
    yearly: "YEARLY",
    annual: "YEARLY",
    one_time: "ONE_TIME",
  };

  return {
    id: revenue.id,
    title: revenue.title,
    category: revenue.category,
    startAt: revenue.starts_at,
    endsAt: revenue.end_at,
    annualValue: revenue.value,
    frequency: frequencyMap[revenue.freq.toLowerCase()] || "MONTHLY",
    isActive: revenue.is_active,
    scenarioId: revenue.scenario_id,
    type: "revenue",
  };
};

const Scenario: React.FC = () => {
  const { data: scenarios, isLoading, error } = useGetScenarios();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    null
  );
  const [scenarioToDelete, setScenarioToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [outlineViewType, setOutlineViewType] = useState<"monthly" | "annual">(
    "annual"
  ); // Add this state
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]); // Add this state
  const deleteScenario = useDeleteScenario();

  // Get selected scenario and costs
  const { data: selectedScenario } = useGetScenario(selectedScenarioId);
  const { data: costs, isLoading: isLoadingCosts } =
    useGetCostsByScenario(selectedScenarioId);
  const { data: revenues, isLoading: isLoadingRevenues } =
    useGetRevenuesByScenario(selectedScenarioId);
  const { data: allCosts } = useGetCosts(); // Fetch all costs
  const { data: allRevenues } = useGetRevenues(); // Fetch all revenues

  // Add helper function to get costs for a scenario
  const getScenarioCosts = (scenarioId: string): CostItem[] => {
    if (!allCosts) return [];
    return allCosts
      .filter((cost) => cost.scenario_id === scenarioId)
      .map(transformCostToCostItem);
  };

  // Add helper function to get revenues for a scenario
  const getScenarioRevenues = (scenarioId: string): RevenueItem[] => {
    if (!allRevenues) return [];
    return allRevenues
      .filter((revenue) => revenue.scenario_id === scenarioId)
      .map(transformRevenueToRevenueItem);
  };

  const costItems = useMemo(() => {
    if (!costs) return [];
    return costs.map(transformCostToCostItem);
  }, [costs]);

  const revenueItems = useMemo(() => {
    if (!revenues) return [];
    return revenues.map(transformRevenueToRevenueItem);
  }, [revenues]);

  const tableItems = useMemo(() => {
    const costItems = costs
      ? costs
          .map(transformCostToCostItem)
          .map((c) => ({ ...c, type: "cost" as const }))
      : [];
    const revenueItems = revenues
      ? revenues.map(transformRevenueToRevenueItem)
      : [];
    return [...costItems, ...revenueItems];
  }, [costs, revenues]);

  const handleDelete = (
    scenarioId: string,
    scenarioName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setScenarioToDelete({ id: scenarioId, name: scenarioName });
  };

  const confirmDelete = () => {
    if (scenarioToDelete) {
      deleteScenario.mutate(scenarioToDelete.id, {
        onSuccess: () => {
          setScenarioToDelete(null);
        },
      });
    }
  };

  const handleView = (scenarioId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedScenarioId(scenarioId);
  };

  const handleCardClick = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
  };

  const handleBack = () => {
    setSelectedScenarioId(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <h3 className="text-destructive font-semibold">Error</h3>
            <CardDescription>
              Failed to load scenarios. Please try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!scenarios || scenarios.length === 0) {
    return (
      <>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <Empty className="w-full max-w-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle>No scenarios yet</EmptyTitle>
              <EmptyDescription>
                Get started by creating your first scenario to organize your
                cost planning.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setIsModalOpen(true)}>
                Create Scenario
              </Button>
            </EmptyContent>
          </Empty>
        </div>
        <CreateScenarioModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      </>
    );
  }

  // Data Table View (when scenario is selected)
  if (selectedScenarioId && selectedScenario) {
    return (
      <>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header with back button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  {selectedScenario.name}
                </h1>
                {selectedScenario.description && (
                  <p className="text-muted-foreground">
                    {selectedScenario.description}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="secondary">
              {new Date(selectedScenario.created_at).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </Badge>
          </div>

          {/* Metrics Section */}
          <ScenarioMetrics
            costs={costItems}
            funding={selectedScenario?.funding || null}
            revenue={selectedScenario?.revenue || null}
            revenueItems={revenueItems} // Use the useMemo variable instead of filtering tableItems
            viewType={outlineViewType} // Add this prop
            selectedMonths={
              outlineViewType === "monthly" ? selectedMonths : undefined
            } // Add this prop
          />

          {/* Data Table */}
          {isLoadingCosts || isLoadingRevenues ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : tableItems.length > 0 ? (
            <DataTable
              data={tableItems}
              outlineViewType={outlineViewType} // Add this prop
              onOutlineViewTypeChange={setOutlineViewType} // Add this prop
              onSelectedMonthsChange={setSelectedMonths} // Add this prop
              scenarioId={selectedScenarioId || undefined} // Add this prop
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-sm text-muted-foreground">
                  No costs or revenues added to this scenario yet.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <CreateScenarioModal open={isModalOpen} onOpenChange={setIsModalOpen} />
        {selectedScenarioId && (
          <AddCostModal
            open={false} // This modal is now handled by DataTable
            onOpenChange={() => {}}
            scenarioId={selectedScenarioId}
          />
        )}
      </>
    );
  }

  // Card View (default)
  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Scenarios</h1>
            <p className="text-muted-foreground">
              Manage your planning scenarios and their associated costs.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>Create Scenario</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const scenarioCosts = getScenarioCosts(scenario.id);
            const scenarioRevenues = getScenarioRevenues(scenario.id);
            const metrics = calculateScenarioMetrics(
              scenarioCosts,
              scenario.funding ? Number(scenario.funding) : null,
              scenario.revenue ? Number(scenario.revenue) : null,
              undefined, // No selectedMonths - use annual view
              scenarioRevenues // Pass revenue items
            );

            return (
              <Card
                key={scenario.id}
                className="hover:shadow-lg transition-all duration-200 group relative cursor-pointer border-2 hover:border-primary/30 h-fit"
                onClick={() => handleCardClick(scenario.id)}
              >
                <CardHeader className="pb-2 pt-3 px-4">
                  {/* Title, Date, and Funding in one row as badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <Badge variant="default" className="text-xs font-semibold">
                      {scenario.name}
                    </Badge>
                    {scenario.funding && (
                      <Badge variant="secondary" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(Number(scenario.funding))}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {new Date(scenario.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </Badge>
                  </div>

                  {/* Description below */}
                  {scenario.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {scenario.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="pt-2 pb-1.5 px-4 space-y-2">
                  {/* Metrics Section */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Annual Burn Rate */}
                    <div className="p-2.5 rounded-md bg-muted/40 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                        Annual Burn
                      </div>
                      <div className="text-sm font-bold">
                        {formatCurrency(metrics.annualBurnRate)}
                      </div>
                    </div>

                    {/* Net Burn Rate */}
                    <div className="p-2.5 rounded-md bg-muted/40 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                        Net Burn
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="text-sm font-bold">
                          {formatCurrency(
                            metrics.annualBurnRate - metrics.annualRevenue
                          )}
                        </div>
                        {metrics.annualBurnRate - metrics.annualRevenue < 0 ? (
                          <Badge
                            variant="default"
                            className="h-4 px-1.5 text-[10px] bg-green-500 hover:bg-green-500"
                          >
                            <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                            Profit
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="h-4 px-1.5 text-[10px]"
                          >
                            <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                            Loss
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Runway */}
                    <div className="p-2.5 rounded-md bg-muted/40 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        Runway
                      </div>
                      <div className="text-sm font-bold">
                        {formatRunway(metrics.runway)}
                      </div>
                    </div>

                    {/* Growth Rate */}
                    <div className="p-2.5 rounded-md bg-muted/40 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                        Growth
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="text-sm font-bold">
                          {metrics.growthRate >= 0 ? "+" : ""}
                          {metrics.growthRate.toFixed(1)}%
                        </div>
                        {metrics.growthRate > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        ) : metrics.growthRate < 0 ? (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {scenarioCosts.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Flame className="h-3 w-3 mr-1" />
                        {scenarioCosts.filter((c) => c.isActive).length} Active
                      </Badge>
                    )}
                    {scenarioRevenues.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Revenue:{" "}
                        {formatCurrency(
                          scenarioRevenues.reduce(
                            (sum, r) => sum + r.annualValue,
                            0
                          )
                        )}
                      </Badge>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-1.5 border-t">
                    <Badge
                      variant="outline"
                      className="gap-0 p-0 border-0 bg-muted/50 w-full"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 rounded-none hover:bg-accent text-xs"
                        onClick={(e) => handleView(scenario.id, e)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 rounded-none hover:bg-accent text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                        onClick={(e) =>
                          handleDelete(scenario.id, scenario.name, e)
                        }
                        disabled={deleteScenario.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <CreateScenarioModal open={isModalOpen} onOpenChange={setIsModalOpen} />

      {/* Delete Confirmation Modal */}
      {scenarioToDelete && (
        <DeleteScenarioModal
          open={!!scenarioToDelete}
          onOpenChange={(open) => !open && setScenarioToDelete(null)}
          scenarioName={scenarioToDelete.name}
          onConfirm={confirmDelete}
          isDeleting={deleteScenario.isPending}
        />
      )}
    </>
  );
};

export default Scenario;
