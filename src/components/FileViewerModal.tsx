// Modal universal de visualização de arquivos (PDF, vídeo, PPT, DOC).
import { useEffect, useState } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import mammoth from "mammoth";
import type { Doc } from "@/lib/docs-context";

interface FileViewerModalProps {
  open: boolean;
  onClose: () => void;
  doc: Doc | null;
}

export function FileViewerModal({ open, onClose, doc }: FileViewerModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !doc) return null;

  const isVideo = doc.type === "video";
  const width = isVideo ? 720 : 620;
  const height = isVideo ? 500 : 480;

  const downloadSrc =
    doc.type === "pdf" && doc.file_data
      ? `data:application/pdf;base64,${doc.file_data}`
      : doc.file_url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col overflow-hidden bg-white"
        style={{ width, border: "0.5px solid #E0E0E0", borderRadius: 12 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "14px 18px", borderBottom: "0.5px solid #E8E8E8" }}
        >
          <div className="min-w-0">
            <div
              className="truncate text-[15px]"
              style={{ fontWeight: 500, color: "#111" }}
              title={doc.title}
            >
              {doc.title}
            </div>
            <div
              className="mt-0.5 text-[11px] uppercase"
              style={{ color: "#AAA", letterSpacing: "0.06em" }}
            >
              {doc.type.toUpperCase()}
            </div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-1.5">
            <HeaderBtn
              label="Baixar"
              onClick={() => {
                const a = document.createElement("a");
                a.href = downloadSrc;
                a.download = doc.file_name || doc.title;
                a.click();
              }}
            >
              <Download size={14} strokeWidth={1.5} />
            </HeaderBtn>
            {!isVideo && (
              <HeaderBtn label="Abrir em nova aba" onClick={() => window.open(downloadSrc, "_blank")}>
                <ExternalLink size={14} strokeWidth={1.5} />
              </HeaderBtn>
            )}
            <HeaderBtn label="Fechar" onClick={onClose}>
              <X size={14} strokeWidth={1.5} />
            </HeaderBtn>
          </div>
        </div>

        <div style={{ height, background: isVideo ? "#000" : "#E8E8E8" }}>
          <ViewerBody doc={doc} />
        </div>
      </div>
    </div>
  );
}

function ViewerBody({ doc }: { doc: Doc }) {
  if (doc.type === "pdf") return <PdfViewer url={doc.file_url} data={doc.file_data} />;
  if (doc.type === "video")
    return (
      <video
        src={doc.file_url}
        controls
        autoPlay={false}
        style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
      />
    );
  return <OfficeViewer doc={doc} />;
}

function PdfViewer({ url, data }: { url: string; data?: string }) {
  const src = data ? `data:application/pdf;base64,${data}` : url;
  return (
    <object
      data={src}
      type="application/pdf"
      style={{ width: "100%", height: "100%", border: "none" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "16px",
          color: "#bbb",
        }}
      >
        <p style={{ fontSize: "14px" }}>Pré-visualização indisponível neste browser.</p>
        <a
          href={src}
          download
          style={{
            padding: "10px 20px",
            background: "#111",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "13px",
          }}
        >
          Baixar PDF
        </a>
      </div>
    </object>
  );
}

function OfficeViewer({ doc }: { doc: Doc }) {
  const isBlob = doc.file_url?.startsWith("blob:");
  if (isBlob) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "12px",
          color: "#bbb",
        }}
      >
        <p style={{ fontSize: "14px", color: "#888", textAlign: "center" }}>
          Pré-visualização de {doc.type.toUpperCase()} disponível
          <br />
          apenas após integração com servidor.
        </p>
        <a
          href={doc.file_url}
          download={doc.file_name}
          style={{
            padding: "10px 24px",
            background: "#111",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "13px",
          }}
        >
          Baixar arquivo
        </a>
      </div>
    );
  }
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(doc.file_url)}&embedded=true`;
  return (
    <iframe
      src={viewerUrl}
      style={{ width: "100%", height: "100%", border: "none" }}
      title="Visualizador de documento"
    />
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
