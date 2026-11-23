import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestión de Producción" },
      { name: "description", content: "Control de órdenes de producción, órdenes de trabajo y catálogos." },
      { property: "og:title", content: "Gestión de Producción" },
      { property: "og:description", content: "Control de órdenes de producción, órdenes de trabajo y catálogos." },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading) navigate({ to: session ? "/panel" : "/login", replace: true });
  }, [loading, session, navigate]);
  return <div className="min-h-screen bg-sidebar" />;
}
