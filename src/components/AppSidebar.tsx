// Sidebar do PLM Knowledge Hub.
// Módulos vindos do banco (React Query). Admin pode adicionar/remover.
import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Package,
  Truck,
  Calendar,
  Scissors,
  Palette,
  Settings2,
  ShieldCheck,
  BarChart2,
  Bot,
  Plus,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Trash2,
  X,
  FileText,
  Inbox,
  HelpCircle,
  Upload,
  Eye,
  Check,
  Video,
  Presentation,
  Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as modulesService from "@/services/modulesService";
import { useAuth } from "@/contexts/AuthContext";

interface ModuleItem {
  id: string;
  label: string;
  slug: string;
  icon: string;
  isAI?: boolean;
  fixed?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  box: Package,
  truck: Truck,
  calendar: Calendar,
  scissors: Scissors,
  color: Palette,
  settings: Settings2,
  shield: ShieldCheck,
  chart: BarChart2,
  bot: Bot,
  file: FileText,
  folder: Inbox,
  help: HelpCircle,
  upload: Upload,
  eye: Eye,
  check: Check,
  video: Video,
  slides: Presentation,
  download: Download,
};

const ICON_ALIAS: Record<string, string> = {
  Package: "box",
  Truck: "truck",
  Calendar: "calendar",
  Scissors: "scissors",
  Palette: "color",
  Settings2: "settings",
  ShieldCheck: "shield",
  BarChart2: "chart",
  MessageCircle: "bot",
  Bot: "bot",
};

const FIXED_SLUGS = new Set(["tech-pack", "faq-ia"]);

function normalizeIcon(key: string): string {
  if (ICON_MAP[key]) return key;
  return ICON_ALIAS[key] ?? "box";
}

