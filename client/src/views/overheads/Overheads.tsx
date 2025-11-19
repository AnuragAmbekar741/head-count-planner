import { DataTable } from "@/components/data-table/DataTable";
import { SectionCards } from "@/components/section-card/SectionCard";

import data from "@/data/data.json";

export default function Overheads() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <DataTable data={data} />
    </div>
  );
}
