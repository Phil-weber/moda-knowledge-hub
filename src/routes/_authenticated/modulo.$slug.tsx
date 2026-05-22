// Tela de módulo: header + tabs + trilha de onboarding + lista real de arquivos.
import { useRef, useState } from "react";
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
import { OnboardingEditorPanel } from "@/components/OnboardingEditorPanel";
import { useDocs, type Doc, type DocType } from "@/lib/docs-context";

export const Route = createFileRoute("/_authenticated/modulo/$slug")({
  component: ModulePage,
});

type LegacyType = "PDF" | "Vídeo" | "PPT" | "DOC";

interface TypeStyle {
  bg: string;
  color: string;
  Icon: LucideIcon;
  label: string;
}

const LEGACY_TYPE_STYLES: Record<LegacyType, TypeStyle> = {
  PDF: { bg: "#FFF5F5", color: "#E57373", Icon: FileText, label: "PDF" },
  "Vídeo": { bg: "#F0F4FF", color: "#6B9CF7", Icon: Play, label: "VÍDEO" },
  PPT: { bg: "#FFF8F0", color: "#F4A460", Icon: Presentation, label: "PPT" },
  DOC: { bg: "#F0F6FF", color: "#5BA0D0", Icon: FileIcon, label: "DOC" },
};

interface OnboardingStep {
  id: number;
  title: string;
  type: LegacyType;
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

const TAB_TYPE: Record<Exclude<Tab, "Todos">, DocType> = {
  PDF: "pdf",
  "Vídeo": "video",
  Apresentação: "ppt",
  Documento: "doc",
};

function ModulePage() {
  const { slug } = Route.useParams();
  const [activeTab, setActiveTab] = useState<Tab>("Todos");
  const [preview, setPreview] = useState<Doc | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const { docs, addDoc, removeDoc } = useDocs();
  const all = docs[slug] ?? [];

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

  const filtered =
    activeTab === "Todos" ? all : all.filter((d) => d.type === TAB_TYPE[activeTab]);

  return (
    <div className="flex h-full min-h-full">
      <div className="flex h-full min-h-full flex-1 flex-col" style={{ background: "#FAFAFA" }}>
        {/* Header */}
        <div className="bg-white" style={{ borderBottom: "0.5px solid #E8E8E8", padding: "20px 22px 0" }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[20px]" style={{ fontWeight: 500, color: "#111" }}>
                {mod?.name ?? slug}
              </h1>
              <div className="mt-1 text-[12px]" style={{ color: "#AAA" }}>
                {all.length} arquivos
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowUpload((v) => !v)}
              className="flex items-center gap-1.5 px-3 text-[13px] text-white transition-colors duration-150"
              style={{ background: "#111", height: 30, borderRadius: 7 }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Adicionar
            </button>
          </div>

          {all.length > 0 && (
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
          )}
          {all.length === 0 && <div style={{ height: 16 }} />}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 px-6 py-6">
          <OnboardingTrack
            editorOpen={editorOpen}
            onToggleEditor={() => setEditorOpen((v) => !v)}
          />

          {showUpload && (
            <div className="mt-4">
              <UploadZone
                onUpload={(doc) => {
                  addDoc(slug, doc);
                  setShowUpload(false);
                }}
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <div
              className="mt-4 flex flex-col items-center justify-center"
              style={{ padding: "60px 20px" }}
            >
              <Upload size={36} strokeWidth={1.25} style={{ color: "#CCCCCC" }} />
              <p className="mt-3 text-[13px]" style={{ color: "#BBBBBB" }}>
                Nenhum arquivo ainda. Clique em Adicionar para começar.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {filtered.map((d) => (
                <DocCard
                  key={d.id}
                  doc={d}
                  onDelete={(id) => removeDoc(slug, id)}
                  onPreview={() => setPreview(d)}
                />
              ))}
            </div>
          )}
        </div>

        <PdfPreviewModal
          open={!!preview && preview.type === "pdf"}
          onClose={() => setPreview(null)}
          fileName={preview?.title ?? ""}
          metadata={
            preview
              ? `${preview.type.toUpperCase()} · ${formatSize(preview.file_size)} · ${formatDate(preview.created_at)}`
              : ""
          }
          fileUrl={preview?.file_url ?? ""}
        />
      </div>

      <OnboardingEditorPanel open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  );
}

// ---------- helpers ----------

function formatSize(b: number): string {
  if (!b) return "";
  if (b < 1024) return `${b}B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1048576).toFixed(1)}MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

// ---------- UploadZone ----------

const toBase64 = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      res(result.split(",")[1] ?? "");
    };
    r.onerror = rej;
    r.readAsDataURL(f);
  });


const DOC_TYPES: Array<{ value: DocType; label: string; accept: string }> = [
  { value: "pdf", label: "PDF", accept: ".pdf" },
  { value: "video", label: "Vídeo", accept: ".mp4,.mov,.avi,.webm" },
  { value: "ppt", label: "PowerPoint", accept: ".ppt,.pptx" },
  { value: "doc", label: "Documento", accept: ".doc,.docx" },
];

function UploadZone({ onUpload }: { onUpload: (doc: Doc) => void }) {
  const [drag, setDrag] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocType>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (["mp4", "mov", "avi", "webm"].includes(ext)) setType("video");
    else if (["ppt", "pptx"].includes(ext)) setType("ppt");
    else if (["doc", "docx"].includes(ext)) setType("doc");
    else setType("pdf");
  };

  const submit = async () => {
    if (!file || !title.trim()) return;
    setLoading(true);
    const url = URL.createObjectURL(file);
    let file_data: string | undefined;
    if (type === "pdf") {
      file_data = await toBase64(file);
    }
    onUpload({
      id: Date.now().toString(),
      title: title.trim(),
      type,
      file_url: url,
      file_name: file.name,
      file_size: file.size,
      created_at: new Date().toISOString(),
      file_data,
    });
    setTitle("");
    setFile(null);
    setType("pdf");
    setLoading(false);
  };

  const sel = DOC_TYPES.find((t) => t.value === type);
  const ok = !!file && title.trim().length > 0;

  return (
    <div
      style={{
        background: "#fafafa",
        border: "0.5px solid #e8e8e8",
        borderRadius: "12px",
        padding: "18px",
        marginBottom: "16px",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          color: "#cccccc",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        Adicionar arquivo
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do arquivo..."
          style={{
            padding: "8px 12px",
            border: "0.5px solid #e0e0e0",
            borderRadius: "7px",
            fontSize: "13px",
            outline: "none",
            fontFamily: "inherit",
            background: "#fff",
          }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as DocType)}
          style={{
            padding: "8px 12px",
            border: "0.5px solid #e0e0e0",
            borderRadius: "7px",
            fontSize: "13px",
            outline: "none",
            fontFamily: "inherit",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files[0]);
        }}
        onClick={() => ref.current?.click()}
        style={{
          border: `1.5px dashed ${drag ? "#111111" : "#d8d8d8"}`,
          borderRadius: "10px",
          padding: "24px",
          textAlign: "center",
          cursor: "pointer",
          background: drag ? "#f5f5f5" : "#ffffff",
          transition: "all 0.15s ease",
          marginBottom: "10px",
        }}
      >
        <input
          ref={ref}
          type="file"
          accept={sel?.accept}
          style={{ display: "none" }}
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <div style={{ fontSize: "24px", color: "#cccccc", marginBottom: "8px" }}>↑</div>
        <p style={{ fontSize: "13px", color: file ? "#111" : "#888" }}>
          {file ? <strong>{file.name}</strong> : "Arraste ou clique para selecionar"}
        </p>
        {!file && (
          <p style={{ fontSize: "11px", color: "#bbbbbb", marginTop: "3px" }}>
            {sel?.accept?.replace(/\./g, "").toUpperCase()}
          </p>
        )}
      </div>

      <button
        onClick={submit}
        disabled={!ok || loading}
        style={{
          width: "100%",
          padding: "10px",
          border: "none",
          borderRadius: "8px",
          background: ok ? "#111111" : "#e8e8e8",
          color: ok ? "#ffffff" : "#bbbbbb",
          fontSize: "13px",
          fontWeight: 500,
          cursor: ok ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          transition: "all 0.15s ease",
        }}
      >
        {loading ? "Adicionando..." : "Adicionar ao módulo"}
      </button>
    </div>
  );
}

// ---------- DocCard ----------

const TYPE_META: Record<DocType, { label: string; bg: string; color: string }> = {
  pdf: { label: "PDF", bg: "#FFF0F0", color: "#E57373" },
  video: { label: "VÍDEO", bg: "#F0F4FF", color: "#6B9CF7" },
  ppt: { label: "PPT", bg: "#FFF8F0", color: "#F4A460" },
  doc: { label: "DOC", bg: "#F0F6FF", color: "#5BA0D0" },
};

function DocCard({
  doc,
  onDelete,
  onPreview,
}: {
  doc: Doc;
  onDelete: (id: string) => void;
  onPreview: () => void;
}) {
  const meta = TYPE_META[doc.type] ?? TYPE_META.doc;

  const open = () => {
    if (doc.type === "pdf") {
      onPreview();
      return;
    }
    if (doc.type === "video") {
      window.open(doc.file_url, "_blank");
    } else {
      const a = document.createElement("a");
      a.href = doc.file_url;
      a.download = doc.file_name || doc.title;
      a.click();
    }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = doc.file_url;
    a.download = doc.file_name || doc.title;
    a.click();
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "0.5px solid #e8e8e8",
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        transition: "border-color 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#999999")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8e8e8")}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "8px",
          background: meta.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, color: meta.color }}>
          {meta.label.slice(0, 3)}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "#111111",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "3px",
          }}
        >
          {doc.title}
        </p>
        <p style={{ fontSize: "11px", color: "#bbbbbb" }}>
          <span style={{ color: meta.color, fontWeight: 500 }}>{meta.label}</span>
          {doc.file_size ? ` · ${formatSize(doc.file_size)}` : ""}
          {` · ${formatDate(doc.created_at)}`}
        </p>
      </div>

      <div style={{ display: "flex", gap: "6px" }}>
        <button
          onClick={open}
          title="Visualizar"
          style={iconBtn}
        >
          <Eye size={13} strokeWidth={1.5} />
        </button>
        <button
          onClick={download}
          title="Download"
          style={iconBtn}
        >
          <Download size={13} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => onDelete(doc.id)}
          title="Remover"
          style={{ ...iconBtn, color: "#cccccc" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#fca5a5";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e0e0e0";
            e.currentTarget.style.color = "#cccccc";
          }}
        >
          <Trash size={13} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: "28px",
  height: "28px",
  border: "0.5px solid #e0e0e0",
  borderRadius: "6px",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#666",
};

// ---------- Onboarding ----------

function OnboardingTrack({
  editorOpen,
  onToggleEditor,
}: {
  editorOpen: boolean;
  onToggleEditor: () => void;
}) {
  const total = ONBOARDING_STEPS.length;
  const done = ONBOARDING_STEPS.filter((s) => s.status === "done").length;
  const pct = (done / total) * 100;

  return (
    <div
      className="bg-white"
      style={{ border: "0.5px solid #E8E8E8", borderRadius: 10, padding: "14px 16px" }}
    >
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
            onClick={onToggleEditor}
            className="px-2.5 text-[11px] transition-colors duration-150"
            style={{
              height: 26,
              border: editorOpen ? "0.5px solid #111" : "0.5px solid #E0E0E0",
              borderRadius: 6,
              color: editorOpen ? "#FFF" : "#555",
              background: editorOpen ? "#111" : "#FFF",
              fontWeight: editorOpen ? 500 : 400,
            }}
          >
            {editorOpen ? "Editando" : "Editar trilha"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {ONBOARDING_STEPS.map((step) => {
          const style = LEGACY_TYPE_STYLES[step.type];
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
