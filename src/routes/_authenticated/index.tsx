// Dashboard (rota raiz autenticada) — grid de módulos.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as Icons from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

interface ModuleRow {
  id: string;
  name: string | null;
  slug: string | null;
  icon: string;
  is_ai?: boolean | null;
}

const ICON_ALIAS: Record<string, string> = {
  box: "Package",
  truck: "Truck",
  calendar: "Calendar",
  scissors: "Scissors",
  color: "Palette",
  settings: "Settings2",
  shield: "ShieldCheck",
  chart: "BarChart2",
  bot: "Bot",
  file: "FileText",
  folder: "Inbox",
  help: "HelpCircle",
  video: "Video",
  slides: "Presentation",
};

function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Lib = Icons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>;
  const resolved = ICON_ALIAS[name] ?? name;
  const Cmp = Lib[resolved] ?? Lib[name] ?? Icons.Square;
  return <Cmp className={className} strokeWidth={1.25} />;
}

function DashboardPage() {
  const { data: modules = [], isLoading } = useQuery<ModuleRow[]>({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, name, slug, icon, order_index, is_ai")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-[1100px] px-10 py-10">
      <div className="mb-8">
        <h1 className="text-[22px]" style={{ fontWeight: 500, color: "var(--ink)" }}>
          Bem-vindo ao PLM Knowledge Hub
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--ink-soft)" }}>
          Selecione um módulo para acessar documentos, vídeos e trilhas de onboarding.
        </p>
      </div>

      {isLoading ? (
        <span className="text-[12px]" style={{ color: "var(--mute)" }}>
          Carregando módulos…
        </span>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {modules.map((m) => {
            const isAI = !!m.is_ai || m.slug === "faq-ia";
            return (
              <Link
                key={m.id}
                to="/modulo/$slug"
                params={{ slug: m.slug ?? m.id }}
                className="group flex flex-col gap-4 rounded-xl bg-white p-5 transition-colors duration-150"
                style={{ border: "0.5px solid var(--line)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--ink)";
                  e.currentTarget.style.borderWidth = "1px";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.borderWidth = "0.5px";
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <ModuleIcon name={m.icon} className="h-4 w-4" />
                  </div>
                  {isFaq && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] text-white"
                      style={{ background: "var(--ink)", letterSpacing: "0.08em" }}
                    >
                      IA
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-[14px]" style={{ fontWeight: 500, color: "var(--ink)" }}>
                    {m.name}
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: "var(--mute)" }}>
                    Acessar módulo
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
