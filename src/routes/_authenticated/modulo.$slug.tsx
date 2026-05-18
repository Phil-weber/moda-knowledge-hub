// Placeholder do módulo — será implementado na próxima fase.
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/modulo/$slug")({
  component: ModulePage,
});

function ModulePage() {
  const { slug } = Route.useParams();
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

  return (
    <div className="mx-auto max-w-[1100px] px-10 py-10">
      <h1 className="text-[20px]" style={{ fontWeight: 500 }}>
        {mod?.name ?? slug}
      </h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--ink-soft)" }}>
        Conteúdo deste módulo será implementado na próxima fase (arquivos, filtros,
        trilha de onboarding e upload).
      </p>
    </div>
  );
}
