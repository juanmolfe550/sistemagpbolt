import {
  createRouter,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  ),
});

export function getRouter() {
  return createRouter({
    routeTree,
    history: createHashHistory(),
  });
}

export type Router = ReturnType<typeof getRouter>;
