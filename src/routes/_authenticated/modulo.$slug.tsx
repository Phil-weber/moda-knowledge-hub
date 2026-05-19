// Tela de módulo: header + tabs + trilha de onboarding + grid de arquivos (mockados).
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Upload,
  FileText,
  Play,
  Presentation,
  File as FileIcon,
  Eye,
  Download,
  Trash,
  Route as RouteIcon,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";

// PDF público para preview dos arquivos PDF mockados.
const SAMPLE_PDF_URL = "https://pdfobject.com/pdf/sample.pdf";

export const Route = createFileRoute("/_authenticated/modulo/$slug")({
  component: ModulePage,
});

type FileType = "PDF" | "Vídeo" | "PPT" | "DOC";

interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: string;
  date: string;
}

interface TypeStyle {
  bg: string;
  color: string;
  Icon: LucideIcon;
  label: string;
}

const TYPE_STYLES: Record<FileType, TypeStyle> = {
  PDF: { bg: "#FFF5F5", color: "#E57373", Icon: FileText, label: "PDF" },
  "Vídeo": { bg: "#F0F4FF", color: "#6B9CF7", Icon: Play, label: "VÍDEO" },
  PPT: { bg: "#FFF8F0", color: "#F4A460", Icon: Presentation, label: "PPT" },
  DOC: { bg: "#F0F6FF", color: "#5BA0D0", Icon: FileIcon, label: "DOC" },
};

const MOCK_FILES: FileItem[] = [
  { id: "1", name: "Guia_TechPack_v3", type: "PDF", size: "2.1 MB", date: "12/05/2026" },
  { id: "2", name: "PLM_TechPack_Pricing", type: "Vídeo", size: "26.9 MB", date: "18/05/2026" },
  { id: "3", name: "Processos_Internos_2026", type: "PPT", size: "8.4 MB", date: "10/05/2026" },
  { id: "4", name: "Manual_Preenchimento", type: "DOC", size: "1.8 MB", date: "08/05/2026" },
];

interface OnboardingStep {
  id: number;
  title: string;
  type: FileType;
  meta: string;
  status: "done" | "active" | "pending";
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, title: "Intro ao Tech Pack", type: "PDF", meta: "PDF · 2.1 MB", status: "done" },
  { id: 2, title: "Aula: Estrutura de ficha", type: "Vídeo", meta: "Vídeo · 18 MB", status: "done" },
  { id: 3, title: "Apresentação de processos", type: "PPT", meta: "PPT · 8.4 MB", status: "active" },
  { id: 4, title: "Manual de preenchimento", type: "PDF", meta: "PDF · 1.8 MB", status: "pending" },
  { id: 5, title: "Revisão final", type: "Vídeo", meta: "Vídeo · 12 MB", status: "pending" },
];

const TABS = ["Todos", "PDF", "Vídeo", "Apresentação", "Documento"] as const;
type Tab = (typeof TABS)[number];

