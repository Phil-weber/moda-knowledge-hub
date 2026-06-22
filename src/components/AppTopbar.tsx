// Barra superior do PLM Knowledge Hub.
import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";

function initials(name: string): string {
  return name
    .split(/[.\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AppTopbar() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header
      className="flex h-[52px] items-center gap-6 bg-white px-6"
      style={{ borderBottom: "0.5px solid var(--line)" }}
    >
      <div className="flex flex-1 justify-center">
        <div
          className="flex h-[34px] w-full max-w-[560px] items-center gap-2 rounded-lg px-3"
          style={{ background: "var(--surface-2)", border: "0.5px solid var(--line)" }}
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--mute)" }} />
          <input
            type="text"
            placeholder="Buscar arquivos em todos os módulos..."
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--mute)]"
          />
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2"
        >
          <div
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[11px] text-white"
            style={{ background: "var(--ink)", fontWeight: 500 }}
          >
            {user ? initials(user.username) : "··"}
          </div>
          <span className="text-[13px]" style={{ color: "var(--ink)" }}>
            {user?.username ?? "—"}
          </span>
          {isAdmin && (
            <span
              className="rounded px-1.5 text-[9px] text-white"
              style={{ background: "var(--ink)", letterSpacing: "0.08em", padding: "2px 6px" }}
            >
              ADMIN
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--mute)" }} />
        </button>

        {open && (
          <div
            className="absolute right-0 top-[40px] z-20 w-[200px] overflow-hidden rounded-lg bg-white"
            style={{ border: "0.5px solid var(--line)" }}
          >
            <div className="px-3 py-2 text-[11px]" style={{ color: "var(--mute)" }}>
              {user?.username} · {isAdmin ? "Administrador" : "Usuário comum"}
            </div>
            <div style={{ borderTop: "0.5px solid var(--line)" }} />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
                navigate({ to: "/login" });
              }}
              className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[var(--surface-2)]"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
