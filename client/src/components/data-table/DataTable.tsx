import * as React from "react";
import {
  IconChevronDown,
  IconLayoutColumns,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel, // Add this
  type SortingState,
  useReactTable,
  type VisibilityState,
  type GroupingState, // Add this
} from "@tanstack/react-table";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { useUpdateCost } from "@/hooks/cost";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CostItem } from "@/data/cost-item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AddCostModal } from "@/components/modal/AddCostModal";
import { useState } from "react";
import { formatCurrency } from "@/utils/number-format";

// Add this utility function near the top, after imports
function formatMonthNumber(monthNumber: number): string {
  // Convert month number (1-12) to month name
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

  const monthIndex = (monthNumber - 1) % 12;
  return monthNames[monthIndex];
}

// eslint-disable-next-line react-refresh/only-export-components
export const schema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["HEADCOUNT", "NON_HEADCOUNT"]),
  stageId: z.enum(["active", "planned"]),
  category: z.string(),
  cadence: z.enum(["MONTHLY", "WEEKLY", "YEARLY"]),
  startMonth: z.number(),
  endMonth: z.number(),
  roleTitle: z.string().optional(),
  location: z.string().optional(),
  annualSalary: z.number().optional(),
  fte: z.number().optional(),
  amount: z.number().optional(),
});