function ModulePage() {
  const { slug } = Route.useParams();
  const [activeTab, setActiveTab] = useState<Tab>("Todos");
  const [preview, setPreview] = useState<FileItem | null>(null);

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

  const fileCount = MOCK_FILES.length;

  return (
    <div className="flex h-full min-h-full flex-col" style={{ background: "#FAFAFA" }}>
      {/* Header */}
      <div className="bg-white" style={{ borderBottom: "0.5px solid #E8E8E8", padding: "20px 22px 0" }}>
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
            style={{ background: "#111", height: 30, borderRadius: 7 }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Adicionar
          </button>
        </div>

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
      <div className="flex-1 px-6 py-6">
        <OnboardingTrack />
        <div
          className="mt-4 grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}
        >
          {MOCK_FILES.map((f) => (
            <FileCard key={f.id} file={f} onPreview={() => setPreview(f)} />
          ))}
        </div>
      </div>

      <PdfPreviewModal
        open={!!preview && preview.type === "PDF"}
        onClose={() => setPreview(null)}
        fileName={preview?.name ?? ""}
        metadata={
          preview ? `${preview.type} · ${preview.size} · ${preview.date}` : ""
        }
        fileUrl={SAMPLE_PDF_URL}
      />
    </div>
  );
}

function FileCard({ file, onPreview }: { file: FileItem; onPreview: () => void }) {
  const style = TYPE_STYLES[file.type];
  const { Icon } = style;
  return (
    <div
      className="overflow-hidden bg-white transition-colors duration-150"
      style={{ border: "0.5px solid #E8E8E8", borderRadius: 10 }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#999999")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E8E8E8")}
    >
      {/* Thumb */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: 110, background: style.bg }}
      >
        <Icon size={36} strokeWidth={1.25} style={{ color: style.color }} />
        <span
          className="absolute right-2 top-2 px-1.5 py-0.5 text-[9px] uppercase text-white"
          style={{ background: style.color, borderRadius: 4, letterSpacing: "0.06em" }}
        >
          {style.label}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px" }}>
        <div
          className="truncate text-[12px]"
          style={{ fontWeight: 500, color: "#111" }}
          title={file.name}
        >
          {file.name}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "#BBBBBB" }}>
          {file.size} · {file.date}
        </div>

        <div className="mt-2.5 flex gap-1.5">
          {[Eye, Download, Trash].map((Cmp, i) => (
            <button
              key={i}
              type="button"
              onClick={Cmp === Eye && file.type === "PDF" ? onPreview : undefined}
              className="flex items-center justify-center transition-colors duration-150"
              style={{
                height: 26,
                width: 26,
                border: "0.5px solid #E8E8E8",
                borderRadius: 6,
                background: "#FFF",
                color: "#666",
              }}
              onMouseEnter={(e) => {
                if (Cmp === Trash) e.currentTarget.style.color = "#E57373";
                e.currentTarget.style.borderColor = "#999";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#666";
                e.currentTarget.style.borderColor = "#E8E8E8";
              }}
            >
              <Cmp size={13} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OnboardingTrack() {
  const total = ONBOARDING_STEPS.length;
  const done = ONBOARDING_STEPS.filter((s) => s.status === "done").length;
  const pct = (done / total) * 100;

  return (
    <div
      className="bg-white"
      style={{ border: "0.5px solid #E8E8E8", borderRadius: 10, padding: "14px 16px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RouteIcon size={14} strokeWidth={1.5} style={{ color: "#111" }} />
          <span className="text-[13px]" style={{ fontWeight: 500, color: "#111" }}>
            Trilha de onboarding
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ width: 80, height: 4, background: "#F0F0F0", borderRadius: 2 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "#111", borderRadius: 2 }} />
          </div>
          <span className="text-[11px]" style={{ color: "#AAA" }}>
            {done} de {total}
          </span>
          <button
            type="button"
            className="px-2.5 text-[11px] transition-colors duration-150"
            style={{
              height: 26,
              border: "0.5px solid #E0E0E0",
              borderRadius: 6,
              color: "#555",
              background: "#FFF",
            }}
          >
            Editar trilha
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {ONBOARDING_STEPS.map((step) => {
          const style = TYPE_STYLES[step.type];
          const { Icon } = style;
          const completed = step.status === "done";
          const isActive = step.status === "active";
          const opacity = step.status === "pending" ? 0.6 : 1;
          const borderColor = completed || isActive ? "#111" : "#E8E8E8";

          return (
            <div
              key={step.id}
              className="shrink-0 overflow-hidden bg-white"
              style={{
                width: 140,
                border: `${completed || isActive ? "1px" : "0.5px"} solid ${borderColor}`,
                borderRadius: 8,
                opacity,
              }}
            >
              <div
                className="relative flex items-center justify-center"
                style={{ height: 70, background: style.bg }}
              >
                <Icon size={24} strokeWidth={1.25} style={{ color: style.color }} />
                <div
                  className="absolute left-1.5 top-1.5 flex items-center justify-center text-[10px] text-white"
                  style={{ width: 18, height: 18, borderRadius: 999, background: "#111" }}
                >
                  {step.id}
                </div>
                {completed && (
                  <div
                    className="absolute right-1.5 top-1.5 flex items-center justify-center text-white"
                    style={{ width: 16, height: 16, borderRadius: 999, background: "#111" }}
                  >
                    <Check size={10} strokeWidth={2.5} />
                  </div>
                )}
              </div>
              <div style={{ padding: "7px 8px" }}>
                <div
                  className="truncate text-[11px]"
                  style={{ fontWeight: 500, color: "#111" }}
                  title={step.title}
                >
                  {step.title}
                </div>
                <div className="mt-0.5 text-[10px]" style={{ color: "#BBB" }}>
                  {step.meta}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
