import { createFileRoute } from "@tanstack/react-router";
import Scenario from "@/views/scenario/Scenario";

export const Route = createFileRoute("/dashboard/scenario")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Scenario />;
}
