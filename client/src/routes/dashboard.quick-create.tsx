import { createFileRoute } from "@tanstack/react-router";
import QuickCreate from "@/views/quick-create/QuickCreate.tsx";

export const Route = createFileRoute("/dashboard/quick-create")({
  component: RouteComponent,
});

function RouteComponent() {
  return <QuickCreate />;
}
