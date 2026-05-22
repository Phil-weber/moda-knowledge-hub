// Painel lateral de edição de trilha de onboarding com drag-and-drop.
import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Route as RouteIcon, X, Plus } from "lucide-react";
import type { Doc } from "@/lib/docs-context";

const TYPE_COLOR: Record<string, string> = {
  pdf: "#E57373",
  video: "#6B9CF7",
  ppt: "#F4A460",
  doc: "#5BA0D0",
};
const TYPE_BG: Record<string, string> = {
  pdf: "#FFF0F0",
  video: "#F0F4FF",
  ppt: "#FFF8F0",
  doc: "#F0F6FF",
};

export function TrailEditor({
  allFiles,
  trailIds,
  onSave,
  onClose,
}: {
  moduleId: string;
  allFiles: Doc[];
  trailIds: string[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<string[]>(trailIds);

  const inTrail = order
    .map((id) => allFiles.find((d) => d.id === id))
    .filter((d): d is Doc => Boolean(d));
  const notInTrail = allFiles.filter((d) => !order.includes(d.id));

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setOrder(arrayMove(order, oldIndex, newIndex));
  };

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        background: "#fff",
        borderLeft: "0.5px solid #E0E0E0",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* header */}
      <div
        style={{
          padding: "16px 18px",
          borderBottom: "0.5px solid #E8E8E8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RouteIcon size={14} strokeWidth={1.5} style={{ color: "#111" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>Editar trilha</span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            border: "0.5px solid #E0E0E0",
            borderRadius: 6,
            background: "#fafafa",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
          }}
        >
          <X size={13} strokeWidth={1.5} />
        </button>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#AAA",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Ordem dos passos
        </p>
        <p style={{ fontSize: 11, color: "#BBB", marginBottom: 10 }}>
          ⠿ Arraste para reordenar
        </p>

        {inTrail.length === 0 ? (
          <div
            style={{
              padding: "20px",
              border: "0.5px dashed #E0E0E0",
              borderRadius: 8,
              textAlign: "center",
              fontSize: 12,
              color: "#BBB",
            }}
          >
            Nenhum passo ainda.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {inTrail.map((doc, i) => (
                  <SortableTrailItem
                    key={doc.id}
                    doc={doc}
                    index={i}
                    onRemove={() => setOrder((o) => o.filter((id) => id !== doc.id))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {notInTrail.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#AAA",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Adicionar da lista
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {notInTrail.map((doc) => {
                const bg = TYPE_BG[doc.type] ?? "#F0F0F0";
                const color = TYPE_COLOR[doc.type] ?? "#666";
                return (
                  <button
                    key={doc.id}
                    onClick={() => setOrder((o) => [...o, doc.id])}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      border: "0.5px solid #EEE",
                      borderRadius: 7,
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 5,
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 600, color }}>
                        {doc.type?.toUpperCase().slice(0, 3)}
                      </span>
                    </div>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: "#333",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.title}
                    </span>
                    <Plus size={13} strokeWidth={1.5} style={{ color: "#AAA" }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "0.5px solid #E8E8E8",
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={onClose}
          style={{
            flex: 1,
            height: 36,
            border: "0.5px solid #E0E0E0",
            borderRadius: 8,
            background: "#fff",
            fontSize: 13,
            color: "#666",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            onSave(order);
            onClose();
          }}
          style={{
            flex: 1,
            height: 36,
            border: "none",
            borderRadius: 8,
            background: "#111",
            fontSize: 13,
            fontWeight: 500,
            color: "#fff",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Salvar trilha
        </button>
      </div>
    </div>
  );
}

function SortableTrailItem({
  doc,
  index,
  onRemove,
}: {
  doc: Doc;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: doc.id });

  const bg = TYPE_BG[doc.type] ?? "#F0F0F0";
  const color = TYPE_COLOR[doc.type] ?? "#666";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        border: "0.5px solid #E8E8E8",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <button
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          background: "transparent",
          border: "none",
          padding: 0,
          color: "#CCC",
          display: "flex",
          alignItems: "center",
        }}
        aria-label="Arraste"
      >
        <GripVertical size={13} strokeWidth={1.5} />
      </button>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 5,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 600, color }}>
          {doc.type?.toUpperCase().slice(0, 3)}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#111",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {doc.title}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#BBB",
            letterSpacing: "0.04em",
          }}
        >
          {doc.type?.toUpperCase()}
        </div>
      </div>
      <span style={{ fontSize: 10, color: "#AAA" }}>{index + 1}</span>
      <button
        onClick={onRemove}
        style={{
          width: 22,
          height: 22,
          border: "0.5px solid #E8E8E8",
          borderRadius: 5,
          background: "#fff",
          color: "#CCC",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#ef4444";
          e.currentTarget.style.borderColor = "#fca5a5";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#CCC";
          e.currentTarget.style.borderColor = "#E8E8E8";
        }}
      >
        <X size={11} strokeWidth={1.5} />
      </button>
    </div>
  );
}
