import React, { useState } from "react";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { BaseModal } from "@/components/base-modal/BaseModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEAM_TEMPLATES } from "@/data/scenario-templates";
import { useCreateCostsBulk } from "@/hooks/cost";
import { CostFrequency, type CostFrequencyType } from "@/api/cost";
import type { CostCreateRequest } from "@/api/cost";

interface CostFormData {
  title: string;
  value: string;
  category: string;
  starts_at: string;
  end_at: string;
  freq: CostFrequencyType;
}

interface AddCostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioId: string;
}

export const AddCostModal: React.FC<AddCostModalProps> = ({
  open,
  onOpenChange,
  scenarioId,
}) => {
  const [selectedTemplateIndices, setSelectedTemplateIndices] = useState<
    Set<number>
  >(new Set());
  const [costs, setCosts] = useState<CostFormData[]>([
    {
      title: "",
      value: "",
      category: "",
      starts_at: "",
      end_at: "",
      freq: CostFrequency.MONTHLY,
    },
  ]);
  const createCostsBulk = useCreateCostsBulk();

  const handleTemplateSelect = (
    template: (typeof TEAM_TEMPLATES)[0],
    index: number
  ) => {
    const newSelected = new Set(selectedTemplateIndices);

    if (newSelected.has(index)) {
      // Deselect template - remove its costs
      newSelected.delete(index);
    } else {
      // Select template - add its costs
      newSelected.add(index);
    }

    setSelectedTemplateIndices(newSelected);

    // Merge all selected template costs
    const allCosts: CostFormData[] = [];
    newSelected.forEach((idx) => {
      const template = TEAM_TEMPLATES[idx];
      template.costs.forEach((cost) => {
        allCosts.push({
          title: cost.title,
          value: cost.value,
          category: cost.category,
          starts_at: cost.starts_at,
          end_at: cost.end_at,
          freq: cost.freq,
        });
      });
    });

    // If no templates selected, keep at least one empty cost form
    setCosts(
      allCosts.length > 0
        ? allCosts
        : [
            {
              title: "",
              value: "",
              category: "",
              starts_at: "",
              end_at: "",
              freq: CostFrequency.MONTHLY,
            },
          ]
    );
  };

  const handleAddCost = () => {
    setCosts([
      ...costs,
      {
        title: "",
        value: "",
        category: "",
        starts_at: "",
        end_at: "",
        freq: CostFrequency.MONTHLY,
      },
    ]);
  };

  const handleRemoveCost = (index: number) => {
    setCosts(costs.filter((_, i) => i !== index));
  };

  const handleCostChange = (
    index: number,
    field: keyof CostFormData,
    value: string
  ) => {
    const updatedCosts = [...costs];
    updatedCosts[index] = { ...updatedCosts[index], [field]: value };
    setCosts(updatedCosts);
  };

  const handleSubmit = () => {
    // Filter out empty costs and validate
    const validCosts = costs.filter(
      (cost) =>
        cost.title.trim() &&
        cost.value &&
        cost.category.trim() &&
        cost.starts_at
    );

    if (validCosts.length === 0) {
      return;
    }

    // Transform costs to API format
    const costsToCreate: CostCreateRequest[] = validCosts.map((cost) => ({
      title: cost.title.trim(),
      value: parseFloat(cost.value),
      category: cost.category.trim(),
      starts_at: parseInt(cost.starts_at),
      end_at: cost.end_at ? parseInt(cost.end_at) : null,
      freq: cost.freq,
      scenario_id: scenarioId,
      is_active: true,
    }));

    createCostsBulk.mutate(
      { costs: costsToCreate },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedTemplateIndices(new Set());
          setCosts([
            {
              title: "",
              value: "",
              category: "",
              starts_at: "",
              end_at: "",
              freq: CostFrequency.MONTHLY,
            },
          ]);
        },
        onError: (error) => {
          console.error("Failed to add costs:", error);
        },
      }
    );
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedTemplateIndices(new Set());
    setCosts([
      {
        title: "",
        value: "",
        category: "",
        starts_at: "",
        end_at: "",
        freq: CostFrequency.MONTHLY,
      },
    ]);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Costs to Scenario"
      description="Select a template or manually add costs to your scenario"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel="Add Costs"
      cancelLabel="Cancel"
      isSubmitting={createCostsBulk.isPending}
      disabled={
        costs.every(
          (cost) =>
            !cost.title.trim() ||
            !cost.value ||
            !cost.category.trim() ||
            !cost.starts_at
        ) || createCostsBulk.isPending
      }
    >
      <div className="space-y-4 overflow-x-hidden">
        {/* Templates Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Quick Templates</Label>
          </div>
          <div className="relative w-full">
            <div className="overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide">
              <div className="flex gap-2 w-max">
                {TEAM_TEMPLATES.map((template, idx) => {
                  // Group costs by category and count them
                  const roleCounts = template.costs.reduce(
                    (acc, cost) => {
                      const category = cost.category;
                      acc[category] = (acc[category] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  );

                  const isSelected = selectedTemplateIndices.has(idx);

                  return (
                    <div
                      key={idx}
                      className={`relative w-[200px] flex-shrink-0 cursor-pointer rounded-lg border-2 p-3 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleTemplateSelect(template, idx)}
                    >
                      {/* Radio indicator */}
                      <div className="absolute top-3 right-3">
                        <div
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {isSelected && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>

                      <div className="pr-6">
                        <div className="font-medium text-sm line-clamp-1 w-full">
                          {template.name}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2 w-full">
                          {Object.entries(roleCounts).map(
                            ([category, count], badgeIdx) => (
                              <Badge
                                key={badgeIdx}
                                variant="secondary"
                                className="text-xs px-1.5 py-0.5"
                              >
                                {count} × {category}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <h3 className="text-sm font-medium">Add Costs</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCost}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Cost
          </Button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
          {costs.map((cost, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg space-y-3 relative"
            >
              {costs.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => handleRemoveCost(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={cost.title}
                  onChange={(e) =>
                    handleCostChange(index, "title", e.target.value)
                  }
                  placeholder="Cost title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Value (Annual) *</Label>
                  <Input
                    type="number"
                    value={cost.value}
                    onChange={(e) =>
                      handleCostChange(index, "value", e.target.value)
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Input
                    value={cost.category}
                    onChange={(e) =>
                      handleCostChange(index, "category", e.target.value)
                    }
                    placeholder="e.g., Engineering"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Start Month *</Label>
                  <Input
                    type="number"
                    value={cost.starts_at}
                    onChange={(e) =>
                      handleCostChange(index, "starts_at", e.target.value)
                    }
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Month</Label>
                  <Input
                    type="number"
                    value={cost.end_at}
                    onChange={(e) =>
                      handleCostChange(index, "end_at", e.target.value)
                    }
                    placeholder="Optional"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency *</Label>
                  <Select
                    value={cost.freq}
                    onValueChange={(value) =>
                      handleCostChange(
                        index,
                        "freq",
                        value as CostFrequencyType
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CostFrequency.MONTHLY}>
                        Monthly
                      </SelectItem>
                      <SelectItem value={CostFrequency.QUARTERLY}>
                        Quarterly
                      </SelectItem>
                      <SelectItem value={CostFrequency.YEARLY}>
                        Yearly
                      </SelectItem>
                      <SelectItem value={CostFrequency.ANNUAL}>
                        Annual
                      </SelectItem>
                      <SelectItem value={CostFrequency.ONE_TIME}>
                        One Time
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );
};
