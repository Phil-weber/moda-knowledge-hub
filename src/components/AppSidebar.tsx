// Sidebar do PLM Knowledge Hub com collapse, gerenciamento de módulos
// e logo FARM. Módulos são carregados do banco e mantidos em estado local
// para permitir adição/remoção via modal "Gerenciar módulos".
import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
};

// aliases p/ ícones legados vindos do banco
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

const ICON_OPTIONS = Object.keys(ICON_MAP) as Array<keyof typeof ICON_MAP>;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [showManageModules, setShowManageModules] = useState(false);

  const { data: dbModules } = useQuery({
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

  useEffect(() => {
    if (!dbModules) return;
    setModules((prev) => {
      if (prev.length > 0) return prev;
      return dbModules.map((m) => ({
        id: m.id,
        slug: m.slug,
        label: m.name,
        icon: normalizeIcon(m.icon),
        isAI: m.slug === "faq-ia",
        fixed: FIXED_SLUGS.has(m.slug),
      }));
    });
  }, [dbModules]);

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
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* LOGO */}
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
        <img
          src="/logo.png"
          alt="Logo"
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
      </div>

      {/* BOTÃO COLLAPSE */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        style={{
          position: "absolute",
          top: "50px",
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
          zIndex: 50,
          color: "#888888",
        }}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>

      {/* NAV */}
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

      {/* BOTÃO GERENCIAR MÓDULOS */}
      {!collapsed && (
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

      {/* FOOTER */}
      {!collapsed && (
        <div
          style={{
            padding: "10px 16px 14px",
            borderTop: "0.5px solid #eeeeee",
          }}
        >
          <p style={{ fontSize: "11px", color: "#cccccc", lineHeight: 1.75 }}>
            Suporte:
            <br />
            <strong style={{ color: "#aaaaaa", fontWeight: 500 }}>philipp.weber</strong>
            <br />
            <strong style={{ color: "#aaaaaa", fontWeight: 500 }}>bruna.valadares</strong>
          </p>
        </div>
      )}

      {/* MODAL GERENCIAR MÓDULOS */}
      {showManageModules && (
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
              width: "440px",
              maxHeight: "80vh",
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
              {modules.map((m) => {
                const MI = getIcon(m.icon);
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      border: "0.5px solid #e8e8e8",
                      borderRadius: "8px",
                      background: "#fafafa",
                    }}
                  >
                    <GripVertical size={14} style={{ color: "#cccccc", flexShrink: 0 }} />
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
                    <span
                      style={{
                        flex: 1,
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#111",
                      }}
                    >
                      {m.label}
                    </span>
                    {m.isAI && (
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
                    {m.fixed ? (
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
                        onClick={() => {
                          setModules((prev) => prev.filter((x) => x.id !== m.id));
                        }}
                        style={{
                          width: "26px",
                          height: "26px",
                          border: "0.5px solid #e8e8e8",
                          borderRadius: "5px",
                          background: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#cccccc",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#fca5a5";
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e8e8e8";
                          e.currentTarget.style.color = "#cccccc";
                        }}
                      >
                        <Trash2 size={12} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderTop: "0.5px solid #e8e8e8",
              }}
            >
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
                onAdd={(newMod) => setModules((prev) => [...prev, newMod])}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddModuleForm({ onAdd }: { onAdd: (m: ModuleItem) => void }) {
  const [label, setLabel] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("box");

  const submit = () => {
    if (!label.trim()) return;
    const slug = label.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    onAdd({
      id: slug,
      slug,
      label: label.trim(),
      icon: selectedIcon,
      fixed: false,
    });
    setLabel("");
    setSelectedIcon("box");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {ICON_OPTIONS.map((key) => {
          const Icon = ICON_MAP[key];
          const selected = selectedIcon === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedIcon(key)}
              style={{
                width: "32px",
                height: "32px",
                border: selected ? "1.5px solid #111" : "0.5px solid #e0e0e0",
                borderRadius: "7px",
                background: selected ? "#111" : "#fafafa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: selected ? "#fff" : "#666",
              }}
            >
              <Icon size={14} strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
      <button
        onClick={submit}
        disabled={!label.trim()}
        style={{
          padding: "8px",
          border: "none",
          borderRadius: "7px",
          background: label.trim() ? "#111111" : "#e8e8e8",
          color: label.trim() ? "#ffffff" : "#bbbbbb",
          fontSize: "13px",
          fontWeight: 500,
          cursor: label.trim() ? "pointer" : "not-allowed",
          fontFamily: "inherit",
        }}
      >
        Adicionar
      </button>
    </div>
  );
}

function FarmLogo() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 120 105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="60" cy="28" rx="22" ry="28" stroke="#1a1a1a" strokeWidth="3.5" fill="none" />
      <ellipse
        cx="88"
        cy="42"
        rx="22"
        ry="28"
        stroke="#1a1a1a"
        strokeWidth="3.5"
        fill="none"
        transform="rotate(72 88 42)"
      />
      <ellipse
        cx="76"
        cy="74"
        rx="22"
        ry="28"
        stroke="#1a1a1a"
        strokeWidth="3.5"
        fill="none"
        transform="rotate(144 76 74)"
      />
      <ellipse
        cx="44"
        cy="74"
        rx="22"
        ry="28"
        stroke="#1a1a1a"
        strokeWidth="3.5"
        fill="none"
        transform="rotate(216 44 74)"
      />
      <ellipse
        cx="32"
        cy="42"
        rx="22"
        ry="28"
        stroke="#1a1a1a"
        strokeWidth="3.5"
        fill="none"
        transform="rotate(288 32 42)"
      />
      <circle cx="60" cy="54" r="15" stroke="#1a1a1a" strokeWidth="3.5" fill="none" />
      <path
        d="M10 92 Q35 84 60 90 Q85 96 110 88"
        stroke="#1a1a1a"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
