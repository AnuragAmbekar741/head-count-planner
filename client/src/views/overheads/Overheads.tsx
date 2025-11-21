import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export default function Overheads() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground text-lg">
          Start planning your headcount and costs to track your runway
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate({ to: "/dashboard/scenario" })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create Scenario
            </CardTitle>
            <CardDescription>
              Plan your costs and headcount for different scenarios
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate({ to: "/dashboard/scenario" })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              View Scenarios
            </CardTitle>
            <CardDescription>
              Review and manage your existing scenarios
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate({ to: "/dashboard/pipelines" })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Analyze Data
            </CardTitle>
            <CardDescription>
              Compare scenarios and analyze your financial health
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
