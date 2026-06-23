// Tela de módulo: header + tabs + trilha de onboarding + lista real de arquivos.
import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { FileViewerModal } from "@/components/FileViewerModal";
import { TrailEditor } from "@/components/TrailEditor";
import type { Doc, DocType } from "@/lib/docs-context";
import { useAuth } from "@/contexts/AuthContext";
import * as filesService from "@/services/filesService";
import * as trailService from "@/services/trailService";
import * as tagsService from "@/services/tagsService";


export const Route = createFileRoute("/_authenticated/modulo/$slug")({
  component: ModulePage,
});

const TABS = ["Todos", "PDF", "Vídeo", "Apresentação", "Documento"] as const;
type Tab = (typeof TABS)[number];

const TAB_TYPE: Record<Exclude<Tab, "Todos">, DocType> = {
  PDF: "pdf",
  "Vídeo": "video",
  Apresentação: "ppt",
  Documento: "doc",
};

interface FileRow {
  id: string;
  module_id: string | null;
  title: string;
  type: string;
  storage_path: string;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  description?: string | null;
  tag?: string | null;
  tag_color?: string | null;
  cover_path?: string | null;
  view_count?: number | null;
}

function rowToDoc(r: FileRow, url: string): Doc {
  return {
    id: r.id,
    title: r.title,
    type: r.type as DocType,
    file_url: url,
    file_name: r.file_name ?? r.title,
    file_size: r.file_size ?? 0,
    created_at: r.created_at,
    description: r.description,
    tag: r.tag,
    tag_color: r.tag_color,
    cover_path: r.cover_path,
    view_count: r.view_count,
  };
}

function rowToDocBase(r: FileRow): Doc {
  return rowToDoc(r, "");
}


function ModulePage() {
  const { slug } = Route.useParams();
  if (slug === "faq-ia") return <FAQView />;
  return <RegularModule slug={slug} />;
}

