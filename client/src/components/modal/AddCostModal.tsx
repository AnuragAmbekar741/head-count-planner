import React, { useState } from "react";
import { Sparkles, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
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
import { useCreateRevenuesBulk } from "@/hooks/revenue";
import { CostFrequency, type CostFrequencyType } from "@/api/cost";
import { RevenueFrequency, type RevenueFrequencyType } from "@/api/revenue";
import type { CostCreateRequest } from "@/api/cost";
import type { RevenueCreateRequest } from "@/api/revenue";

interface CostFormData {
  title: string;
  value: string;
  category: string;
  starts_at: string;
  end_at: string;
  freq: CostFrequencyType;
}

interface RevenueFormData {
  title: string;
  value: string;
  category: string;
  starts_at: string;
  end_at: string;
  freq: RevenueFrequencyType;
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
  const [step, setStep] = useState<1 | 2>(1); // 1 = select type, 2 = add items
  const [itemType, setItemType] = useState<"cost" | "revenue" | null>(null);
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
  const [revenues, setRevenues] = useState<RevenueFormData[]>([
    {
      title: "",
      value: "",
      category: "",
      starts_at: "",
      end_at: "",
      freq: RevenueFrequency.MONTHLY,
    },
  ]);

  const createCostsBulk = useCreateCostsBulk();
  const createRevenuesBulk = useCreateRevenuesBulk();

  const handleTypeSelect = (type: "cost" | "revenue") => {
    setItemType(type);
    setStep(2);
  };

  const handleTemplateSelect = (
    template: (typeof TEAM_TEMPLATES)[0],
    index: number
  ) => {
    const newSelected = new Set(selectedTemplateIndices);

    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }

    setSelectedTemplateIndices(newSelected);

    if (itemType === "cost") {
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
    } else if (itemType === "revenue") {
      const allRevenues: RevenueFormData[] = [];
      newSelected.forEach((idx) => {
        const template = TEAM_TEMPLATES[idx];
        if (template.revenues) {
          template.revenues.forEach((revenue) => {
            allRevenues.push({
              title: revenue.title,
              value: revenue.value,
              category: revenue.category || "",
              starts_at: revenue.starts_at,
              end_at: revenue.end_at,
              freq: revenue.freq,
            });
          });
        }
      });
      setRevenues(
        allRevenues.length > 0
          ? allRevenues
          : [
              {
                title: "",
                value: "",
                category: "",
                starts_at: "",
                end_at: "",
                freq: RevenueFrequency.MONTHLY,
              },
            ]
      );
    }
  };

  const handleAddItem = () => {
    if (itemType === "cost") {
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
    } else {
      setRevenues([
        ...revenues,
        {
          title: "",
          value: "",
          category: "",
          starts_at: "",
          end_at: "",
          freq: RevenueFrequency.MONTHLY,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (itemType === "cost") {
      setCosts(costs.filter((_, i) => i !== index));
    } else {
      setRevenues(revenues.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof CostFormData | keyof RevenueFormData,
    value: string
  ) => {
    if (itemType === "cost") {
      const updatedCosts = [...costs];
      updatedCosts[index] = { ...updatedCosts[index], [field]: value };
      setCosts(updatedCosts);
    } else {
      const updatedRevenues = [...revenues];
      updatedRevenues[index] = { ...updatedRevenues[index], [field]: value };
      setRevenues(updatedRevenues);
    }
  };

  const handleSubmit = () => {
    if (step === 1) {
      // Should not happen, but just in case
      return;
    }

    if (itemType === "cost") {
      const validCosts = costs.filter(
        (cost) =>
          cost.title.trim() &&
          cost.value &&
          cost.category.trim() &&
          cost.starts_at
      );

      if (validCosts.length === 0) return;

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
            handleClose();
          },
        }
      );
    } else if (itemType === "revenue") {
      const validRevenues = revenues.filter(
        (revenue) => revenue.title.trim() && revenue.value && revenue.starts_at
      );

      if (validRevenues.length === 0) return;

      const revenuesToCreate: RevenueCreateRequest[] = validRevenues.map(
        (revenue) => ({
          title: revenue.title.trim(),
          value: parseFloat(revenue.value),
          category: revenue.category.trim() || null,
          starts_at: parseInt(revenue.starts_at),
          end_at: revenue.end_at ? parseInt(revenue.end_at) : null,
          freq: revenue.freq,
          scenario_id: scenarioId,
          is_active: true,
        })
      );

      createRevenuesBulk.mutate(
        { revenues: revenuesToCreate },
        {
          onSuccess: () => {
            handleClose();
          },
        }
      );
    }
  };

  const handleCancel = () => {
    if (step === 2) {
      // Go back to step 1 without closing
      setStep(1);
      setItemType(null);
      setSelectedTemplateIndices(new Set());
      // Don't call onOpenChange(false) - modal stays open
    } else {
      // On step 1, close the modal
      handleClose();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
    setItemType(null);
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
    setRevenues([
      {
        title: "",
        value: "",
        category: "",
        starts_at: "",
        end_at: "",
        freq: RevenueFrequency.MONTHLY,
      },
    ]);
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <Label className="text-base font-medium">
          What would you like to add?
        </Label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-red-500"
          onClick={() => handleTypeSelect("cost")}
        >
          <TrendingDown className="h-8 w-8 text-red-500" />
          <span className="font-medium">Cost</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-green-500"
          onClick={() => handleTypeSelect("revenue")}
        >
          <TrendingUp className="h-8 w-8 text-green-500" />
          <span className="font-medium">Revenue</span>
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const templates =
      itemType === "cost"
        ? TEAM_TEMPLATES.filter((t) => t.costs.length > 0)
        : TEAM_TEMPLATES.filter((t) => t.revenues && t.revenues.length > 0);

    const items = itemType === "cost" ? costs : revenues;
    const Frequency = itemType === "cost" ? CostFrequency : RevenueFrequency;

    return (
      <div className="space-y-4 overflow-x-hidden">
        {/* Templates Section */}
        {templates.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">
                Quick Templates ({itemType === "cost" ? "Costs" : "Revenues"})
              </Label>
            </div>
            <div className="relative w-full">
              <div className="overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide">
                <div className="flex gap-2 w-max">
                  {TEAM_TEMPLATES.map((template, idx) => {
                    const templateItems =
                      itemType === "cost"
                        ? template.costs
                        : template.revenues || [];

                    if (templateItems.length === 0) return null;

                    const itemCounts = templateItems.reduce(
                      (acc, item) => {
                        const category = item.category || "Other";
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
                          <div className="text-xs text-muted-foreground mt-1">
                            {templateItems.length}{" "}
                            {itemType === "cost" ? "costs" : "revenues"}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2 w-full">
                            {Object.entries(itemCounts).map(
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
        )}

        <div className="flex items-center justify-between pt-2">
          <h3 className="text-sm font-medium">
            Add {itemType === "cost" ? "Costs" : "Revenues"}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add {itemType === "cost" ? "Cost" : "Revenue"}
          </Button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg space-y-3 relative"
            >
              {items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={item.title}
                  onChange={(e) =>
                    handleItemChange(index, "title", e.target.value)
                  }
                  placeholder={`${itemType === "cost" ? "Cost" : "Revenue"} title`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Value (Annual) *</Label>
                  <Input
                    type="number"
                    value={item.value}
                    onChange={(e) =>
                      handleItemChange(index, "value", e.target.value)
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category {itemType === "revenue" ? "" : "*"}</Label>
                  <Input
                    value={item.category}
                    onChange={(e) =>
                      handleItemChange(index, "category", e.target.value)
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
                    value={item.starts_at}
                    onChange={(e) =>
                      handleItemChange(index, "starts_at", e.target.value)
                    }
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Month</Label>
                  <Input
                    type="number"
                    value={item.end_at}
                    onChange={(e) =>
                      handleItemChange(index, "end_at", e.target.value)
                    }
                    placeholder="Optional"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency *</Label>
                  <Select
                    value={item.freq}
                    onValueChange={(value) =>
                      handleItemChange(
                        index,
                        "freq",
                        value as CostFrequencyType | RevenueFrequencyType
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Frequency.MONTHLY}>Monthly</SelectItem>
                      <SelectItem value={Frequency.QUARTERLY}>
                        Quarterly
                      </SelectItem>
                      <SelectItem value={Frequency.YEARLY}>Yearly</SelectItem>
                      <SelectItem value={Frequency.ANNUAL}>Annual</SelectItem>
                      <SelectItem value={Frequency.ONE_TIME}>
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
  };

  const isSubmitting =
    (itemType === "cost" && createCostsBulk.isPending) ||
    (itemType === "revenue" && createRevenuesBulk.isPending);

  const isDisabled =
    step === 1
      ? true
      : itemType === "cost"
        ? costs.every(
            (cost) =>
              !cost.title.trim() ||
              !cost.value ||
              !cost.category.trim() ||
              !cost.starts_at
          ) || createCostsBulk.isPending
        : revenues.every(
            (revenue) =>
              !revenue.title.trim() || !revenue.value || !revenue.starts_at
          ) || createRevenuesBulk.isPending;

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        step === 1
          ? "Add to Scenario"
          : `Add ${itemType === "cost" ? "Costs" : "Revenues"} to Scenario`
      }
      description={
        step === 1
          ? "Select whether you want to add costs or revenues"
          : `Select a template or manually add ${itemType === "cost" ? "costs" : "revenues"} to your scenario`
      }
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel={
        step === 1
          ? "Next"
          : `Add ${itemType === "cost" ? "Costs" : "Revenues"}`
      }
      cancelLabel={step === 1 ? "Cancel" : "Back"}
      isSubmitting={isSubmitting}
      disabled={isDisabled}
    >
      <div className="space-y-4">
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
