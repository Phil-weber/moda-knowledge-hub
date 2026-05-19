// Estrutura base da tela de módulo.
// Header + tabs de filtro + grid de arquivos (vazio por enquanto).
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/modulo/$slug")({
  component: ModulePage,
});

const TABS = ["Todos", "PDF", "Vídeo", "Apresentação", "Documento"] as const;
type Tab = (typeof TABS)[number];

function ModulePage() {
  const { slug } = Route.useParams();
  const [activeTab, setActiveTab] = useState<Tab>("Todos");

  const { data: mod } = useQuery({
    queryKey: ["module", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const fileCount = 0;

  return (
    <div className="flex h-full min-h-full flex-col" style={{ background: "#FAFAFA" }}>
      {/* Header */}
      <div
        className="bg-white"
        style={{ borderBottom: "0.5px solid #E8E8E8", padding: "20px 22px 0" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[20px]" style={{ fontWeight: 500, color: "#111" }}>
              {mod?.name ?? slug}
            </h1>
            <div className="mt-1 text-[12px]" style={{ color: "#AAA" }}>
              {fileCount} arquivos
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 text-[13px] text-white transition-colors duration-150"
            style={{
              background: "#111",
              height: 30,
              borderRadius: 7,
            }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Adicionar
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-6">
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="pb-2.5 text-[13px] transition-colors duration-150"
                style={{
                  color: active ? "#111" : "#AAA",
                  fontWeight: active ? 500 : 400,
                  borderBottom: active ? "2px solid #111" : "2px solid transparent",
                  marginBottom: "-0.5px",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex flex-col items-center gap-3">
          <Upload size={36} strokeWidth={1.25} style={{ color: "#CCCCCC" }} />
          <p className="text-center text-[13px]" style={{ color: "#BBBBBB" }}>
            Nenhum arquivo ainda. Clique em Adicionar para começar.
          </p>
        </div>
      </div>
    </div>
  );
}
