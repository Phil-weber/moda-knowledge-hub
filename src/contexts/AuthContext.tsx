// Auth local do PLM — sem backend de autenticação.
// Qualquer "nome.sobrenome" + senha SHARED_PASSWORD entra.
// O usuário ADMIN_USER tem papel "admin"; demais são "common".
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const ADMIN_USER = "philipp.weber";
const SHARED_PASSWORD = "Soma@1206";
const STORAGE_KEY = "plm_session";

export type Role = "admin" | "common";

export interface SessionUser {
  username: string;
  role: Role;
}

interface AuthContextValue {
  user: SessionUser | null;
  role: Role | null;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.username || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readSession());
    setLoading(false);
  }, []);

  const login = useCallback((username: string, password: string) => {
    const u = username.trim().toLowerCase();
    if (!u.includes(".")) {
      return { ok: false, error: "Usuário deve estar no formato nome.sobrenome." };
    }
    if (password !== SHARED_PASSWORD) {
      return { ok: false, error: "Senha incorreta." };
    }
    const session: SessionUser = {
      username: u,
      role: u === ADMIN_USER ? "admin" : "common",
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAdmin: user?.role === "admin",
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve estar dentro de <AuthProvider>");
  return ctx;
}