function getIcon(key: string): LucideIcon {
  return ICON_MAP[normalizeIcon(key)] ?? Package;
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showManageModules, setShowManageModules] = useState(false);

  const { data: dbModules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await modulesService.getModules();
      if (error) throw error;
      return data ?? [];
    },
  });

  const modules: ModuleItem[] = dbModules.map((m: any) => ({
    id: m.id,
    slug: m.slug ?? m.id,
    label: m.name ?? m.label ?? "",
    icon: normalizeIcon(m.icon),
    isAI: !!m.is_ai || m.slug === "faq-ia",
    fixed: !!m.fixed || FIXED_SLUGS.has(m.slug ?? ""),
  }));

  const addMut = useMutation({
    mutationFn: async (payload: { label: string; icon: string }) => {
      const { data, error } = await modulesService.addModule(payload);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Módulo adicionado");
      qc.invalidateQueries({ queryKey: ["modules"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao adicionar"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await modulesService.deleteModule(id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Módulo removido");
      qc.invalidateQueries({ queryKey: ["modules"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao remover"),
  });

  const onSelect = (slug: string) => {
    navigate({ to: "/modulo/$slug", params: { slug } });
  };

  const w = collapsed ? "60px" : "220px";

  return (
    <div
      style={{
        width: w,
        flexShrink: 0,
        borderRight: "0.5px solid #e0e0e0",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "visible",
        position: "relative",
      }}
    >
      <div
        style={{
          padding: collapsed ? "16px 0 12px" : "20px 16px 14px",
          borderBottom: "0.5px solid #e8e8e8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate({ to: "/" })}
          title="Voltar para início"
          onFocus={(e) => (e.currentTarget.style.outline = "none")}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            width: "100%",
            outline: "none",
          }}
        >
          <img
            src="/logo.png"
            alt="Início"
            style={{
              width: collapsed ? "32px" : "44px",
              height: collapsed ? "32px" : "44px",
              objectFit: "contain",
              filter: "invert(1)",
              transition: "width 0.2s ease",
            }}
          />
          {!collapsed && (
            <span
              style={{
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                color: "#aaaaaa",
                textTransform: "uppercase",
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              PLM Knowledge Hub
            </span>
          )}
        </button>
      </div>

      <button
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? "Expandir" : "Recolher"}
        style={{
          position: "absolute",
          top: "60px",
          right: "-11px",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          border: "0.5px solid #e0e0e0",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 100,
          color: "#888888",
        }}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>

      <nav
        style={{
          flex: 1,
          padding: collapsed ? "12px 6px" : "12px 8px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {!collapsed && (
          <p
            style={{
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              color: "#bbbbbb",
              textTransform: "uppercase",
              padding: "0 10px",
              marginBottom: "6px",
              marginTop: "4px",
            }}
          >
            Módulos
          </p>
        )}

        {modules.map((m) => {
          const MI = getIcon(m.icon);
          const isActive = pathname === `/modulo/${m.slug}`;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.slug)}
              title={collapsed ? m.label : ""}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: collapsed ? "0" : "10px",
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "10px 0" : "8px 16px",
                border: "none",
                borderRadius: collapsed ? "8px" : "0",
                background: isActive ? "#111111" : "transparent",
                color: isActive ? "#ffffff" : "#555555",
                fontSize: "13px",
                fontWeight: isActive ? 500 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                marginBottom: "1px",
                transition: "background 0.12s ease",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <MI size={15} strokeWidth={1.5} />
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{m.label}</span>
                  {m.isAI && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 500,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: isActive ? "rgba(255,255,255,0.2)" : "#111111",
                        color: "#ffffff",
                        letterSpacing: "0.04em",
                      }}
                    >
                      IA
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && isAdmin && (
        <div style={{ padding: "0 14px 10px" }}>
          <button
            onClick={() => setShowManageModules(true)}
            style={{
              width: "100%",
              padding: "7px 12px",
              border: "0.5px dashed #cccccc",
              borderRadius: "8px",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "#bbbbbb",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus size={13} strokeWidth={1.5} />
            Adicionar módulo
          </button>
        </div>
      )}

      {!collapsed && (
        <div style={{ padding: "10px 16px 14px", borderTop: "0.5px solid #eeeeee" }}>
          <p style={{ fontSize: "11px", color: "#cccccc", lineHeight: 1.75 }}>
            Suporte:
            <br />
            <strong style={{ color: "#aaaaaa", fontWeight: 500 }}>philipp.weber</strong>
            <br />
            <strong style={{ color: "#aaaaaa", fontWeight: 500 }}>bruna.valadares</strong>
          </p>
        </div>
      )}

      {showManageModules && isAdmin && (
        <div
          onClick={() => setShowManageModules(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "0.5px solid #e0e0e0",
              width: "640px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "0.5px solid #e8e8e8",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#111" }}>
                Gerenciar módulos
              </span>
              <button
                onClick={() => setShowManageModules(false)}
                style={{
                  width: "28px",
                  height: "28px",
                  border: "0.5px solid #e0e0e0",
                  borderRadius: "6px",
                  background: "#f9f9f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <p style={{ fontSize: "11px", color: "#bbbbbb", marginBottom: "4px" }}>
                Módulos fixos não podem ser removidos.
              </p>
              <ModuleList
                modules={modules}
                onRemove={(id) => delMut.mutate(id)}
                removing={delMut.isPending}
                onReorder={async (ordered) => {
                  const { error } = await modulesService.reorderModules(
                    ordered.map((m) => m.id),
                  );
                  if (error) {
                    toast.error("Falha ao salvar ordem");
                  } else {
                    toast.success("Ordem atualizada", { duration: 2000 });
                  }
                  qc.invalidateQueries({ queryKey: ["modules"] });
                }}
              />
            </div>

            <div style={{ padding: "14px 16px", borderTop: "0.5px solid #e8e8e8" }}>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#aaaaaa",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Adicionar novo módulo
              </p>
              <AddModuleForm
                disabled={addMut.isPending}
                onAdd={(payload) => addMut.mutate(payload)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ICON_LIBRARY: Array<{ key: string; Icon: LucideIcon; label: string }> = [
  { key: "box", Icon: Package, label: "Caixa" },
  { key: "truck", Icon: Truck, label: "Caminhão" },
  { key: "calendar", Icon: Calendar, label: "Calendário" },
  { key: "scissors", Icon: Scissors, label: "Tesoura" },
  { key: "color", Icon: Palette, label: "Paleta" },
  { key: "settings", Icon: Settings2, label: "Ajustes" },
  { key: "shield", Icon: ShieldCheck, label: "Escudo" },
  { key: "chart", Icon: BarChart2, label: "Gráfico" },
  { key: "bot", Icon: Bot, label: "Bot" },
  { key: "file", Icon: FileText, label: "Arquivo" },
  { key: "folder", Icon: Inbox, label: "Pasta" },
  { key: "help", Icon: HelpCircle, label: "Ajuda" },
  { key: "video", Icon: Video, label: "Vídeo" },
  { key: "slides", Icon: Presentation, label: "Slides" },
];

function AddModuleForm({
  onAdd,
  disabled,
}: {
  onAdd: (m: { label: string; icon: string }) => void;
  disabled?: boolean;
}) {
  const [label, setLabel] = useState("");
  const [iconKey, setIconKey] = useState<string>("box");

  const submit = () => {
    if (!label.trim() || disabled) return;
    onAdd({ label: label.trim(), icon: iconKey });
    setLabel("");
    setIconKey("box");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nome do módulo..."
        style={{
          padding: "8px 12px",
          border: "0.5px solid #e0e0e0",
          borderRadius: "7px",
          fontSize: "13px",
          outline: "none",
          fontFamily: "inherit",
          background: "#fff",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: "6px",
          marginBottom: "12px",
        }}
      >
        {ICON_LIBRARY.map(({ key, Icon, label: lbl }) => {
          const selected = iconKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setIconKey(key)}
              title={lbl}
              style={{
                width: "38px",
                height: "38px",
                border: selected ? "1px solid #111" : "0.5px solid #e0e0e0",
                borderRadius: "7px",
                background: selected ? "#111" : "#ffffff",
                color: selected ? "#fff" : "#666",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              <Icon size={16} strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
      <button
        onClick={submit}
        disabled={!label.trim() || disabled}
        style={{
          padding: "8px",
          border: "none",
          borderRadius: "7px",
          background: label.trim() && !disabled ? "#111111" : "#e8e8e8",
          color: label.trim() && !disabled ? "#ffffff" : "#bbbbbb",
          fontSize: "13px",
          fontWeight: 500,
          cursor: label.trim() && !disabled ? "pointer" : "not-allowed",
          fontFamily: "inherit",
        }}
      >
        {disabled ? "Adicionando…" : "Adicionar"}
      </button>
    </div>
  );
}

function ModuleList({
  modules,
  onRemove,
  removing,
}: {
  modules: ModuleItem[];
  onRemove: (id: string) => void;
  removing?: boolean;
}) {
  const [order, setOrder] = useState<string[]>(modules.map((m) => m.id));
  const ids = modules.map((m) => m.id);
  // keep order in sync if modules change
  const merged =
    order.length === ids.length && order.every((id) => ids.includes(id))
      ? order
      : ids;
  const list = merged
    .map((id) => modules.find((m) => m.id === id))
    .filter((m): m is ModuleItem => !!m);

  const sensors = useSensors(useSensor(PointerSensor));
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = list.findIndex((m) => m.id === active.id);
    const newIndex = list.findIndex((m) => m.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setOrder(arrayMove(list, oldIndex, newIndex).map((m) => m.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={list.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {list.map((m) => (
            <SortableModuleItem key={m.id} mod={m} onRemove={onRemove} disabled={removing} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableModuleItem({
  mod,
  onRemove,
  disabled,
}: {
  mod: ModuleItem;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: mod.id });
  const MI = getIcon(mod.icon);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        border: "0.5px solid #e8e8e8",
        borderRadius: "8px",
        background: "#fafafa",
      }}
    >
      <button
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          background: "transparent",
          border: "none",
          padding: 0,
          color: "#cccccc",
          display: "flex",
        }}
        aria-label="Arraste"
      >
        <GripVertical size={14} />
      </button>
      <div
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "6px",
          background: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <MI size={14} strokeWidth={1.5} style={{ color: "#666" }} />
      </div>
      <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "#111" }}>{mod.label}</span>
      {mod.isAI && (
        <span
          style={{
            fontSize: "9px",
            fontWeight: 500,
            padding: "2px 6px",
            borderRadius: "4px",
            background: "#111",
            color: "#fff",
            letterSpacing: "0.04em",
          }}
        >
          IA
        </span>
      )}
      {mod.fixed ? (
        <span
          style={{
            fontSize: "10px",
            color: "#cccccc",
            padding: "2px 8px",
            border: "0.5px solid #e0e0e0",
            borderRadius: "4px",
          }}
        >
          Fixo
        </span>
      ) : (
        <button
          onClick={() => !disabled && onRemove(mod.id)}
          disabled={disabled}
          style={{
            width: "26px",
            height: "26px",
            border: "0.5px solid #e8e8e8",
            borderRadius: "5px",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "wait" : "pointer",
            color: "#cccccc",
          }}
        >
          <Trash2 size={12} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
