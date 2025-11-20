import Pipeline from "@/views/pipelines/Pipeline";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/pipelines")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Pipeline />;
}
