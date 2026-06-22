// Página de login do PLM — auth local.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  component: () => (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  ),
});

function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const r = login(username, password);
    if (!r.ok) {
      setError(r.error ?? "Login inválido.");
      setSubmitting(false);
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center"
      style={{
        background: "#F0ECE6",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='none' stroke='%23DCD4C5' stroke-width='0.6' opacity='0.9'><path d='M40 80c0-22 18-40 40-40s40 18 40 40-18 40-40 40-40-18-40-40z'/><path d='M80 40c12 18 12 62 0 80M40 80c18-12 62-12 80 0M52 52c20 20 36 36 56 56M108 52c-20 20-36 36-56 56'/></g></svg>\")",
        backgroundRepeat: "repeat",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-[320px] rounded-[10px] bg-white"
        style={{ padding: "36px 32px", border: "0.5px solid rgba(0,0,0,0.08)" }}
      >
        <div className="mb-5 flex flex-col items-center">
          <span className="text-[9px] uppercase" style={{ letterSpacing: "0.18em", color: "#888" }}>
            Grupo de Moda
          </span>
          <div className="mt-1 flex items-baseline">
            <span style={{ fontSize: 22, fontWeight: 300, color: "var(--ink)" }}>+</span>
            <span
              className="font-serif-soma"
              style={{ fontSize: 26, letterSpacing: "0.12em", color: "var(--ink)", marginLeft: 2 }}
            >
              soma
            </span>
          </div>
          <span
            className="mt-1 text-[8px] uppercase"
            style={{ letterSpacing: "0.22em", color: "#AAA" }}
          >
            PLM Knowledge Hub
          </span>
        </div>

        <h1 className="text-center text-[16px]" style={{ fontWeight: 500, color: "var(--ink)" }}>
          Bem-vindo ao PLM Hub
        </h1>
        <p className="mt-1 text-center text-[12px]" style={{ color: "#AAA" }}>
          Insira suas credenciais para acessar
        </p>

        <div className="mt-6 space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="nome.sobrenome"
            autoComplete="username"
            required
            className="block w-full bg-white px-3 text-[13px] outline-none"
            style={{
              height: 42,
              borderRadius: 7,
              border: "0.5px solid #D8D8D8",
              color: "var(--ink)",
            }}
          />
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              autoComplete="current-password"
              required
              className="block w-full bg-white pl-3 pr-10 text-[13px] outline-none"
              style={{
                height: 42,
                borderRadius: 7,
                border: "0.5px solid #D8D8D8",
                color: "var(--ink)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--mute)" }}
              aria-label="Mostrar/ocultar senha"
            >
              {showPwd ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-[11px]" style={{ color: "var(--destructive)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full uppercase text-white disabled:opacity-60"
          style={{
            height: 42,
            background: "var(--ink)",
            borderRadius: 7,
            letterSpacing: "0.08em",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {submitting ? "Entrando…" : "Entrar"}
        </button>

        <p className="mt-4 text-center text-[11px]" style={{ color: "#CCC" }}>
          Formato: nome.sobrenome
        </p>
      </form>
    </div>
  );
}
