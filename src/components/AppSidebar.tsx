// Sidebar fixa do PLM Knowledge Hub.
// Carrega módulos do banco e destaca o item ativo conforme a rota.
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as Icons from "lucide-react";
import { Plus } from "lucide-react";

interface ModuleRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order_index: number;
}

function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Lib = Icons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>;
  const Cmp = Lib[name] ?? Icons.Square;
  return <Cmp className={className} strokeWidth={1.5} />;
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: modules = [] } = useQuery<ModuleRow[]>({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, name, slug, icon, order_index")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <aside
      className="flex h-full w-[220px] flex-col bg-white"
      style={{ borderRight: "0.5px solid var(--line)" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-start px-5 py-5">
        <svg width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M20 6c4 4 4 10 0 14 4 0 8 3 8 8 0 4-3 6-8 6s-8-2-8-6c0-5 4-8 8-8-4-4-4-10 0-14z"
            stroke="#111"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="20" r="1.2" fill="#111" />
        </svg>
        <span
          className="mt-2 text-[9px] uppercase"
          style={{ letterSpacing: "0.12em", color: "var(--mute)" }}
        >
          PLM KNOWLEDGE HUB
        </span>
      </div>

      {/* Lista de módulos */}
      <nav className="flex-1 overflow-y-auto py-2">
        {modules.map((m) => {
          const active = pathname === `/modulo/${m.slug}`;
          const isFaq = m.slug === "faq-ia";
          return (
            <Link
              key={m.id}
              to="/modulo/$slug"
              params={{ slug: m.slug }}
              className="flex items-center gap-3 px-4 py-2 text-[13px] transition-colors duration-150"
              style={{
                background: active ? "var(--ink)" : "transparent",
                color: active ? "#FFFFFF" : "var(--ink)",
                fontWeight: isFaq ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <ModuleIcon name={m.icon} className="h-4 w-4" />
              <span className="flex-1">{m.name}</span>
              {isFaq && (
                <span
                  className="rounded px-1.5 py-0.5 text-[9px]"
                  style={{
                    background: active ? "#FFFFFF" : "var(--ink)",
                    color: active ? "var(--ink)" : "#FFFFFF",
                    letterSpacing: "0.08em",
                  }}
                >
                  IA
                </span>
              )}
            </Link>
          );
        })}

        <div className="px-3 pt-3">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 rounded-md py-2 text-[12px] transition-colors duration-150"
            style={{
              border: "0.5px dashed #CCCCCC",
              color: "#BBBBBB",
              background: "transparent",
            }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Adicionar módulo
          </button>
        </div>
      </nav>

      <div
        className="px-5 py-3 text-[11px]"
        style={{ color: "#CCCCCC", borderTop: "0.5px solid var(--line)" }}
      >
        Suporte: philipp.weber / bruna.valadares
      </div>
    </aside>
  );
}
