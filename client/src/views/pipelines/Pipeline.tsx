import React, { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, GripVertical, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateScenarioModal } from "@/components/modal";
import { formatCurrency } from "@/utils/number-format";
import { useGetScenarios } from "@/hooks/scenario";
import { useGetCostsByScenario } from "@/hooks/cost";
import { useGetRevenuesByScenario } from "@/hooks/revenue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUpdateCost } from "@/hooks/cost";
import { useUpdateRevenue } from "@/hooks/revenue";
import { MatrixCard } from "@/components/matrix-card";

// Update PipelineItem to match TableItem structure:
interface PipelineItem {
  id: string;
  title: string;
  type: "cost" | "revenue";
  amount: number; // monthly amount
  category?: string | null;
  startAt: number; // month number
  endsAt: number | null;
  frequency: string;
  isActive: boolean;
}

interface Stage {
  id: string;
  name: string;
  items: PipelineItem[];
}

interface StageMetrics {
  totalCosts: number;
  totalRevenue: number;
  netBurn: number;
  growthRate: number;
}

interface StageWithMetrics extends Stage {
  metrics: StageMetrics;
  cumulativeBurn: number;
}

// Helper to get stage from month number
const getStageFromMonth = (
  month: number,
  viewType: "quarterly" | "monthly"
): string => {
  if (viewType === "quarterly") {
    if (month >= 1 && month <= 3) return "q1";
    if (month >= 4 && month <= 6) return "q2";
    if (month >= 7 && month <= 9) return "q3";
    if (month >= 10 && month <= 12) return "q4";
    // For months beyond 12, calculate which quarter
    const quarter = Math.ceil((month % 12 || 12) / 3);
    return `q${quarter}`;
  } else {
    // Monthly view
    const monthNames = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const monthIndex = (month - 1) % 12;
    return monthNames[monthIndex];
  }
};

// Helper to get month from stage
const getMonthFromStage = (
  stageId: string,
  viewType: "quarterly" | "monthly"
): number => {
  if (viewType === "quarterly") {
    const quarterMap: Record<string, number> = {
      q1: 1,
      q2: 4,
      q3: 7,
      q4: 10,
    };
    return quarterMap[stageId] || 1;
  } else {
    const monthMap: Record<string, number> = {
      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      may: 5,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      oct: 10,
      nov: 11,
      dec: 12,
    };
    return monthMap[stageId] || 1;
  }
};

// Generate stages based on view type
const generateStages = (viewType: "quarterly" | "monthly"): Stage[] => {
  if (viewType === "quarterly") {
    return [
      { id: "q1", name: "Q1", items: [] },
      { id: "q2", name: "Q2", items: [] },
      { id: "q3", name: "Q3", items: [] },
      { id: "q4", name: "Q4", items: [] },
    ];
  } else {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return monthNames.map((name) => ({
      id: name.toLowerCase(),
      name,
      items: [],
    }));
  }
};

