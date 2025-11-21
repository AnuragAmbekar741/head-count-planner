import { useState, useEffect, useMemo, useRef } from "react";
import {
  IconChevronDown,
  IconLayoutColumns,
  IconPlus,
  IconTrendingUp,
  IconChevronLeft,
  IconChevronRight,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AddCostModal } from "@/components/modal/AddCostModal";
import { formatCurrency } from "@/utils/number-format";
import type { TableItem } from "@/data/cost-item";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatMonthNumber } from "@/utils/month-utils";

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
  data: TableItem[]; // Change from CostItem[] to TableItem[]
  outlineViewType?: "monthly" | "annual";
  onOutlineViewTypeChange?: (value: "monthly" | "annual") => void;
  onSelectedMonthsChange?: (months: number[]) => void; // Add this prop
  scenarioId?: string; // Add this prop
}) {
  const [data, setData] = useState(() => initialData);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "startAt",
      desc: false, // Sort ascending (earliest month first)
    },
  ]);
  const [grouping, setGrouping] = useState<GroupingState>([]); // Add this state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [outlineViewType, setOutlineViewType] = useState<"monthly" | "annual">(
    externalOutlineViewType || "annual"
  );
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]); // Add this state
  const [isAddCostModalOpen, setIsAddCostModalOpen] = useState(false);

  // Sync with external state if provided
  useEffect(() => {
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

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const currentYearMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  const initializedForViewType = useRef<string>("");

  // Initialize selected months with current year months (1-12)
  useEffect(() => {
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
      // Select only January (month 1) when switching to monthly view
      setSelectedMonths([1]);
      initializedForViewType.current = viewKey;
    }
  }, [outlineViewType, currentYearMonths]);

  // Notify parent when selectedMonths changes
  useEffect(() => {
    if (onSelectedMonthsChange) {
      onSelectedMonthsChange(selectedMonths);
    }
  }, [selectedMonths, onSelectedMonthsChange]);

  // Helper to calculate first-year value based on startAt/endsAt (same as Pipeline)
  const calculateFirstYearValue = (item: TableItem): number => {
    if (!item.isActive) return 0;

    // Treat annualValue as annual rate, convert to monthly
    const monthly = item.annualValue / 12;
    const yearStartMonth = 1;
    const yearEndMonth = 12;

    // Calculate active months in first year
    const firstActive = Math.max(yearStartMonth, item.startAt);
    const lastActive =
      item.endsAt !== null ? Math.min(yearEndMonth, item.endsAt) : yearEndMonth;

    // If not active in first year at all
    if (firstActive > yearEndMonth || lastActive < yearStartMonth) {
      return 0;
    }

    const activeMonths = lastActive - firstActive + 1;
    return monthly * activeMonths;
  };

  // Calculate monthly value for selected months
  const calculateMonthlyValueForSelectedMonths = (item: TableItem): number => {
    if (selectedMonths.length === 0) return 0;
    if (!item.isActive) return 0;

    // Use same logic: treat annualValue as annual rate, convert to monthly
    const monthly = item.annualValue / 12;

    // Count how many of the selected months are within the item's active period
    const activeMonthsInSelection = selectedMonths.filter((month) => {
      // Check if month is after startAt
      if (month < item.startAt) return false;
      // Check if month is before endsAt (or endsAt is null)
      if (item.endsAt !== null && month > item.endsAt) return false;
      return true;
    }).length;

    return monthly * activeMonthsInSelection;
  };

  // Helper function to check if cost is active in selected months
  const isCostActiveInSelectedMonths = (item: TableItem): boolean => {
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
  const getGroupedData = (): Array<{
    category: string;
    items: TableItem[];
    totalValue: number;
    hasActive: boolean;
    hasInactive: boolean;
  }> => {
    const grouped = data.reduce(
      (acc, item) => {
        const category = item.category || "Uncategorized";
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

        // Calculate value for this item - use same logic for both views
        const itemValue =
          outlineViewType === "annual"
            ? calculateFirstYearValue(item)
            : calculateMonthlyValueForSelectedMonths(item);

        // For revenue, subtract from total (it's income)
        // For cost, add to total (it's expense)
        if (item.type === "revenue") {
          acc[category].totalValue -= itemValue; // Revenue reduces total
        } else {
          acc[category].totalValue += itemValue; // Cost increases total
        }

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
          items: TableItem[];
          totalValue: number;
          hasActive: boolean;
          hasInactive: boolean;
        }
      >
    );

    return Object.values(grouped);
  };

  // Define columns with dynamic value based on outlineViewType
  const columns: ColumnDef<TableItem>[] = useMemo(
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
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const item = row.original;
          const isRevenue = item.type === "revenue";
          return (
            <Badge
              variant={isRevenue ? "default" : "secondary"}
              className={isRevenue ? "bg-green-500" : ""}
            >
              {isRevenue ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Revenue
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Cost
                </>
              )}
            </Badge>
          );
        },
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
          const item = row.original;
          const isRevenue = item.type === "revenue";

          // Calculate value based on toggle
          const value =
            outlineViewType === "annual"
              ? calculateFirstYearValue(item)
              : calculateMonthlyValueForSelectedMonths(item);

          return (
            <div className="text-right">
              <Badge
                variant={isRevenue ? "default" : "destructive"}
                className={`px-1.5 ${
                  isRevenue
                    ? "bg-green-500 text-black"
                    : "bg-red-500 text-white"
                }`}
              >
                {isRevenue ? "+" : "-"}
                {formatCurrency(value)}
              </Badge>
            </div>
          );
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
              <span className="hidden lg:inline">Add</span>
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
                    <TableHead className="w-1/2">Category</TableHead>
                    <TableHead className="w-1/2 text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedData.map(
                    (group: {
                      category: string;
                      items: TableItem[];
                      totalValue: number;
                      hasActive: boolean;
                      hasInactive: boolean;
                    }) => {
                      return (
                        <TableRow key={group.category} className="font-medium">
                          <TableCell className="w-1/2">
                            <Badge
                              variant="outline"
                              className="text-muted-foreground px-1.5"
                            >
                              {group.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-1/2 text-right">
                            {(() => {
                              // Determine if this group has revenue or cost items
                              const hasRevenue = group.items.some(
                                (item) => item.type === "revenue"
                              );
                              const hasCost = group.items.some(
                                (item) => item.type === "cost"
                              );
                              const isRevenue = hasRevenue && !hasCost;
                              const isCost = hasCost && !hasRevenue;

                              // Use totalValue sign as fallback if mixed
                              const isPositive = group.totalValue >= 0;
                              const badgeVariant =
                                isRevenue || (isPositive && !isCost)
                                  ? "default"
                                  : "destructive";
                              const badgeClassName =
                                isRevenue || (isPositive && !isCost)
                                  ? "bg-green-500 text-black px-1.5"
                                  : "bg-red-500 text-white px-1.5";

                              return (
                                <Badge
                                  variant={badgeVariant}
                                  className={badgeClassName}
                                >
                                  {isRevenue || (isPositive && !isCost)
                                    ? "+"
                                    : "-"}
                                  {formatCurrency(Math.abs(group.totalValue))}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
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

  return (
    <div className="w-full flex-col justify-start gap-6">
      {/* Outline Table - Always Visible */}
      <div className="space-y-4 px-4 lg:px-6">
        {renderOutlineTable()}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{" "}
              to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{" "}
              of {table.getFilteredRowModel().rows.length} results
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Page</span>
              <span className="text-sm font-medium">
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

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

function TableCellViewer({ item }: { item: TableItem }) {
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
          <DrawerDescription>
            Edit {item.type === "revenue" ? "revenue" : "cost"} item details
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  {item.type === "revenue" ? "Revenue" : "Cost"} Item
                  Information
                  {item.type === "revenue" ? (
                    <IconTrendingUp className="size-4" />
                  ) : (
                    <IconTrendingUp className="size-4" />
                  )}
                </div>
                <div className="text-muted-foreground">
                  Update the details for this{" "}
                  {item.type === "revenue" ? "revenue" : "cost"} item below.
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
                <Select defaultValue={item.category || ""}>
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