export function DataTable({
  data: initialData,
  outlineViewType: externalOutlineViewType,
  onOutlineViewTypeChange,
  onSelectedMonthsChange, // Add this prop
  scenarioId, // Add this prop
}: {
  data: CostItem[];
  outlineViewType?: "monthly" | "annual";
  onOutlineViewTypeChange?: (value: "monthly" | "annual") => void;
  onSelectedMonthsChange?: (months: number[]) => void; // Add this prop
  scenarioId?: string; // Add this prop
}) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [grouping, setGrouping] = React.useState<GroupingState>([]); // Add this state
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [outlineViewType, setOutlineViewType] = React.useState<
    "monthly" | "annual"
  >(externalOutlineViewType || "annual");
  const [selectedMonths, setSelectedMonths] = React.useState<number[]>([]); // Add this state
  const [isAddCostModalOpen, setIsAddCostModalOpen] = useState(false);

  // Sync with external state if provided
  React.useEffect(() => {
    if (externalOutlineViewType !== undefined) {
      setOutlineViewType(externalOutlineViewType);
    }
  }, [externalOutlineViewType]);

  // Update both internal and external state
  const handleOutlineViewTypeChange = (value: "monthly" | "annual") => {
    setOutlineViewType(value);
    if (onOutlineViewTypeChange) {
      onOutlineViewTypeChange(value);
    }
  };

  const updateCostMutation = useUpdateCost(); // Add this hook

  // Update data when initialData changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Handle status toggle
  const handleStatusToggle = (costId: string, currentStatus: boolean) => {
    updateCostMutation.mutate(
      {
        costId,
        data: {
          is_active: !currentStatus,
        },
      },
      {
        onSuccess: (updatedCost) => {
          // Update local data state
          setData((prevData) =>
            prevData.map((item) =>
              item.id === costId
                ? { ...item, isActive: updatedCost.is_active }
                : item
            )
          );
        },
      }
    );
  };

  // Calculate months for outline table - only current year (1-12)
  const currentYearMonths = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, 3, ..., 12]
  }, []);

  // Calculate months/years for time series view - Memoize this (keep existing logic)
  const { months, years } = React.useMemo(() => {
    if (!data || data.length === 0) return { months: [], years: [] };

    const allMonths = new Set<number>();
    const allYears = new Set<number>();

    data.forEach((item) => {
      const startMonth = item.startAt;
      const endMonth = item.endsAt || 24; // Default to 24 months if null

      for (let month = startMonth; month <= endMonth; month++) {
        allMonths.add(month);
        const year = Math.ceil(month / 12);
        allYears.add(year);
      }
    });

    return {
      months: Array.from(allMonths).sort((a, b) => a - b),
      years: Array.from(allYears).sort((a, b) => a - b),
    };
  }, [data]);

  // Use a ref to track if we've initialized for the current view type
  const initializedForViewType = React.useRef<string>("");

  // Initialize selected months with current year months (1-12)
  React.useEffect(() => {
    const viewKey = `${outlineViewType}-current-year`;

    if (initializedForViewType.current === viewKey) {
      return;
    }

    if (outlineViewType === "annual") {
      setSelectedMonths([]);
      initializedForViewType.current = viewKey;
      return;
    }

    if (outlineViewType === "monthly") {
      setSelectedMonths([...currentYearMonths]);
      initializedForViewType.current = viewKey;
    }
  }, [outlineViewType, currentYearMonths]);

  // Notify parent when selectedMonths changes
  React.useEffect(() => {
    if (onSelectedMonthsChange) {
      onSelectedMonthsChange(selectedMonths);
    }
  }, [selectedMonths, onSelectedMonthsChange]);

  // Calculate monthly value for selected months
  const calculateMonthlyValueForSelectedMonths = (item: CostItem): number => {
    if (selectedMonths.length === 0) return 0;

    return selectedMonths.reduce((sum, month) => {
      return sum + calculateCostForPeriod(item, month, "monthly");
    }, 0);
  };

  // Calculate cost for a specific time period
  const calculateCostForPeriod = (
    item: CostItem,
    period: number,
    view: "monthly" | "yearly"
  ) => {
    if (period < item.startAt) return 0;
    if (item.endsAt !== null && period > item.endsAt) return 0;

    if (view === "monthly") {
      // Calculate monthly cost based on frequency
      switch (item.frequency) {
        case "MONTHLY":
          return item.annualValue / 12;
        case "QUARTERLY":
          return period % 3 === item.startAt % 3 ? item.annualValue / 4 : 0;
        case "YEARLY":
          return period % 12 === item.startAt % 12 ? item.annualValue : 0;
        case "ONE_TIME":
          return period === item.startAt ? item.annualValue : 0;
        default:
          return item.annualValue / 12;
      }
    } else {
      // Calculate yearly cost
      const yearStartMonth = (period - 1) * 12 + 1;
      const yearEndMonth = period * 12;

      if (
        item.startAt > yearEndMonth ||
        (item.endsAt !== null && item.endsAt < yearStartMonth)
      ) {
        return 0;
      }

      switch (item.frequency) {
        case "MONTHLY": {
          const activeMonths =
            Math.min(yearEndMonth, item.endsAt || yearEndMonth) -
            Math.max(yearStartMonth, item.startAt) +
            1;
          return (item.annualValue / 12) * activeMonths;
        }
        case "QUARTERLY": {
          const quartersInYear =
            Math.floor(
              (Math.min(yearEndMonth, item.endsAt || yearEndMonth) -
                Math.max(yearStartMonth, item.startAt)) /
                3
            ) + 1;
          return (item.annualValue / 4) * quartersInYear;
        }
        case "YEARLY":
          return item.annualValue;
        case "ONE_TIME":
          return item.startAt >= yearStartMonth && item.startAt <= yearEndMonth
            ? item.annualValue
            : 0;
        default:
          return item.annualValue;
      }
    }
  };

  // Helper function to check if cost is active in selected months
  const isCostActiveInSelectedMonths = (item: CostItem): boolean => {
    // If not active in database, return false
    if (!item.isActive) return false;

    // If annual view, use database isActive
    if (outlineViewType === "annual") {
      return item.isActive;
    }

    // If monthly view with selected months
    if (selectedMonths.length > 0) {
      // Check if cost is active in any of the selected months
      return selectedMonths.some((month) => {
        // Cost hasn't started yet
        if (month < item.startAt) return false;
        // Cost has ended
        if (item.endsAt !== null && month > item.endsAt) return false;
        // Cost is active in this month
        return true;
      });
    }

    // Default to database isActive if no months selected
    return item.isActive;
  };

  // Helper function to calculate grouped data
  const getGroupedData = () => {
    if (grouping.length === 0) return null;

    const grouped = data.reduce(
      (acc, item) => {
        const category = item.category;
        if (!acc[category]) {
          acc[category] = {
            category,
            items: [],
            totalValue: 0,
            hasActive: false,
            hasInactive: false,
          };
        }

        acc[category].items.push(item);

        // Calculate value for this item
        const itemValue =
          outlineViewType === "annual"
            ? item.annualValue
            : calculateMonthlyValueForSelectedMonths(item);

        acc[category].totalValue += itemValue;

        // Check status
        const isActive = isCostActiveInSelectedMonths(item);
        if (isActive) {
          acc[category].hasActive = true;
        } else {
          acc[category].hasInactive = true;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          category: string;
          items: CostItem[];
          totalValue: number;
          hasActive: boolean;
          hasInactive: boolean;
        }
      >
    );

    return Object.values(grouped);
  };

  // Define columns with dynamic value based on outlineViewType
  const columns: ColumnDef<CostItem>[] = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          return <TableCellViewer item={row.original} />;
        },
        enableHiding: false,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: "annualValue",
        header: () => <div className="w-full text-right">Value</div>,
        cell: ({ row }) => {
          // Calculate value based on toggle
          let value: number;
          if (outlineViewType === "annual") {
            value = row.original.annualValue;
          } else {
            // For monthly view, sum up costs for selected months
            value = calculateMonthlyValueForSelectedMonths(row.original);
          }

          return <div className="text-right">{formatCurrency(value)}</div>;
        },
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.frequency}
          </Badge>
        ),
      },
      {
        accessorKey: "startAt",
        header: "Start Month",
        cell: ({ row }) => formatMonthNumber(row.original.startAt),
      },
      {
        accessorKey: "endsAt",
        header: "End Month",
        cell: ({ row }) =>
          row.original.endsAt ? (
            formatMonthNumber(row.original.endsAt)
          ) : (
            <Badge variant="outline" className="text-muted-foreground px-1.5">
              N/A
            </Badge>
          ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const isActive = isCostActiveInSelectedMonths(row.original);
          return (
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="px-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() =>
                handleStatusToggle(row.original.id, row.original.isActive)
              }
            >
              {isActive ? "Active 🔥" : "Inactive"}
            </Badge>
          );
        },
      },
    ],
    [outlineViewType, updateCostMutation, selectedMonths] // Add selectedMonths to dependencies
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      grouping, // Add this
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGroupingChange: setGrouping, // Add this
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getGroupedRowModel: getGroupedRowModel(), // Add this
    enableGrouping: true, // Add this
  });

  // Update renderOutlineTable
  const renderOutlineTable = () => {
    const groupedData = grouping.length > 0 ? getGroupedData() : null;

    return (
      <>
        {/* Simplified header for outline table */}
        <div className="flex items-center justify-between mb-4">
          {/* Top Left: Monthly/Annual dropdown, Group by Category button, and month selector */}
          <div className="flex items-center gap-2">
            <Select
              value={outlineViewType}
              onValueChange={(value: "monthly" | "annual") =>
                handleOutlineViewTypeChange(value)
              }
            >
              <SelectTrigger className="w-[120px]" id="outline-view-toggle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>

            {/* Group by Category button */}
            <Button
              variant={grouping.length > 0 ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (grouping.length > 0) {
                  setGrouping([]);
                } else {
                  setGrouping(["category"]);
                }
              }}
            >
              {grouping.length > 0 ? "Ungroup" : "Group by Category"}
            </Button>

            {/* Month selector - only show when monthly view is selected */}
            {outlineViewType === "monthly" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-[200px] justify-between"
                  >
                    <span>
                      {selectedMonths.length === 0
                        ? "Select months"
                        : selectedMonths.length === currentYearMonths.length
                          ? "All months"
                          : `${selectedMonths.length} month${selectedMonths.length > 1 ? "s" : ""} selected`}
                    </span>
                    <IconChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-4" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">
                        Select Months
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedMonths([...currentYearMonths]);
                          }}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedMonths([]);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {currentYearMonths.map((month) => (
                        <div
                          key={month}
                          className="flex items-center space-x-2 py-1"
                        >
                          <Checkbox
                            id={`month-${month}`}
                            checked={selectedMonths.includes(month)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMonths([...selectedMonths, month]);
                              } else {
                                setSelectedMonths(
                                  selectedMonths.filter((m) => m !== month)
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`month-${month}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {formatMonthNumber(month)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Top Right: Customize Columns and Add Cost */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddCostModalOpen(true)}
            >
              <IconPlus />
              <span className="hidden lg:inline">Add Cost</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div
          className="overflow-hidden rounded-lg border"
          key={outlineViewType}
        >
          <Table>
            {groupedData ? (
              // Grouped view - only Category, Value, Status
              <>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-1/3">Category</TableHead>
                    <TableHead className="w-1/3 text-right">Value</TableHead>
                    <TableHead className="w-1/3 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedData.map((group) => {
                    const statusText =
                      group.hasActive && group.hasInactive
                        ? "Mixed"
                        : group.hasActive
                          ? "Active 🔥"
                          : "Inactive";
                    const statusVariant =
                      group.hasActive && !group.hasInactive
                        ? "default"
                        : "secondary";

                    return (
                      <TableRow key={group.category} className="font-medium">
                        <TableCell className="w-1/3">
                          <Badge
                            variant="outline"
                            className="text-muted-foreground px-1.5"
                          >
                            {group.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-1/3 text-right">
                          {formatCurrency(group.totalValue)}
                        </TableCell>
                        <TableCell className="w-1/3 text-center">
                          <Badge variant={statusVariant} className="px-1.5">
                            {statusText}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </>
            ) : (
              // Regular view - all columns
              <>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => {
                      // Handle regular rows
                      return (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </>
            )}
          </Table>
        </div>
      </>
    );
  };

  // Render time series table
  const renderTimeSeriesTable = (view: "monthly" | "yearly") => {
    const periods = view === "monthly" ? months : years;

    return (
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-background">
                Cost Item
              </TableHead>
              <TableHead className="sticky left-0 z-10 bg-background">
                Category
              </TableHead>
              {periods.map((period) => (
                <TableHead key={period} className="text-center min-w-[100px]">
                  {view === "monthly" ? `Month ${period}` : `Year ${period}`}
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const total = periods.reduce(
                (sum, period) =>
                  sum + calculateCostForPeriod(item, period, view),
                0
              );

              return (
                <TableRow key={item.id}>
                  <TableCell className="sticky left-0 z-10 bg-background font-medium">
                    {item.title}
                  </TableCell>
                  <TableCell className="sticky left-0 z-10 bg-background">
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  {periods.map((period) => {
                    const cost = calculateCostForPeriod(item, period, view);
                    return (
                      <TableCell key={period} className="text-right">
                        {cost > 0 ? formatCurrency(cost) : "-"}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-medium">
                    {formatCurrency(total)}
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Total Row */}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={2} className="sticky left-0 z-10 bg-muted/50">
                Total
              </TableCell>
              {periods.map((period) => {
                const periodTotal = data.reduce(
                  (sum, item) =>
                    sum + calculateCostForPeriod(item, period, view),
                  0
                );
                return (
                  <TableCell key={period} className="text-right">
                    {formatCurrency(periodTotal)}
                  </TableCell>
                );
              })}
              <TableCell className="text-right">
                {formatCurrency(
                  data.reduce((sum, item) => {
                    return (
                      sum +
                      periods.reduce(
                        (itemSum, period) =>
                          itemSum + calculateCostForPeriod(item, period, view),
                        0
                      )
                    );
                  }, 0)
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="w-full flex-col justify-start gap-6">
      {/* Outline Table - Always Visible */}
      <div className="space-y-4 px-4 lg:px-6">{renderOutlineTable()}</div>

      {/* Monthly/Yearly Tabs - Between Outline and Timeline */}
      <Tabs
        defaultValue="monthly"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="px-4 mt-8 lg:px-6">
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </div>

        {/* Monthly Timeline Table */}
        <TabsContent
          value="monthly"
          className="relative flex flex-col gap-6 overflow-auto px-4 lg:px-6"
        >
          <div className="space-y-2">{renderTimeSeriesTable("monthly")}</div>
        </TabsContent>

        {/* Yearly Timeline Table */}
        <TabsContent
          value="yearly"
          className="relative flex flex-col gap-6 overflow-auto px-4 lg:px-6"
        >
          <div>{renderTimeSeriesTable("yearly")}</div>
        </TabsContent>
      </Tabs>
      {scenarioId && (
        <AddCostModal
          open={isAddCostModalOpen}
          onOpenChange={setIsAddCostModalOpen}
          scenarioId={scenarioId}
        />
      )}
    </div>
  );
}

function TableCellViewer({ item }: { item: CostItem }) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.title}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.title}</DrawerTitle>
          <DrawerDescription>Edit cost item details</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Cost Item Information
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Update the details for this cost item below.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="title">Title</Label>
              <Input id="title" defaultValue={item.title} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="category">Category</Label>
                <Select defaultValue={item.category}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="frequency">Frequency</Label>
                <Select defaultValue={item.frequency}>
                  <SelectTrigger id="frequency" className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="HALF_YEARLY">Half Yearly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                    <SelectItem value="ONE_TIME">One Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="annualValue">Annual Value</Label>
              <Input
                id="annualValue"
                type="number"
                defaultValue={item.annualValue}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="startAt">Start Month</Label>
                <Input id="startAt" type="number" defaultValue={item.startAt} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="endsAt">
                  End Month (leave empty for until end)
                </Label>
                <Input
                  id="endsAt"
                  type="number"
                  defaultValue={item.endsAt ?? ""}
                  placeholder="Until end"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="isActive" defaultChecked={item.isActive} />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
