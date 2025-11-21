import React, { useState } from "react";
import { BaseModal } from "@/components/base-modal/BaseModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCreateScenario } from "@/hooks/scenario";
import { useCreateCostsBulk } from "@/hooks/cost";
import { CostFrequency, type CostFrequencyType } from "@/api/cost";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { TEAM_TEMPLATES } from "@/data/scenario-templates";
interface CostFormData {
  title: string;
  value: string;
  category: string;
  starts_at: string;
  end_at: string;
  freq: CostFrequencyType;
}

interface CreateScenarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateScenarioModal: React.FC<CreateScenarioModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [funding, setFunding] = useState("");
  const [revenue, setRevenue] = useState(""); // Add revenue state
  const [description, setDescription] = useState("");
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
  const [createdScenarioId, setCreatedScenarioId] = useState<string | null>(
    null
  );
  const [selectedTemplateIndices, setSelectedTemplateIndices] = useState<
    Set<number>
  >(new Set());

  const createScenario = useCreateScenario();
  const createCostsBulk = useCreateCostsBulk();

  const isSubmitting = createScenario.isPending || createCostsBulk.isPending;

  const handleStep1Next = () => {
    if (name.trim()) {
      // Create scenario first before moving to step 2
      createScenario.mutate(
        {
          name: name.trim(),
          funding: funding ? parseFloat(funding) : undefined,
          revenue: revenue ? parseFloat(revenue) : undefined, // Add revenue
          description: description.trim() || undefined,
        },
        {
          onSuccess: (scenario) => {
            setCreatedScenarioId(scenario.id);
            setStep(2);
          },
          onError: (error) => {
            console.error("Failed to create scenario:", error);
          },
        }
      );
    }
  };

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
          value: cost.value.toString(),
          category: cost.category,
          starts_at: cost.starts_at.toString(),
          end_at: cost.end_at.toString(),
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
    if (step === 1) {
      handleStep1Next();
      return;
    }

    // Step 2: Create costs in bulk
    if (!createdScenarioId) {
      console.error("Scenario ID not found");
      return;
    }

    const validCosts = costs.filter(
      (cost) =>
        cost.title.trim() &&
        cost.value &&
        cost.category.trim() &&
        cost.starts_at
    );

    if (validCosts.length > 0) {
      createCostsBulk.mutate(
        {
          costs: validCosts.map((cost) => ({
            title: cost.title.trim(),
            value: parseFloat(cost.value),
            category: cost.category.trim(),
            starts_at: parseInt(cost.starts_at),
            end_at: cost.end_at ? parseInt(cost.end_at) : null,
            freq: cost.freq,
            scenario_id: createdScenarioId,
            is_active: true, // Add this - explicitly set to true for new costs
          })),
        },
        {
          onSuccess: () => {
            handleClose();
          },
          onError: (error) => {
            console.error("Failed to create costs:", error);
          },
        }
      );
    } else {
      // No costs to add, just close
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setName("");
    setFunding("");
    setRevenue(""); // Reset revenue
    setDescription("");
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
    setCreatedScenarioId(null);
    setSelectedTemplateIndices(new Set());
    createScenario.reset();
    createCostsBulk.reset();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (step === 1) {
      onOpenChange(false);
      setName("");
      setFunding("");
      setRevenue("");
      setDescription("");
    } else {
      setStep(1);
    }
    // Reset templates
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

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter scenario name (e.g., 🚀 Launch Plan)"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="funding">Funding</Label>
        <Input
          id="funding"
          type="number"
          value={funding}
          onChange={(e) => setFunding(e.target.value)}
          placeholder="Enter funding amount (optional)"
          min="0"
          step="0.01"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="revenue">Annual Revenue</Label>
        <Input
          id="revenue"
          type="number"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
          placeholder="Enter annual revenue amount (optional)"
          min="0"
          step="0.01"
        />
        <p className="text-xs text-muted-foreground">
          Total revenue for the year
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter scenario description (optional)"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 overflow-x-hidden">
      {/* Templates Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Quick Templates</Label>
        </div>
        <div className="relative w-full">
          <div className="overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
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

      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {costs.map((cost, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 relative">
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
                    handleCostChange(index, "freq", value as CostFrequencyType)
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
                    <SelectItem value={CostFrequency.YEARLY}>Yearly</SelectItem>
                    <SelectItem value={CostFrequency.ANNUAL}>Annual</SelectItem>
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
  );

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Create Scenario ${step === 1 ? "(Step 1 of 2)" : "(Step 2 of 2)"}`}
      description={
        step === 1
          ? "Enter scenario details"
          : "Add costs to your scenario or use a template"
      }
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel={step === 1 ? "Next" : "Create Scenario"}
      cancelLabel={step === 1 ? "Cancel" : "Back"}
      isSubmitting={isSubmitting}
      disabled={
        step === 1
          ? !name.trim() || createScenario.isPending
          : costs.every(
              (cost) =>
                !cost.title.trim() ||
                !cost.value ||
                !cost.category.trim() ||
                !cost.starts_at
            ) || createCostsBulk.isPending
      }
    >
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pb-4">
          <div
            className={`h-2 w-16 rounded transition-colors ${
              step >= 1 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-2 w-16 rounded transition-colors ${
              step >= 2 ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>

        {step === 1 ? renderStep1() : renderStep2()}
      </div>
    </BaseModal>
  );
};