// Draggable Item Component
function DraggableItem({ item }: { item: PipelineItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.3 : 1,
    pointerEvents: isDragging ? ("none" as const) : ("auto" as const),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2 cursor-grab active:cursor-grabbing">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2">
            {/* Title */}
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-sm line-clamp-2">
                {item.title}
              </span>
            </div>

            {/* Value */}
            <div>
              <Badge
                variant={item.type === "revenue" ? "default" : "secondary"}
                className={`text-sm font-semibold w-fit ${
                  item.type === "revenue"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500/10 text-red-600"
                }`}
              >
                {item.type === "revenue" ? "+" : "-"}$
                {item.amount.toLocaleString()}
              </Badge>
            </div>

            {/* Category */}
            {item.category && (
              <div>
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Stage Column Component
function StageColumn({
  stage,
  items,
  cumulativeBurn,
  funding,
  metrics, // Add this prop
}: {
  stage: StageWithMetrics;
  items: PipelineItem[];
  cumulativeBurn: number;
  funding: number;
  metrics?: {
    totalCosts: number;
    totalRevenue: number;
    netBurn: number;
    growthRate: number;
  };
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  // Use provided metrics or calculate on the fly
  const stageMetrics = metrics || calculateStageMetrics(items);
  const { netBurn } = stageMetrics;
  const isProfitable = netBurn < 0;

  // Calculate runway (months remaining) based on cumulative burn
  const monthlyCumulativeBurn = cumulativeBurn > 0 ? cumulativeBurn : 0;
  const runway =
    monthlyCumulativeBurn > 0 ? funding / monthlyCumulativeBurn : null;

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] rounded-xl border-2 p-5 bg-card ${
        isOver ? "border-primary bg-primary/10" : "border-border"
      }`}
    >
      <CardHeader className="p-0">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-xl font-bold">{stage.name}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Badge>
        </div>

        {/* Metrics - Net Burn and Cumulative Burn */}
        <div className="space-y-3">
          {/* Net Burn Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Net Burn
            </span>
            <Badge
              variant={isProfitable ? "default" : "destructive"}
              className={`text-xs font-semibold ${
                isProfitable ? "bg-green-500 hover:bg-green-600" : ""
              }`}
            >
              {isProfitable ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {formatCurrency(Math.abs(netBurn))}
            </Badge>
          </div>

          {/* Cumulative Burn Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Cumulative
              </span>
              {runway && runway < 24 && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  {runway.toFixed(1)}m runway
                </Badge>
              )}
            </div>
            <Badge
              variant={cumulativeBurn > 0 ? "destructive" : "default"}
              className={`text-xs font-semibold ${
                cumulativeBurn <= 0 ? "bg-green-500 hover:bg-green-600" : ""
              }`}
            >
              {formatCurrency(Math.abs(cumulativeBurn))}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Add Separator between metrics and cards */}
      <Separator className="my-4" />

      <CardContent className="p-0">
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12 border-2 border-dashed rounded-lg bg-muted/20">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-dashed flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span>Drop items here</span>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}

// Unassigned Panel Component
function UnassignedPanel({ items }: { items: PipelineItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 rounded-xl border-2 border-dashed p-5 bg-muted/30 ${
        isOver ? "border-primary bg-primary/10" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <CardTitle className="text-base font-bold">Unassigned</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Drag items to stages
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {items.length}
        </Badge>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12 border-2 border-dashed rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-dashed flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span>No unassigned items</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const calculateStageMetrics = (
  items: PipelineItem[]
): {
  totalCosts: number;
  totalRevenue: number;
  netBurn: number;
  growthRate: number;
} => {
  const totalCosts = items
    .filter((item) => item.type === "cost")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalRevenue = items
    .filter((item) => item.type === "revenue")
    .reduce((sum, item) => sum + item.amount, 0);

  const netBurn = totalCosts - totalRevenue;
  const growthRate =
    totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0;

  return { totalCosts, totalRevenue, netBurn, growthRate };
};

const Pipeline: React.FC = () => {
  // State
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    null
  );
  const [viewType, setViewType] = useState<"quarterly" | "monthly">(
    "quarterly"
  );
  const [stages, setStages] = useState<StageWithMetrics[]>(() => {
    const initialStages = generateStages("quarterly");
    return initialStages.map((stage) => ({
      ...stage,
      metrics: calculateStageMetrics([]),
      cumulativeBurn: 0,
    }));
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch scenarios
  const { data: scenarios } = useGetScenarios();

  // Fetch costs and revenues for selected scenario
  const { data: costs } = useGetCostsByScenario(selectedScenarioId);
  const { data: revenues } = useGetRevenuesByScenario(selectedScenarioId);

  // Transform costs and revenues to PipelineItems
  const allItems = React.useMemo(() => {
    const items: PipelineItem[] = [];

    if (costs) {
      costs.forEach((cost) => {
        items.push({
          id: cost.id,
          title: cost.title,
          type: "cost",
          amount: parseFloat(cost.value.toString()) / 12, // Convert annual to monthly
          category: cost.category,
          startAt: cost.starts_at,
          endsAt: cost.end_at,
          frequency: cost.freq,
          isActive: cost.is_active,
        });
      });
    }

    if (revenues) {
      revenues.forEach((revenue) => {
        items.push({
          id: revenue.id,
          title: revenue.title,
          type: "revenue",
          amount: parseFloat(revenue.value.toString()) / 12, // Convert annual to monthly
          category: revenue.category,
          startAt: revenue.starts_at,
          endsAt: revenue.end_at,
          frequency: revenue.freq,
          isActive: revenue.is_active,
        });
      });
    }

    return items;
  }, [costs, revenues]);

  // Distribute items to stages based on startAt
  React.useEffect(() => {
    const newStages: StageWithMetrics[] = generateStages(viewType).map(
      (stage) => ({
        ...stage,
        items: [] as PipelineItem[],
        metrics: calculateStageMetrics([]),
        cumulativeBurn: 0,
      })
    );

    allItems.forEach((item) => {
      if (!item.isActive) return;

      const stageId = getStageFromMonth(item.startAt, viewType);
      const stage = newStages.find((s) => s.id === stageId);

      if (stage) {
        stage.items.push(item);
      }
    });

    // Calculate cumulative burn for each stage
    let cumulativeBurn = 0;
    newStages.forEach((stage) => {
      const metrics = calculateStageMetrics(stage.items);
      cumulativeBurn += metrics.netBurn;
      stage.metrics = metrics;
      stage.cumulativeBurn = cumulativeBurn;
    });

    setStages(newStages);
  }, [allItems, viewType]);

  // Get selected scenario
  const selectedScenario = scenarios?.find((s) => s.id === selectedScenarioId);

  // Calculate totals
  const totals = React.useMemo(() => {
    const totalCosts = allItems
      .filter((item) => item.type === "cost" && item.isActive)
      .reduce((sum, item) => sum + item.amount * 12, 0); // Annual cost

    const totalRevenue = allItems
      .filter((item) => item.type === "revenue" && item.isActive)
      .reduce((sum, item) => sum + item.amount * 12, 0); // Annual revenue

    const netBurn = totalCosts - totalRevenue;
    const growthRate =
      totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0;

    // Calculate runway
    const monthlyNetBurn = netBurn / 12;
    let runway: number | null = null;
    const funding = selectedScenario?.funding
      ? parseFloat(selectedScenario.funding.toString())
      : 0;

    if (funding && monthlyNetBurn > 0) {
      runway = funding / monthlyNetBurn;
    } else if (funding && monthlyNetBurn <= 0) {
      runway = Infinity;
    }

    return {
      totalCosts,
      totalRevenue,
      netBurn,
      growthRate,
      runway,
    };
  }, [allItems, selectedScenario]);

  // Update view type and regenerate stages
  const handleViewTypeChange = (value: "quarterly" | "monthly") => {
    setViewType(value);
    const newStages: StageWithMetrics[] = generateStages(value).map(
      (stage) => ({
        ...stage,
        metrics: calculateStageMetrics([]),
        cumulativeBurn: 0,
      })
    );
    setStages(newStages);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduce from 8 to 5 for quicker activation
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const updateCostMutation = useUpdateCost();
  const updateRevenueMutation = useUpdateRevenue();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !selectedScenarioId) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the item being dragged
    let item: PipelineItem | undefined;
    let sourceStageId: string | null = null;

    // Check all stages for the item
    for (const stage of stages) {
      item = stage.items.find((i) => i.id === activeId);
      if (item) {
        sourceStageId = stage.id;
        break;
      }
    }

    // If not found in stages, check unassigned (inactive items)
    if (!item) {
      item = allItems.find((i) => i.id === activeId && !i.isActive);
      if (item) {
        sourceStageId = "unassigned";
      }
    }

    if (!item) return;

    // If dropped on the same stage or unassigned, do nothing
    if (overId === sourceStageId || overId === "unassigned") {
      return;
    }

    // Calculate new starts_at based on the target stage
    const newStartMonth = getMonthFromStage(overId, viewType);

    // Update the item via API
    if (item.type === "cost") {
      updateCostMutation.mutate(
        {
          costId: item.id,
          data: {
            starts_at: newStartMonth,
          },
        },
        {
          onSuccess: () => {
            // The query will automatically refetch and update the UI
            console.log(`✅ Cost moved to ${overId} (month ${newStartMonth})`);
          },
          onError: (error) => {
            console.error("Failed to update cost:", error);
          },
        }
      );
    } else if (item.type === "revenue") {
      updateRevenueMutation.mutate(
        {
          revenueId: item.id,
          data: {
            starts_at: newStartMonth,
          },
        },
        {
          onSuccess: () => {
            console.log(
              `✅ Revenue moved to ${overId} (month ${newStartMonth})`
            );
          },
          onError: (error) => {
            console.error("Failed to update revenue:", error);
          },
        }
      );
    }
  };

  const activeItem = allItems.find((i) => i.id === activeId);

  return (
    <div className="container mx-auto p-6">
      {/* Header with Scenario Selector and View Type */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div></div> {/* Empty div for spacing */}
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Select Scenario</Label>
              <Select
                value={selectedScenarioId || ""}
                onValueChange={setSelectedScenarioId}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Choose a scenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios?.map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>View Type</Label>
              <Select
                value={viewType}
                onValueChange={(value) =>
                  handleViewTypeChange(value as "quarterly" | "monthly")
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Scenario
            </Button>
          </div>
        </div>

        {/* Totals Summary */}
        {selectedScenarioId && (
          <div className="flex items-stretch gap-4">
            {/* Total Costs Card */}
            <MatrixCard
              value={formatCurrency(totals.totalCosts)}
              label="Total Costs"
              valueColor="text-red-600"
            />

            {/* Total Revenue Card */}
            <MatrixCard
              value={formatCurrency(totals.totalRevenue)}
              label="Total Revenue"
              valueColor="text-green-600"
            />

            {/* Net Burn Card */}
            <MatrixCard
              value={formatCurrency(Math.abs(totals.netBurn))}
              label="Net Burn"
              valueColor={
                totals.netBurn < 0 ? "text-green-600" : "text-red-600"
              }
              badge={
                <Badge
                  variant={totals.netBurn < 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {totals.netBurn < 0 ? (
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
              value={`${totals.growthRate >= 0 ? "+" : ""}${totals.growthRate.toFixed(1)}%`}
              label="Growth Rate"
              valueColor={
                totals.growthRate >= 0 ? "text-green-600" : "text-red-600"
              }
              badge={
                totals.growthRate >= 0 ? (
                  <Badge variant="default" className="text-xs bg-green-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Growth
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Decline
                  </Badge>
                )
              }
            />
          </div>
        )}
      </div>

      {!selectedScenarioId ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              Please select a scenario to view its pipeline
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            className="flex gap-4 overflow-x-auto pb-4"
            style={
              viewType === "monthly"
                ? {
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }
                : {}
            }
          >
            {/* Unassigned Panel - items not yet assigned to a stage */}
            <UnassignedPanel
              items={allItems.filter((item) => !item.isActive)}
            />

            {/* Stage Columns */}
            {stages.map((stage) => {
              const stageItems = stage.items;
              const metrics = stage.metrics;
              const cumulativeBurn = stage.cumulativeBurn;

              return (
                <SortableContext
                  key={stage.id}
                  items={[stage.id, ...stageItems.map((i) => i.id)]}
                  strategy={verticalListSortingStrategy}
                >
                  <StageColumn
                    stage={stage}
                    items={stageItems}
                    cumulativeBurn={cumulativeBurn}
                    metrics={metrics}
                    funding={
                      selectedScenario?.funding
                        ? parseFloat(selectedScenario.funding.toString())
                        : 0
                    }
                  />
                </SortableContext>
              );
            })}
          </div>

          {/* DragOverlay */}
          <DragOverlay dropAnimation={null}>
            {activeItem ? (
              <Card className="w-64 opacity-95 border-2 border-primary/50">
                <CardContent className="p-3 bg-background">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {activeItem.title}
                        </span>
                      </div>
                      {activeItem.category && (
                        <Badge variant="outline" className="text-xs">
                          {activeItem.category}
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant={
                        activeItem.type === "revenue" ? "default" : "secondary"
                      }
                      className={
                        activeItem.type === "revenue" ? "bg-green-500" : ""
                      }
                    >
                      {activeItem.type === "revenue" ? "+" : "-"}$
                      {activeItem.amount.toLocaleString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add CreateScenarioModal at the end, before closing the main div */}
      <CreateScenarioModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
};

export default Pipeline;
