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

// Team templates
const TEAM_TEMPLATES = [
  {
    name: "5-Person Startup Team",
    description: "3 Engineers, 1 Designer, 1 QA",
    costs: [
      {
        title: "Senior Software Engineer #1",
        value: "180000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Software Engineer #2",
        value: "140000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Junior Software Engineer",
        value: "100000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Product Designer",
        value: "120000",
        category: "Design",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "QA Engineer",
        value: "90000",
        category: "Quality Assurance",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
    ],
  },
  {
    name: "10-Person Growth Team",
    description: "5 Engineers, 2 Designers, 1 PM, 1 QA, 1 DevOps",
    costs: [
      {
        title: "Engineering Manager",
        value: "200000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Senior Engineer #1",
        value: "180000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Senior Engineer #2",
        value: "180000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Engineer #1",
        value: "140000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Engineer #2",
        value: "140000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Senior Designer",
        value: "150000",
        category: "Design",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Designer",
        value: "120000",
        category: "Design",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Product Manager",
        value: "160000",
        category: "Product",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "QA Engineer",
        value: "100000",
        category: "Quality Assurance",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "DevOps Engineer",
        value: "150000",
        category: "Infrastructure",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
    ],
  },
  {
    name: "Small Engineering Team",
    description: "2 Senior Engineers, 1 Mid-level Engineer",
    costs: [
      {
        title: "Senior Software Engineer #1",
        value: "180000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Senior Software Engineer #2",
        value: "180000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Software Engineer",
        value: "140000",
        category: "Engineering",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
    ],
  },
  {
    name: "Sales & Marketing Team",
    description: "2 Sales Reps, 1 Marketing Manager, 1 Content Creator",
    costs: [
      {
        title: "Sales Representative #1",
        value: "80000",
        category: "Sales",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Sales Representative #2",
        value: "80000",
        category: "Sales",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Marketing Manager",
        value: "110000",
        category: "Marketing",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
      {
        title: "Content Creator",
        value: "70000",
        category: "Marketing",
        starts_at: "1",
        end_at: "",
        freq: CostFrequency.MONTHLY as CostFrequencyType,
      },
    ],
  },
];

export const CreateScenarioModal: React.FC<CreateScenarioModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
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

  const createScenario = useCreateScenario();
  const createCostsBulk = useCreateCostsBulk();

  const isSubmitting = createScenario.isPending || createCostsBulk.isPending;

  const handleStep1Next = () => {
    if (name.trim()) {
      // Create scenario first before moving to step 2
      createScenario.mutate(
        {
          name: name.trim(),
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

  const handleTemplateSelect = (template: (typeof TEAM_TEMPLATES)[0]) => {
    setCosts(
      template.costs.map((cost) => ({
        ...cost,
        value: cost.value.toString(),
        starts_at: cost.starts_at.toString(),
        end_at: cost.end_at.toString(),
      }))
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
    createScenario.reset();
    createCostsBulk.reset();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (step === 1) {
      handleClose();
    } else {
      setStep(1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter scenario name"
          required
        />
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
    <div className="space-y-4">
      {/* Templates Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Quick Templates</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TEAM_TEMPLATES.map((template, idx) => (
            <Button
              key={idx}
              type="button"
              variant="outline"
              className="h-auto p-3 flex flex-col items-start text-left"
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="font-medium text-sm">{template.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {template.description}
              </div>
              <Badge variant="secondary" className="mt-2 text-xs">
                {template.costs.length} roles
              </Badge>
            </Button>
          ))}
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
