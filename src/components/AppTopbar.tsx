// Barra superior do PLM Knowledge Hub.
// Contém busca global (placeholder) e menu do usuário.
import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AppTopbar() {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header
      className="flex h-[52px] items-center gap-6 bg-white px-6"
      style={{ borderBottom: "0.5px solid var(--line)" }}
    >
      {/* Busca global */}
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

      {/* Menu usuário */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 transition-colors duration-150"
        >
          <div
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[11px] text-white"
            style={{ background: "var(--ink)", fontWeight: 500 }}
          >
            {profile ? initials(profile.full_name) : "··"}
          </div>
          <span className="text-[13px]" style={{ color: "var(--ink)" }}>
            {profile?.full_name ?? "Carregando…"}
          </span>
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--mute)" }} />
        </button>

        {open && (
          <div
            className="absolute right-0 top-[40px] z-20 w-[180px] overflow-hidden rounded-lg bg-white"
            style={{ border: "0.5px solid var(--line)" }}
          >
            <div className="px-3 py-2 text-[11px]" style={{ color: "var(--mute)" }}>
              {profile?.login}
            </div>
            <div style={{ borderTop: "0.5px solid var(--line)" }} />
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await signOut();
                navigate({ to: "/login" });
              }}
              className="block w-full px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:bg-[var(--surface-2)]"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
