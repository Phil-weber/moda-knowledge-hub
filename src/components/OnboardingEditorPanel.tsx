// Painel lateral de edição da trilha de onboarding (drag-and-drop com @dnd-kit).
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
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
import {
  Route as RouteIcon,
  X,
  GripVertical,
  FilePlus,
  Upload,
  FileText,
  Play,
  Presentation,
  File as FileIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FileType = "PDF" | "Vídeo" | "PPT" | "DOC";

interface Step {
  id: string;
  title: string;
  type: FileType;
  meta: string;
}

const TYPE_STYLES: Record<FileType, { bg: string; color: string; Icon: LucideIcon }> = {
  PDF: { bg: "#FFF5F5", color: "#E57373", Icon: FileText },
  "Vídeo": { bg: "#F0F4FF", color: "#6B9CF7", Icon: Play },
  PPT: { bg: "#FFF8F0", color: "#F4A460", Icon: Presentation },
  DOC: { bg: "#F0F6FF", color: "#5BA0D0", Icon: FileIcon },
};

const INITIAL_STEPS: Step[] = [
  { id: "1", title: "Intro ao Tech Pack", type: "PDF", meta: "PDF · 2.1 MB" },
  { id: "2", title: "Aula: Estrutura de ficha", type: "Vídeo", meta: "Vídeo · 18 MB" },
  { id: "3", title: "Apresentação de processos", type: "PPT", meta: "PPT · 8.4 MB" },
  { id: "4", title: "Manual de preenchimento", type: "PDF", meta: "PDF · 1.8 MB" },
  { id: "5", title: "Revisão final", type: "Vídeo", meta: "Vídeo · 12 MB" },
];

export function OnboardingEditorPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (!open) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSteps((items) => {
      const oldIdx = items.findIndex((i) => i.id === active.id);
      const newIdx = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIdx, newIdx);
    });
  };

  const removeStep = (id: string) => setSteps((s) => s.filter((i) => i.id !== id));

  return (
    <aside
      className="flex flex-col"
      style={{
        width: 300,
        background: "#FFF",
        borderLeft: "0.5px solid #E0E0E0",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "16px 18px", borderBottom: "0.5px solid #E8E8E8" }}
      >
        <div className="flex items-center gap-2">
          <RouteIcon size={14} strokeWidth={1.5} style={{ color: "#111" }} />
          <span className="text-[14px]" style={{ fontWeight: 500, color: "#111" }}>
            Editar trilha
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center transition-colors duration-150"
          style={{
            width: 28,
            height: 28,
            border: "0.5px solid #E0E0E0",
            borderRadius: 6,
            background: "#F9F9F9",
            color: "#666",
          }}
        >
          <X size={13} strokeWidth={1.5} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "14px 16px" }}>
        <div
          className="text-[10px] uppercase"
          style={{ color: "#BBB", letterSpacing: "0.08em" }}
        >
          Ordem dos passos
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <GripVertical size={12} strokeWidth={1.5} style={{ color: "#BBB" }} />
          <span className="text-[11px]" style={{ color: "#BBB" }}>
            Arraste para reordenar
          </span>
        </div>

        <div className="mt-2.5 flex flex-col" style={{ gap: 10 }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {steps.map((step, idx) => (
                <SortableStep
                  key={step.id}
                  step={step}
                  index={idx + 1}
                  onRemove={() => removeStep(step.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Adicionar passo */}
        <div
          className="mt-3"
          style={{
            border: "0.5px dashed #D0D0D0",
            borderRadius: 9,
            padding: 12,
          }}
        >
          <div className="text-[12px]" style={{ fontWeight: 500, color: "#AAA" }}>
            Adicionar passo
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <AddBtn icon={FilePlus} label="Do módulo" />
            <AddBtn icon={Upload} label="Upload" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex gap-2"
        style={{ padding: "12px 16px", borderTop: "0.5px solid #E8E8E8" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex-1 text-[13px] transition-colors duration-150"
          style={{
            height: 36,
            border: "0.5px solid #E0E0E0",
            borderRadius: 7,
            background: "#FFF",
            color: "#666",
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="flex-1 text-[13px] text-white transition-colors duration-150"
          style={{ height: 36, background: "#111", borderRadius: 7, fontWeight: 500 }}
        >
          Salvar trilha
        </button>
      </div>
    </aside>
  );
}

function AddBtn({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-1.5 text-[12px] transition-colors duration-150"
      style={{
        height: 34,
        border: "0.5px solid #E0E0E0",
        borderRadius: 7,
        background: "#FAFAFA",
        color: "#666",
      }}
    >
      <Icon size={13} strokeWidth={1.5} />
      {label}
    </button>
  );
}

function SortableStep({
  step,
  index,
  onRemove,
}: {
  step: Step;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: step.id });
  const style = TYPE_STYLES[step.type];
  const { Icon } = style;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: "#FAFAFA",
        border: isDragging
          ? "0.5px dashed #999"
          : isOver
          ? "1px solid #111"
          : "0.5px solid #E0E0E0",
        borderRadius: 9,
        padding: "10px 12px",
        opacity: isDragging ? 0.4 : 1,
      }}
      className="flex items-center gap-2.5"
    >
      {/* Grip handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex shrink-0 cursor-grab flex-col justify-center active:cursor-grabbing"
        style={{ gap: 2.5 }}
        aria-label="Arrastar"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ width: 14, height: 1.5, background: "#CCC", display: "block" }}
          />
        ))}
      </button>

      {/* Tipo icon */}
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ width: 36, height: 36, background: style.bg, borderRadius: 6 }}
      >
        <Icon size={16} strokeWidth={1.5} style={{ color: style.color }} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[12px]"
          style={{ fontWeight: 500, color: "#111" }}
          title={step.title}
        >
          {step.title}
        </div>
        <div className="mt-0.5 text-[10px]" style={{ color: "#AAA" }}>
          {step.meta}
        </div>
      </div>

      {/* Badge número */}
      <div
        className="flex shrink-0 items-center justify-center text-[10px] text-white"
        style={{ width: 20, height: 20, borderRadius: 999, background: "#111", fontWeight: 600 }}
      >
        {index}
      </div>

      {/* Remover */}
      <button
        type="button"
        onClick={onRemove}
        className="flex shrink-0 items-center justify-center transition-colors duration-150"
        style={{
          width: 22,
          height: 22,
          border: "0.5px solid #E8E8E8",
          borderRadius: 5,
          background: "#FFF",
          color: "#888",
        }}
      >
        <X size={11} strokeWidth={1.5} />
      </button>
    </div>
  );
}
