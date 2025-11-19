import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/utils/route-guard";
import DashboardView from "@/views/dashboard/Dashboard";

function Dashboard() {
  return <DashboardView />;
}

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  component: Dashboard,
});