function RegularModule({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Todos");
  const [view, setView] = useState<"mural" | "list" | "onboarding">("mural");
  const [preview, setPreview] = useState<Doc | null>(null);
  const [showTrailEditor, setShowTrailEditor] = useState(false);
  const [showUpload, setShowUpload] = useState(false);


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

  const moduleId = mod?.id;

  const { data: filesRaw = [], isLoading: filesLoading } = useQuery({
    queryKey: ["files", moduleId],
    enabled: !!moduleId,
    queryFn: async () => {
      const { data, error } = await filesService.getFiles(moduleId!);
      if (error) throw error;
      return (data ?? []) as FileRow[];
    },
  });

  const { data: trailIds = [] } = useQuery({
    queryKey: ["trail", moduleId],
    enabled: !!moduleId,
    queryFn: async () => {
      const { data, error } = await trailService.getTrail(moduleId!);
      if (error) throw error;
      return (data ?? []) as string[];
    },
  });

  const docs: Doc[] = useMemo(() => filesRaw.map(rowToDocBase), [filesRaw]);


  const fileById = new Map(filesRaw.map((r) => [r.id, r]));

  const trailSteps = trailIds
    .map((id) => docs.find((d) => d.id === id))
    .filter((d): d is Doc => Boolean(d));
  const completedIds = trailSteps
    .slice(0, Math.floor(trailSteps.length / 2))
    .map((d) => d.id);

  const filtered =
    activeTab === "Todos" ? docs : docs.filter((d) => d.type === TAB_TYPE[activeTab]);

  const openPreview = async (doc: Doc) => {
    const row = fileById.get(doc.id);
    if (!row) return;
    const { data: url, error } = await filesService.getFileUrl(row.storage_path);
    if (error || !url) {
      toast.error("Não foi possível abrir o arquivo");
      return;
    }
    filesService.incrementViewCount(row.id).then(() => {
      qc.invalidateQueries({ queryKey: ["files", moduleId] });
    });
    setPreview(rowToDoc(row, url));
  };

  const downloadDoc = async (doc: Doc) => {
    const row = fileById.get(doc.id);
    if (!row) return;
    const { data: url, error } = await filesService.getFileUrl(row.storage_path);
    if (error || !url) {
      toast.error("Erro ao baixar");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = row.file_name ?? row.title;
    a.target = "_blank";
    a.click();
  };

  const uploadMut = useMutation({
    mutationFn: async (p: {
      file: File;
      title: string;
      type: DocType;
      description?: string;
      tag?: string;
      tagColor?: string;
      coverFile?: File | null;
    }) => {
      if (!moduleId) throw new Error("Módulo não carregado");
      const { error } = await filesService.uploadFile(moduleId, p.file, {
        title: p.title,
        type: p.type,
        description: p.description,
        tag: p.tag,
        tagColor: p.tagColor,
        coverFile: p.coverFile,
        uploadedBy: user?.username ?? "anon",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Arquivo adicionado");
      qc.invalidateQueries({ queryKey: ["files", moduleId] });
      setShowUpload(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha no upload"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const row = fileById.get(id);
      if (!row) return;
      const { error } = await filesService.deleteFile(id, row.storage_path, row.cover_path);
      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Arquivo removido");
      qc.invalidateQueries({ queryKey: ["files", moduleId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao remover"),
  });

  const saveTrailMut = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!moduleId) return;
      const { error } = await trailService.saveTrail(moduleId, ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trilha salva");
      qc.invalidateQueries({ queryKey: ["trail", moduleId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar trilha"),
  });

  return (
    <div className="flex h-full min-h-full">
      <div className="flex h-full min-h-full flex-1 flex-col" style={{ background: "#FAFAFA" }}>
        <div className="bg-white" style={{ borderBottom: "0.5px solid #E8E8E8", padding: "20px 22px 0" }}>
          <div className="flex items-start justify-between">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
                <img
                  src="/logo.png"
                  alt=""
                  style={{ width: "22px", height: "22px", objectFit: "contain", filter: "invert(1)" }}
                />
                <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#111", margin: 0 }}>
                  {mod?.name ?? slug}
                </h1>
              </div>
              <div className="mt-1 text-[12px]" style={{ color: "#AAA" }}>
                {filesLoading ? "Carregando…" : `${docs.length} arquivos`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ViewToggle view={view} onChange={setView} />
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowUpload((v) => !v)}
                  className="flex items-center gap-1.5 px-3 text-[13px] text-white"
                  style={{ background: "#111", height: 30, borderRadius: 7 }}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Adicionar
                </button>
              )}
            </div>
          </div>


          {docs.length > 0 && (
            <div className="mt-4 flex gap-6">
              {TABS.map((tab) => {
                const active = tab === activeTab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className="pb-2.5 text-[13px]"
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
          {docs.length === 0 && <div style={{ height: 16 }} />}
        </div>

        <div className="flex-1 py-6" style={{ overflowY: "auto" }}>
          {showUpload && isAdmin && (
            <div style={{ padding: "0 22px 16px" }}>
              <UploadZone
                moduleId={moduleId ?? ""}
                loading={uploadMut.isPending}
                onUpload={(p) => uploadMut.mutate(p)}
              />
            </div>
          )}

          {view === "onboarding" && (
            <div style={{ padding: "0 22px 22px" }}>
              {trailSteps.length > 0 ? (
                <OnboardingTrack
                  steps={trailSteps}
                  completedIds={completedIds}
                  editorOpen={showTrailEditor}
                  onToggleEditor={() => setShowTrailEditor((v) => !v)}
                  canEdit={isAdmin}
                />
              ) : (
                <div
                  className="bg-white"
                  style={{
                    border: "0.5px dashed #E0E0E0",
                    borderRadius: 10,
                    padding: "20px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span className="text-[12px]" style={{ color: "#AAA" }}>
                    Nenhuma trilha de onboarding configurada.
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowTrailEditor(true)}
                      className="px-2.5 text-[11px]"
                      style={{
                        height: 26,
                        border: "0.5px solid #E0E0E0",
                        borderRadius: 6,
                        color: "#555",
                        background: "#FFF",
                      }}
                    >
                      Criar trilha
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {view !== "onboarding" && filtered.length === 0 && (
            <div
              className="flex flex-col items-center justify-center"
              style={{ padding: "60px 20px" }}
            >
              <Upload size={36} strokeWidth={1.25} style={{ color: "#CCCCCC" }} />
              <p className="mt-3 text-[13px]" style={{ color: "#BBBBBB" }}>
                {isAdmin
                  ? "Nenhum arquivo ainda. Clique em Adicionar para começar."
                  : "Nenhum arquivo disponível neste módulo."}
              </p>
            </div>
          )}

          {view === "mural" && filtered.length > 0 && (
            <MuralGrid
              files={filtered}
              isAdmin={isAdmin}
              onView={openPreview}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          )}

          {view === "list" && filtered.length > 0 && (
            <ListView
              files={filtered}
              isAdmin={isAdmin}
              onView={openPreview}
              onDownload={downloadDoc}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          )}
        </div>

        <FileViewerModal open={!!preview} onClose={() => setPreview(null)} doc={preview} />
      </div>


      {showTrailEditor && isAdmin && (
        <TrailEditor
          moduleId={slug}
          allFiles={docs}
          trailIds={trailIds}
          onSave={(ids) => saveTrailMut.mutate(ids)}
          onClose={() => setShowTrailEditor(false)}
        />
      )}
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

const DOC_TYPES: Array<{ value: DocType; label: string; accept: string }> = [
  { value: "pdf", label: "PDF", accept: ".pdf" },
  { value: "video", label: "Vídeo", accept: ".mp4,.mov,.avi,.webm" },
  { value: "ppt", label: "PowerPoint", accept: ".ppt,.pptx" },
  { value: "doc", label: "Documento", accept: ".doc,.docx" },
];

interface UploadPayload {
  file: File;
  title: string;
  type: DocType;
  description?: string;
  tag?: string;
  tagColor?: string;
  coverFile?: File | null;
}

function UploadZone({
  onUpload,
  loading,
  moduleId,
}: {
  onUpload: (p: UploadPayload) => void;
  loading?: boolean;
  moduleId?: string;
}) {
  const [drag, setDrag] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<DocType>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [tagId, setTagId] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const { data: tagsData } = useQuery({
    queryKey: ["file_tags", moduleId],
    enabled: !!moduleId,
    queryFn: async () => {
      const { data } = await tagsService.getTagsForModule(moduleId!);
      return data ?? [];
    },
  });
  const tags = tagsData ?? [];

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

  const pickCover = (f: File | undefined | null) => {
    if (!f) return;
    setCoverFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const submit = () => {
    if (!file || !title.trim() || loading) return;
    const selectedTag = tags.find((t) => t.id === tagId);
    onUpload({
      file,
      title: title.trim(),
      type,
      description: description.trim() || undefined,
      tag: selectedTag?.label,
      tagColor: selectedTag?.color,
      coverFile,
    });
  };

  const sel = DOC_TYPES.find((t) => t.value === type);
  const ok = !!file && title.trim().length > 0 && !loading;

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
          style={inputStyle}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as DocType)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, 120))}
        placeholder="Em uma linha, o que esse arquivo entrega..."
        rows={2}
        maxLength={120}
        style={{ ...inputStyle, width: "100%", resize: "none", marginBottom: 10 }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <select
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">Categoria (opcional)</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            ref={coverRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={(e) => pickCover(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            style={{
              ...inputStyle,
              cursor: "pointer",
              flex: 1,
              textAlign: "left",
              color: coverFile ? "#111" : "#888",
            }}
          >
            {coverFile ? coverFile.name : "Capa (opcional)"}
          </button>
          {coverPreview && (
            <img
              src={coverPreview}
              alt=""
              style={{
                width: 60,
                height: 60,
                objectFit: "cover",
                borderRadius: 6,
                border: "0.5px solid #e0e0e0",
              }}
            />
          )}
        </div>
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
        disabled={!ok}
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
        }}
      >
        {loading ? "Enviando…" : "Adicionar ao módulo"}
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "0.5px solid #e0e0e0",
  borderRadius: "7px",
  fontSize: "13px",
  outline: "none",
  fontFamily: "inherit",
  background: "#fff",
};


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
  onDownload,
  canDelete,
}: {
  doc: Doc;
  onDelete: (id: string) => void;
  onPreview: () => void;
  onDownload: () => void;
  canDelete: boolean;
}) {
  const meta = TYPE_META[doc.type] ?? TYPE_META.doc;
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
        <button onClick={onPreview} title="Visualizar" style={iconBtn}>
          <Eye size={13} strokeWidth={1.5} />
        </button>
        <button onClick={onDownload} title="Download" style={iconBtn}>
          <Download size={13} strokeWidth={1.5} />
        </button>
        {canDelete && (
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
        )}
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
  steps,
  completedIds,
  editorOpen,
  onToggleEditor,
  canEdit,
}: {
  steps: Doc[];
  completedIds: string[];
  editorOpen: boolean;
  onToggleEditor: () => void;
  canEdit: boolean;
}) {
  const total = steps.length;
  const done = completedIds.length;
  const pct = total ? (done / total) * 100 : 0;

  const TYPE_VISUAL: Record<DocType, { bg: string; color: string; Icon: LucideIcon; label: string }> = {
    pdf: { bg: "#FFF5F5", color: "#E57373", Icon: FileText, label: "PDF" },
    video: { bg: "#F0F4FF", color: "#6B9CF7", Icon: Play, label: "VÍDEO" },
    ppt: { bg: "#FFF8F0", color: "#F4A460", Icon: Presentation, label: "PPT" },
    doc: { bg: "#F0F6FF", color: "#5BA0D0", Icon: FileIcon, label: "DOC" },
  };
  const activeIndex = done;

  return (
    <div className="bg-white" style={{ border: "0.5px solid #E8E8E8", borderRadius: 10, padding: "14px 16px" }}>
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
          {canEdit && (
            <button
              type="button"
              onClick={onToggleEditor}
              className="px-2.5 text-[11px]"
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
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {steps.map((step, idx) => {
          const visual = TYPE_VISUAL[step.type] ?? TYPE_VISUAL.doc;
          const { Icon } = visual;
          const completed = completedIds.includes(step.id);
          const isActive = !completed && idx === activeIndex;
          const opacity = completed || isActive ? 1 : 0.6;
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
                style={{ height: 70, background: visual.bg }}
              >
                <Icon size={24} strokeWidth={1.25} style={{ color: visual.color }} />
                <div
                  className="absolute left-1.5 top-1.5 flex items-center justify-center text-[10px] text-white"
                  style={{ width: 18, height: 18, borderRadius: 999, background: "#111" }}
                >
                  {idx + 1}
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
                <div className="truncate text-[11px]" style={{ fontWeight: 500, color: "#111" }} title={step.title}>
                  {step.title}
                </div>
                <div className="mt-0.5 text-[10px]" style={{ color: "#BBB" }}>
                  {visual.label} · {formatSize(step.file_size)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- FAQ View ----------

function FAQView() {
  const qc = useQueryClient();
  const { isAdmin, user } = useAuth();
  const [tab, setTab] = useState<"docs" | "chat">("docs");
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState<Doc | null>(null);

  const { data: mod } = useQuery({
    queryKey: ["module", "faq-ia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, name, slug")
        .eq("slug", "faq-ia")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const moduleId = mod?.id;

  const { data: filesRaw = [] } = useQuery({
    queryKey: ["files", moduleId],
    enabled: !!moduleId,
    queryFn: async () => {
      const { data, error } = await filesService.getFiles(moduleId!);
      if (error) throw error;
      return (data ?? []) as FileRow[];
    },
  });

  const docs: Doc[] = filesRaw.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type as DocType,
    file_url: "",
    file_name: r.file_name ?? r.title,
    file_size: r.file_size ?? 0,
    created_at: r.created_at,
  }));
  const byId = new Map(filesRaw.map((r) => [r.id, r]));

  const uploadMut = useMutation({
    mutationFn: async (p: {
      file: File;
      title: string;
      type: DocType;
      description?: string;
      tag?: string;
      tagColor?: string;
      coverFile?: File | null;
    }) => {
      if (!moduleId) throw new Error("Módulo não carregado");
      const { error } = await filesService.uploadFile(moduleId, p.file, {
        title: p.title,
        type: p.type,
        description: p.description,
        tag: p.tag,
        tagColor: p.tagColor,
        coverFile: p.coverFile,
        uploadedBy: user?.username ?? "anon",
      });
      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Documento adicionado");
      qc.invalidateQueries({ queryKey: ["files", moduleId] });
      setShowUpload(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha no upload"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const row = byId.get(id);
      if (!row) return;
      const { error } = await filesService.deleteFile(id, row.storage_path);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento removido");
      qc.invalidateQueries({ queryKey: ["files", moduleId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao remover"),
  });

  const openPreview = async (doc: Doc) => {
    const row = byId.get(doc.id);
    if (!row) return;
    const { data: url, error } = await filesService.getFileUrl(row.storage_path);
    if (error || !url) return toast.error("Erro ao abrir");
    setPreview(rowToDoc(row, url));
  };

  const downloadDoc = async (doc: Doc) => {
    const row = byId.get(doc.id);
    if (!row) return;
    const { data: url, error } = await filesService.getFileUrl(row.storage_path);
    if (error || !url) return toast.error("Erro ao baixar");
    const a = document.createElement("a");
    a.href = url;
    a.download = row.file_name ?? row.title;
    a.click();
  };

  const tabStyle = (t: "docs" | "chat"): React.CSSProperties => ({
    padding: "10px 16px",
    border: "none",
    background: "transparent",
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
    fontWeight: tab === t ? 500 : 400,
    color: tab === t ? "#111" : "#aaa",
    borderBottom: `2px solid ${tab === t ? "#111" : "transparent"}`,
    marginBottom: "-0.5px",
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          padding: "20px 28px 0",
          background: "#fff",
          borderBottom: "0.5px solid #e8e8e8",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
          <img
            src="/logo.png"
            alt=""
            style={{ width: "22px", height: "22px", objectFit: "contain", filter: "invert(1)" }}
          />
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#111", margin: 0 }}>FAQ — IA</h1>
        </div>
        <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "14px", marginTop: "4px" }}>
          Documentação oficial e assistente inteligente
        </p>
        <div style={{ display: "flex", gap: "0" }}>
          <button style={tabStyle("docs")} onClick={() => setTab("docs")}>
            📄 Documento Oficial
          </button>
          <button style={tabStyle("chat")} onClick={() => setTab("chat")}>
            🤖 Assistente Inteligente
          </button>
        </div>
      </div>

      {tab === "docs" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <p style={{ fontSize: "13px", color: "#888", maxWidth: "480px", lineHeight: 1.6 }}>
              Faça upload do arquivo de FAQ oficial (PPT, PDF ou Doc). Os usuários poderão
              visualizá-lo ou baixá-lo diretamente aqui.
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowUpload((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "34px",
                  padding: "0 16px",
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                + Adicionar
              </button>
            )}
          </div>

          {showUpload && isAdmin && (
            <UploadZone
              loading={uploadMut.isPending}
              onUpload={(p) => uploadMut.mutate(p)}
            />
          )}

          {docs.length === 0 && !showUpload ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#ccc" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📄</div>
              <p style={{ fontSize: "13px", color: "#bbb" }}>
                Nenhum arquivo ainda.
                {isAdmin && (
                  <>
                    <br />
                    Clique em "Adicionar" para fazer upload do FAQ oficial.
                  </>
                )}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {docs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  canDelete={isAdmin}
                  onDelete={(id) => deleteMut.mutate(id)}
                  onPreview={() => openPreview(doc)}
                  onDownload={() => downloadDoc(doc)}
                />
              ))}
            </div>
          )}

          <FileViewerModal open={!!preview} onClose={() => setPreview(null)} doc={preview} />
        </div>
      )}

      {tab === "chat" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <ChatbotSection />
        </div>
      )}
    </div>
  );
}

function ChatbotSection() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        "Olá! Sou o assistente PLM. Posso ajudar com dúvidas sobre processos, módulos e documentação interna.",
    },
  ]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: "Conectando ao Dify.ai…" },
    ]);
    setInput("");
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 28px",
          borderBottom: "0.5px solid #e8e8e8",
          background: "#fff",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#111",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          🤖
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>Assistente PLM</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>
            Powered by Dify.ai · RAG interno · Sem histórico entre sessões
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 28px",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "10px",
              flexDirection: m.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-start",
            }}
          >
            {m.role === "assistant" && (
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#111",
                  color: "#fff",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                🤖
              </div>
            )}
            <div
              style={{
                maxWidth: "72%",
                padding: "10px 14px",
                background: m.role === "user" ? "#111" : "#f5f5f5",
                color: m.role === "user" ? "#fff" : "#111",
                borderRadius: "12px",
                fontSize: "13px",
                lineHeight: 1.55,
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 28px",
          borderTop: "0.5px solid #e8e8e8",
          background: "#fff",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Pergunte algo…"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "0.5px solid #e0e0e0",
            borderRadius: 8,
            outline: "none",
            fontSize: 13,
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={send}
          style={{
            padding: "0 18px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Enviar
        </button>
      </div>
    </>
  );
}

// ---------- View toggle ----------

const vtStyle = (active: boolean): React.CSSProperties => ({
  padding: "6px 12px",
  fontSize: "11px",
  border: "none",
  borderRight: "0.5px solid #e0e0e0",
  background: active ? "#111" : "transparent",
  color: active ? "#fff" : "#888",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "5px",
  fontFamily: "inherit",
});

function ViewToggle({
  view,
  onChange,
}: {
  view: "mural" | "list" | "onboarding";
  onChange: (v: "mural" | "list" | "onboarding") => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        background: "#f5f5f5",
        border: "0.5px solid #e0e0e0",
        borderRadius: 7,
        overflow: "hidden",
      }}
    >
      <button onClick={() => onChange("mural")} style={vtStyle(view === "mural")} type="button">
        📐 Mural
      </button>
      <button onClick={() => onChange("list")} style={vtStyle(view === "list")} type="button">
        ☰ Lista
      </button>
      <button
        onClick={() => onChange("onboarding")}
        type="button"
        style={{
          ...vtStyle(view === "onboarding"),
          background:
            view === "onboarding" ? "#111" : "linear-gradient(90deg, #111 0%, #2a2a2a 100%)",
          color: "#fff",
          fontWeight: 500,
          borderRight: "none",
        }}
      >
        🚀 Onboarding
      </button>
    </div>
  );
}

// ---------- Mural ----------

const TYPE_BG: Record<DocType, string> = {
  pdf: "#FFF0F0",
  video: "#0f1115",
  ppt: "linear-gradient(135deg, #ffb37a 0%, #f4a460 100%)",
  doc: "#F0F6FF",
};
const TYPE_COLOR: Record<DocType, string> = {
  pdf: "#E57373",
  video: "#ffffff",
  ppt: "#7a3b00",
  doc: "#5BA0D0",
};

function FallbackCover({ type }: { type: DocType }) {
  if (type === "video") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0f1115",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Play size={20} strokeWidth={1.25} style={{ color: "#fff", marginLeft: 2 }} />
        </div>
      </div>
    );
  }
  if (type === "ppt") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #ffb37a 0%, #f4a460 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Presentation size={28} strokeWidth={1.25} style={{ color: "#fff" }} />
      </div>
    );
  }
  if (type === "doc") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F0F6FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FileIcon size={28} strokeWidth={1.25} style={{ color: "#5BA0D0" }} />
      </div>
    );
  }
  // pdf default
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 18,
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      {[0.9, 0.7, 0.85, 0.6, 0.8].map((w, i) => (
        <div
          key={i}
          style={{
            height: 6,
            background: "#ececec",
            borderRadius: 2,
            width: `${w * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

function MuralGrid({
  files,
  onView,
  onDelete,
  isAdmin,
}: {
  files: Doc[];
  onView: (d: Doc) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 14,
        padding: "0 22px 22px",
      }}
    >
      {files.map((f) => (
        <MuralCard
          key={f.id}
          file={f}
          onView={() => onView(f)}
          onDelete={() => onDelete(f.id)}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}

function MuralCard({
  file,
  onView,
  onDelete,
  isAdmin,
}: {
  file: Doc;
  onView: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const isNew = Date.now() - new Date(file.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (file.cover_path) {
      filesService.getCoverUrl(file.cover_path).then(setCoverUrl);
    }
  }, [file.cover_path]);

  const type = file.type;
  return (
    <div
      onClick={onView}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff",
        border: `0.5px solid ${hover ? "#999" : "#e8e8e8"}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.15s ease",
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 5",
          background: "#fafafa",
          overflow: "hidden",
        }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <FallbackCover type={type} />
        )}
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            fontSize: 9,
            fontWeight: 500,
            padding: "3px 8px",
            borderRadius: 4,
            letterSpacing: "0.05em",
            background: type === "ppt" ? "rgba(255,255,255,0.85)" : TYPE_BG[type],
            color: TYPE_COLOR[type],
          }}
        >
          {type.toUpperCase()}
        </span>
        {isNew && (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#111",
              color: "#fff",
              fontSize: 9,
              fontWeight: 500,
              padding: "3px 7px",
              borderRadius: 4,
            }}
          >
            NOVO
          </span>
        )}
      </div>

      <div
        style={{
          padding: "12px 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
        }}
      >
        {file.tag && (
          <div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                padding: "2px 7px",
                borderRadius: 10,
                background: (file.tag_color ?? "#888") + "20",
                color: file.tag_color ?? "#666",
              }}
            >
              {file.tag}
            </span>
          </div>
        )}
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#111",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            margin: 0,
          }}
        >
          {file.title}
        </p>
        {file.description && (
          <p
            style={{
              fontSize: 11,
              color: "#888",
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              margin: 0,
            }}
          >
            {file.description}
          </p>
        )}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 8,
            borderTop: "0.5px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: "#bbb",
          }}
        >
          <span>
            {formatSize(file.file_size)} · {formatDate(file.created_at)}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Eye size={11} strokeWidth={1.5} /> {file.view_count ?? 0}
          </span>
        </div>
      </div>

      {isAdmin && hover && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: 6,
            border: "0.5px solid #e0e0e0",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#bbb",
          }}
          title="Remover"
        >
          <Trash size={11} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

