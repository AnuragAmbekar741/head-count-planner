import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/utils/route-guard";
import DashboardLayout from "@/components/layouts/DashboardLayout";

function Dashboard() {
  return <DashboardLayout />;
}

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  component: Dashboard,
});
