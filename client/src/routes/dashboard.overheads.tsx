import { createFileRoute } from "@tanstack/react-router";
import Overheads from "@/views/overheads/Overheads";

export const Route = createFileRoute("/dashboard/overheads")({
  component: Overheads,
});
