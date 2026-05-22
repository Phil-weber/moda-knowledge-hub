// Estado global das trilhas de onboarding por módulo (em memória).
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type TrailsMap = Record<string, string[]>; // moduleId -> doc IDs ordenados

interface TrailsContextValue {
  trails: TrailsMap;
  setTrail: (moduleId: string, ids: string[]) => void;
}

const TrailsContext = createContext<TrailsContextValue | undefined>(undefined);

export function TrailsProvider({ children }: { children: ReactNode }) {
  const [trails, setTrails] = useState<TrailsMap>({});

  const setTrail = useCallback((moduleId: string, ids: string[]) => {
    setTrails((prev) => ({ ...prev, [moduleId]: ids }));
  }, []);

  const value = useMemo(() => ({ trails, setTrail }), [trails, setTrail]);
  return <TrailsContext.Provider value={value}>{children}</TrailsContext.Provider>;
}

export function useTrails() {
  const ctx = useContext(TrailsContext);
  if (!ctx) throw new Error("useTrails deve ser usado dentro de <TrailsProvider>");
  return ctx;
}
