// Modal de preview de PDF com react-pdf.
import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  X,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  metadata: string;
  fileUrl: string;
}

export function PdfPreviewModal({
  open,
  onClose,
  fileName,
  metadata,
  fileUrl,
}: PdfPreviewModalProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (open) {
      setPage(1);
      setZoom(100);
    }
  }, [open, fileUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(numPages || p, p + 1));
  const zoomOut = () => setZoom((z) => Math.max(50, z - 10));
  const zoomIn = () => setZoom((z) => Math.min(200, z + 10));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col overflow-hidden bg-white"
        style={{
          width: 620,
          border: "0.5px solid #E0E0E0",
          borderRadius: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "14px 18px", borderBottom: "0.5px solid #E8E8E8" }}
        >
          <div className="min-w-0">
            <div
              className="truncate text-[15px]"
              style={{ fontWeight: 500, color: "#111" }}
              title={fileName}
            >
              {fileName}
            </div>
            <div
              className="mt-0.5 text-[11px] uppercase"
              style={{ color: "#AAA", letterSpacing: "0.06em" }}
            >
              {metadata}
            </div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-1.5">
            <HeaderBtn label="Baixar"><Download size={14} strokeWidth={1.5} /></HeaderBtn>
            <HeaderBtn label="Abrir em nova aba"><ExternalLink size={14} strokeWidth={1.5} /></HeaderBtn>
            <HeaderBtn label="Fechar" onClick={onClose}><X size={14} strokeWidth={1.5} /></HeaderBtn>
          </div>
        </div>

        {/* Body */}
        <div className="flex" style={{ height: 340 }}>
          {/* Thumb panel */}
          <div
            className="flex flex-col items-center gap-2 overflow-y-auto py-3"
            style={{ width: 72, background: "#F9F9F9", borderRight: "0.5px solid #E8E8E8" }}
          >
            {Array.from({ length: Math.max(numPages, 1) }).map((_, i) => {
              const n = i + 1;
              const active = n === page;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="flex flex-col justify-between bg-white"
                    style={{
                      width: 52,
                      height: 74, // ~A4 ratio
                      border: active ? "1.5px solid #111" : "0.5px solid #E0E0E0",
                      borderRadius: 3,
                      padding: 6,
                    }}
                  >
                    {Array.from({ length: 6 }).map((_, k) => (
                      <div
                        key={k}
                        style={{
                          height: 2,
                          background: "#E8E8E8",
                          width: k === 5 ? "60%" : "100%",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px]" style={{ color: active ? "#111" : "#AAA" }}>
                    {n}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main viewer */}
          <div
            className="flex flex-1 items-center justify-center overflow-auto"
            style={{ background: "#E8E8E8" }}
          >
            <Document
              file={fileUrl}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              loading={<span className="text-[12px]" style={{ color: "#777" }}>Carregando…</span>}
              error={<span className="text-[12px]" style={{ color: "#777" }}>Não foi possível carregar o PDF.</span>}
            >
              <Page
                pageNumber={page}
                width={(zoom / 100) * 280}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Document>
          </div>
        </div>

        {/* Toolbar */}
        <div
          className="flex items-center justify-between bg-white"
          style={{ height: 40, borderTop: "0.5px solid #E8E8E8", padding: "0 14px" }}
        >
          <div className="flex items-center gap-2">
            <ToolbarBtn onClick={goPrev} disabled={page <= 1}>
              <ChevronLeft size={13} strokeWidth={1.5} />
            </ToolbarBtn>
            <span className="text-[12px]" style={{ color: "#666" }}>
              Página {page} de {numPages || "—"}
            </span>
            <ToolbarBtn onClick={goNext} disabled={!!numPages && page >= numPages}>
              <ChevronRight size={13} strokeWidth={1.5} />
            </ToolbarBtn>
          </div>
          <div className="flex items-center gap-2">
            <ToolbarBtn onClick={zoomOut} disabled={zoom <= 50}>
              <Minus size={13} strokeWidth={1.5} />
            </ToolbarBtn>
            <span className="text-[12px]" style={{ color: "#666" }}>{zoom}%</span>
            <ToolbarBtn onClick={zoomIn} disabled={zoom >= 200}>
              <Plus size={13} strokeWidth={1.5} />
            </ToolbarBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center transition-colors duration-150"
      style={{
        width: 32,
        height: 32,
        border: "0.5px solid #E0E0E0",
        borderRadius: 7,
        background: "#F9F9F9",
        color: "#444",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#999")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E0E0E0")}
    >
      {children}
    </button>
  );
}

function ToolbarBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center transition-colors duration-150"
      style={{
        width: 26,
        height: 26,
        border: "0.5px solid #E0E0E0",
        borderRadius: 6,
        background: "#FFF",
        color: disabled ? "#CCC" : "#444",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
