// Estado global de arquivos por módulo (em memória).
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type DocType = "pdf" | "video" | "ppt" | "doc";

export interface Doc {
  id: string;
  title: string;
  type: DocType;
  file_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

export type DocsMap = Record<string, Doc[]>;

interface DocsContextValue {
  docs: DocsMap;
  addDoc: (moduleId: string, doc: Doc) => void;
  removeDoc: (moduleId: string, docId: string) => void;
}

const INITIAL: DocsMap = {
  "tech-pack": [],
  supplier: [],
  planning: [],
  fitting: [],
  color: [],
  pcp: [],
  quality: [],
  dados: [],
  "faq-ia": [],
};

const DocsContext = createContext<DocsContextValue | undefined>(undefined);

export function DocsProvider({ children }: { children: ReactNode }) {
  const [docs, setDocs] = useState<DocsMap>(INITIAL);

  const addDoc = useCallback((moduleId: string, doc: Doc) => {
    setDocs((prev) => ({ ...prev, [moduleId]: [...(prev[moduleId] ?? []), doc] }));
  }, []);

  const removeDoc = useCallback((moduleId: string, docId: string) => {
    setDocs((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] ?? []).filter((d) => d.id !== docId),
    }));
  }, []);

  const value = useMemo(() => ({ docs, addDoc, removeDoc }), [docs, addDoc, removeDoc]);
  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
}

export function useDocs() {
  const ctx = useContext(DocsContext);
  if (!ctx) throw new Error("useDocs deve ser usado dentro de <DocsProvider>");
  return ctx;
}