// ---------- List View ----------

function ListView({
  files,
  onView,
  onDownload,
  onDelete,
  isAdmin,
}: {
  files: Doc[];
  onView: (d: Doc) => void;
  onDownload: (d: Doc) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}) {
  return (
    <div
      style={{
        padding: "0 22px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {files.map((f) => (
        <ListCard
          key={f.id}
          file={f}
          onView={() => onView(f)}
          onDownload={() => onDownload(f)}
          onDelete={() => onDelete(f.id)}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}

function ListCard({
  file,
  onView,
  onDownload,
  onDelete,
  isAdmin,
}: {
  file: Doc;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (file.cover_path) {
      filesService.getCoverUrl(file.cover_path).then(setCoverUrl);
    }
  }, [file.cover_path]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff",
        border: `0.5px solid ${hover ? "#999" : "#e8e8e8"}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "stretch",
        height: 88,
        overflow: "hidden",
        transition: "border-color 0.15s ease",
      }}
    >
      <div style={{ width: 88, flexShrink: 0, position: "relative", background: "#fafafa" }}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <FallbackCover type={file.type} />
        )}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#111",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
              flex: "0 1 auto",
            }}
          >
            {file.title}
          </p>
          {file.tag && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                padding: "2px 7px",
                borderRadius: 10,
                background: (file.tag_color ?? "#888") + "20",
                color: file.tag_color ?? "#666",
                flexShrink: 0,
              }}
            >
              {file.tag}
            </span>
          )}
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              padding: "2px 7px",
              borderRadius: 4,
              background: TYPE_BG[file.type] === "#0f1115" ? "#111" : TYPE_BG[file.type],
              color: TYPE_COLOR[file.type],
              flexShrink: 0,
              letterSpacing: "0.05em",
            }}
          >
            {file.type.toUpperCase()}
          </span>
        </div>
        {file.description && (
          <p
            style={{
              fontSize: 11,
              color: "#888",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {file.description}
          </p>
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
          fontSize: 10,
          color: "#bbb",
          textAlign: "right",
        }}
      >
        <span>{formatSize(file.file_size)}</span>
        <span>{formatDate(file.created_at)}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
          <Eye size={10} strokeWidth={1.5} /> {file.view_count ?? 0}
        </span>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <button onClick={onView} style={iconBtn} title="Visualizar" type="button">
          <Eye size={13} strokeWidth={1.5} />
        </button>
        <button onClick={onDownload} style={iconBtn} title="Download" type="button">
          <Download size={13} strokeWidth={1.5} />
        </button>
        {isAdmin && (
          <button
            onClick={onDelete}
            style={{ ...iconBtn, color: "#cccccc" }}
            title="Remover"
            type="button"
          >
            <Trash size={13} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

