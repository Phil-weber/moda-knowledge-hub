// Modal de preview de PDF via iframe (base64 quando disponível).
import { useEffect, useState } from "react";
import { X, Download, ExternalLink } from "lucide-react";

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  metadata: string;
  fileUrl: string;
  fileData?: string;
}

export function PdfPreviewModal({
  open,
  onClose,
  fileName,
  metadata,
  fileUrl,
  fileData,
}: PdfPreviewModalProps) {
  const [src, setSrc] = useState(fileUrl);

  useEffect(() => {
    if (fileData) {
      setSrc("data:application/pdf;base64," + fileData);
    } else {
      setSrc(fileUrl + "#toolbar=1&navpanes=1&scrollbar=1");
    }
  }, [fileUrl, fileData]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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
            <HeaderBtn label="Baixar" onClick={() => {
              const a = document.createElement("a");
              a.href = src;
              a.download = fileName;
              a.click();
            }}>
              <Download size={14} strokeWidth={1.5} />
            </HeaderBtn>
            <HeaderBtn label="Abrir em nova aba" onClick={() => window.open(src, "_blank")}>
              <ExternalLink size={14} strokeWidth={1.5} />
            </HeaderBtn>
            <HeaderBtn label="Fechar" onClick={onClose}>
              <X size={14} strokeWidth={1.5} />
            </HeaderBtn>
          </div>
        </div>

        {/* Body */}
        <div style={{ height: 480, background: "#E8E8E8" }}>
          <iframe
            src={src}
            title={fileName}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
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
