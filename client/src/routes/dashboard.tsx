import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/utils/route-guard";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  component: DashboardLayout,
});
