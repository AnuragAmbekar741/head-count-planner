import React, { useState, useMemo } from "react";
import { useGetScenarios } from "@/hooks/scenario";
import { useDeleteScenario } from "@/hooks/scenario";
import { useGetScenario } from "@/hooks/scenario";
import { useGetCostsByScenario } from "@/hooks/cost";
import { FolderOpen, Eye, Pencil, Trash2, ArrowLeft } from "lucide-react";
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
  const deleteScenario = useDeleteScenario();

  // Get selected scenario and costs
  const { data: selectedScenario } = useGetScenario(selectedScenarioId);
  const { data: costs, isLoading: isLoadingCosts } =
    useGetCostsByScenario(selectedScenarioId);

  const costItems = useMemo(() => {
    if (!costs) return [];
    return costs.map(transformCostToCostItem);
  }, [costs]);

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

  const handleEdit = (scenarioId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement edit functionality
    console.log("Edit scenario:", scenarioId);
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

          {/* Data Table */}
          {isLoadingCosts ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : costItems.length > 0 ? (
            <DataTable data={costItems} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-sm text-muted-foreground">
                  No costs added to this scenario yet.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <CreateScenarioModal open={isModalOpen} onOpenChange={setIsModalOpen} />
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
          {scenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className="hover:shadow-lg transition-all duration-200 group relative cursor-pointer"
              onClick={() => handleCardClick(scenario.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold truncate flex-1">
                    {scenario.name}
                  </h3>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {new Date(scenario.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Badge>
                </div>
                {scenario.description && (
                  <CardDescription className="line-clamp-2 mt-2">
                    {scenario.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {/* Hover Actions - Bottom Left in Badge */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-4">
                  <Badge
                    variant="outline"
                    className="gap-0 p-0 border-0 bg-muted/50"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-none hover:bg-accent"
                      onClick={(e) => handleView(scenario.id, e)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-none hover:bg-accent"
                      onClick={(e) => handleEdit(scenario.id, e)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-none hover:bg-accent text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) =>
                        handleDelete(scenario.id, scenario.name, e)
                      }
                      disabled={deleteScenario.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
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
