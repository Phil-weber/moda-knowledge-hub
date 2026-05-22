// Layout autenticado — guarda de rota.
// Redireciona para /login se não houver sessão; renderiza topbar + sidebar.
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { DocsProvider } from "@/lib/docs-context";
import { TrailsProvider } from "@/lib/trails-context";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/AppTopbar";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-[12px]" style={{ color: "var(--mute)" }}>
          Carregando…
        </span>
      </div>
    );
  }

  return (
    <DocsProvider>
      <TrailsProvider>
        <div className="flex min-h-screen w-full" style={{ background: "var(--surface)" }}>
          <AppSidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <AppTopbar />
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </TrailsProvider>
    </DocsProvider>
  );
}
