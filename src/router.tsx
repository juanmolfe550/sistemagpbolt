import {
  createRouter,
  createRootRoute,
  createHashHistory,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth";

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

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Sistema de Producción</h1>
      <p>La app está cargando...</p>
    </div>
  ),
});

const routeTree = rootRoute.addChildren([indexRoute]);

export function getRouter() {
  return createRouter({
    routeTree,
    history: createHashHistory(),
  });
}

export type Router = ReturnType<typeof getRouter>;
