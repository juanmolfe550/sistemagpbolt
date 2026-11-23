import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Factory, LayoutDashboard, ClipboardList, Wrench, Users, Building2, UserCog, Tags, ListChecks, FileBarChart, LogOut, Briefcase, HardHat, BadgeCheck, ShieldCheck, FolderKanban } from "lucide-react";
import { useAuth, ROLE_LABEL, rutasPermitidas, inicioDe } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const nav = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard },
  { to: "/ordenes-produccion", label: "Órdenes de producción", icon: ClipboardList },
  { to: "/ordenes-trabajo", label: "Órdenes de trabajo", icon: Wrench },
  { to: "/proyectos", label: "Líder de Proyecto", icon: FolderKanban },
  { to: "/taller", label: "Ejecución (Taller)", icon: HardHat },
  { to: "/calidad", label: "Gestión de la Calidad", icon: BadgeCheck },
  { to: "/shi", label: "Seguridad e Higiene (SHI)", icon: ShieldCheck, FolderKanban },
  { to: "/reportes", label: "Reportes", icon: FileBarChart },
] as const;

const catalogos = [
  { slug: "clientes", label: "Clientes", icon: Briefcase },
  { slug: "empleados", label: "Empleados", icon: Users },
  { slug: "gerencias", label: "Gerencias / Proyectos", icon: Building2 },
  { slug: "tipos-produccion", label: "Tipos de producción", icon: Tags },
  { slug: "estados-op", label: "Estados de OP", icon: ListChecks },
  { slug: "estados-ot", label: "Estados de OT", icon: ListChecks },
];

const linkCls =
  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const activeCls = "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary";

function AppLayout() {
  const { session, loading, roles, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  const permitidas = rutasPermitidas(roles);
  const path = useLocation({ select: (l) => l.pathname });
  const bloqueada = roles.length > 0 && permitidas !== null && !permitidas.some((p) => path.startsWith(p));
  useEffect(() => {
    if (bloqueada) navigate({ to: inicioDe(roles) as "/panel", replace: true });
  }, [bloqueada, roles, navigate]);

  if (!session || bloqueada) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex min-h-screen">
      <aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-sidebar">
        <div className="flex items-center gap-2 px-4 py-5 text-sidebar-accent-foreground">
          <Factory className="h-5 w-5 text-sidebar-primary" />
          <span className="font-semibold">Producción</span>
        </div>
        <div className="hazard-stripe h-1" />
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {nav.filter((n) => !permitidas || permitidas.includes(n.to)).map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: activeCls }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
          {!permitidas && (
            <>
              <div className="px-3 pb-1 pt-4 font-code text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Catálogos</div>
              {catalogos.map((c) => (
                <Link key={c.slug} to="/catalogos/$tabla" params={{ tabla: c.slug }} className={linkCls} activeProps={{ className: activeCls }}>
                  <c.icon className="h-4 w-4" /> {c.label}
                </Link>
              ))}
            </>
          )}
          {isAdmin && (
            <>
              <div className="px-3 pb-1 pt-4 font-code text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Administración</div>
              <Link to="/usuarios" className={linkCls} activeProps={{ className: activeCls }}>
                <UserCog className="h-4 w-4" /> Usuarios y roles
              </Link>
            </>
          )}
        </nav>
        <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground">
          <div className="truncate">{session.user.email}</div>
          <div className="text-sidebar-primary">{roles.map((r) => ROLE_LABEL[r]).join(", ") || "…"}</div>
          <button onClick={signOut} className="mt-2 flex items-center gap-1.5 hover:text-sidebar-accent-foreground">
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
