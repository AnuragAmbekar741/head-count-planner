import { Outlet } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";

export default function DashboardLayout() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Head Count Planner</h1>
            {user && (
              <div className="flex items-center gap-4">
                <span>Welcome, {user.name}</span>
                <span className="text-sm text-gray-500">{user.email}</span>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
