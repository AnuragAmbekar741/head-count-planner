import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconGripVertical,
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
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
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

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

const columns: ColumnDef<CostItem>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
    header: () => <div className="w-full text-right">Annual Value</div>,
    cell: ({ row }) => (
      <div className="text-right">
        ${row.original.annualValue.toLocaleString()}
      </div>
    ),
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
    cell: ({ row }) => row.original.startAt,
  },
  {
    accessorKey: "endsAt",
    header: "End Month",
    cell: ({ row }) => row.original.endsAt ?? "Until end",
  },
  {
    accessorKey: "scenarioId",
    header: "Scenario",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.scenarioId}
      </Badge>
    ),
  },
];

function DraggableRow({ row }: { row: Row<CostItem> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable({ data: initialData }: { data: CostItem[] }) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [activeView, setActiveView] = React.useState<"monthly" | "yearly">(
    "monthly"
  );
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );

  // Calculate months/years for time series view
  const calculateTimeSeries = () => {
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
  };

  const { months, years } = calculateTimeSeries();

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

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  // Render outline table (always visible)
  const renderOutlineTable = () => (
    <>
      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
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
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
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
          </Table>
        </DndContext>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </>
  );

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
                        {cost > 0
                          ? `$${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : "-"}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-medium">
                    $
                    {total.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
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
                    $
                    {periodTotal.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                );
              })}
              <TableCell className="text-right">
                $
                {data
                  .reduce((sum, item) => {
                    return (
                      sum +
                      periods.reduce(
                        (itemSum, period) =>
                          itemSum + calculateCostForPeriod(item, period, view),
                        0
                      )
                    );
                  }, 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Tabs
      defaultValue="monthly"
      className="w-full flex-col justify-start gap-6"
      onValueChange={(value) => {
        if (value === "monthly" || value === "yearly") {
          setActiveView(value);
        }
      }}
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select
          value={activeView}
          onValueChange={(value) => {
            if (value === "monthly" || value === "yearly") {
              setActiveView(value);
            }
          }}
        >
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
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
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>

      {/* Monthly Tab - Outline Table + Monthly Time Series */}
      <TabsContent
        value="monthly"
        className="relative flex flex-col gap-6 overflow-auto px-4 lg:px-6"
      >
        {/* Outline Table - Always Visible */}
        <div className="space-y-4">{renderOutlineTable()}</div>

        {/* Monthly Time Series Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Monthly View</h3>
          {renderTimeSeriesTable("monthly")}
        </div>
      </TabsContent>

      {/* Yearly Tab - Outline Table + Yearly Time Series */}
      <TabsContent
        value="yearly"
        className="relative flex flex-col gap-6 overflow-auto px-4 lg:px-6"
      >
        {/* Outline Table - Always Visible */}
        <div className="space-y-4">{renderOutlineTable()}</div>

        {/* Yearly Time Series Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Yearly View</h3>
          {renderTimeSeriesTable("yearly")}
        </div>
      </TabsContent>
    </Tabs>
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
              <Label htmlFor="scenarioId">Scenario ID</Label>
              <Input id="scenarioId" defaultValue={item.scenarioId} />
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
