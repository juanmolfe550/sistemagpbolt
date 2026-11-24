import {
  createRouter as createTanstackRouter,
  createRootRouteWithContext,
  createRoute,
  createHashHistory,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AuthContext } from "./lib/auth";
import { AppLayout } from "./routes/-components/AppLayout";
import { LoginPage } from "./routes/login";
import { DashboardPage } from "./routes/dashboard";
import { GerenciasPage } from "./routes/gerencias";
import { ClientesPage } from "./routes/clientes";
import { EmpleadosPage } from "./routes/empleados";
import { TiposProduccionPage } from "./routes/tipos-produccion";
import { EstadosOpPage } from "./routes/estados-op";
import { EstadosOtPage } from "./routes/estados-ot";
import { OrdenesProduccionPage } from "./routes/ordenes-produccion";
import { OrdenProduccionDetallePage } from "./routes/ordenes-produccion.$id";
import { OrdenesTrabajoPage } from "./routes/ordenes-trabajo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const rootRoute = createRootRouteWithContext<{ auth: AuthContext }>()({
  component: () => <QueryClientProvider client={queryClient}></QueryClientProvider>,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_app",
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: DashboardPage,
});

const gerenciasRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/gerencias",
  component: GerenciasPage,
});

const clientesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/clientes",
  component: ClientesPage,
});

const empleadosRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/empleados",
  component: EmpleadosPage,
});

const tiposProduccionRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/tipos-produccion",
  component: TiposProduccionPage,
});

const estadosOpRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/estados-op",
  component: EstadosOpPage,
});

const estadosOtRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/estados-ot",
  component: EstadosOtPage,
});

const ordenesProduccionRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/ordenes-produccion",
  component: OrdenesProduccionPage,
});

const ordenProduccionDetalleRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/ordenes-produccion/$id",
  component: OrdenProduccionDetallePage,
});

const ordenesTrabajoRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/ordenes-trabajo",
  component: OrdenesTrabajoPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([
    dashboardRoute,
    gerenciasRoute,
    clientesRoute,
    empleadosRoute,
    tiposProduccionRoute,
    estadosOpRoute,
    estadosOtRoute,
    ordenesProduccionRoute,
    ordenProduccionDetalleRoute,
    ordenesTrabajoRoute,
  ]),
]);

export function createRouter(auth: AuthContext) {
  return createTanstackRouter({
    routeTree,
    context: { auth },
    history: createHashHistory(),
    defaultPreload: "intent",
  });
}

export type Router = ReturnType<typeof createRouter>;
