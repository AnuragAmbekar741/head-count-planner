import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryProvider } from "@/providers/QueryClient";
import { routeTree } from "./routeTree.gen";
import { ThemeProvider } from "./providers/ThemeProvider";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
