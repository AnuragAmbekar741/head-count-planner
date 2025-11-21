import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/views/landing/Landing";

export const Route = createFileRoute("/")({
  component: Landing,
});
