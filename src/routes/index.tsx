import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { user, loading } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Sistema de Producción
        </h1>
        <p className="mt-2 text-muted-foreground">
          {loading
            ? "Cargando..."
            : user
              ? `Bienvenido, ${user.nombre ?? user.email}`
              : "La app está funcionando. Falta construir las pantallas."}
        </p>
      </div>
    </div>
  );
}
