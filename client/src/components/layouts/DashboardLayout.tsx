import { Outlet } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { ModeToggle } from "@/components/toggle-theme/ToggleTheme";

export default function DashboardLayout() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Head Count Planner</h1>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <span>Welcome, {user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                </>
              )}
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
