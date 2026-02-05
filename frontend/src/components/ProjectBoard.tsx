import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getBoard, saveBoard } from "@/lib/api"
import { ApiError } from "@/lib/api"
import { clearAuthenticated } from "@/lib/auth"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const ACCENT = "#b0853c"

type CardItem = { id: string; columnId: string; title: string }
type StepItem = { id: string; title: string; completed?: boolean }

const COLUMNS = [
  { id: "plans", title: "Планы" },
  { id: "in-progress", title: "В процессе" },
  { id: "done", title: "Сделано" },
] as const

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

function KanbanCard({
  card,
  isEditing,
  editTitle,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onStartEdit,
}: {
  card: CardItem
  isEditing: boolean
  editTitle: string
  onEditTitleChange: (v: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onStartEdit: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  })

  if (isEditing) {
    return (
      <div
        className="rounded-lg border border-neutral-600 bg-neutral-800/90 p-3"
        style={{ borderColor: `${ACCENT}40` }}
      >
        <input
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit()
            if (e.key === "Escape") onCancelEdit()
          }}
          className="mb-3 w-full rounded border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-[#b0853c]"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSaveEdit}
            className="rounded px-3 py-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-700"
          >
            Отмена
          </button>
        </div>
      </div>
    )
  }

  const isDone = card.columnId === "done"
  const isInProgress = card.columnId === "in-progress"

  const cardClassName = [
    "group grid cursor-grab rounded-lg border px-3 py-2.5 active:cursor-grabbing items-start",
    isDragging && "opacity-50 shadow-lg",
    isDone && "border-emerald-600/50 bg-emerald-950/30",
    isInProgress && "card-in-progress-shine border-amber-500/60 bg-amber-950/50",
    !isDone && !isInProgress && "border-neutral-600 bg-neutral-800/90",
  ].filter(Boolean).join(" ")

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cardClassName}
      style={{
        gridTemplateColumns: "1fr 3.5rem",
        minHeight: 40,
        ...(isDragging ? { boxShadow: `0 8px 24px ${ACCENT}20` } : isHovered ? { boxShadow: `0 0 0 1px rgba(255,255,255,0.08)` } : isInProgress ? { boxShadow: "0 0 12px rgba(245, 158, 11, 0.2)" } : {}),
      }}
    >
      <p className={`text-sm min-w-0 break-words pr-2 ${isDone ? "text-neutral-400 line-through" : isInProgress ? "text-amber-100" : "text-neutral-200"}`}>{card.title}</p>
      <div
        className={`flex w-14 shrink-0 items-start justify-end gap-0.5 pt-0.5 transition-opacity ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!isHovered}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onStartEdit() }}
          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-[#b0853c]"
          aria-label="Редактировать"
        >
          <IconPencil />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="rounded p-1.5 text-neutral-400 hover:bg-red-900/50 hover:text-red-400"
          aria-label="Удалить"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  )
}

function RoadmapStepItem({
  step,
  stepNumber,
  isEditing,
  editTitle,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onStartEdit,
  onToggleComplete,
}: {
  step: StepItem
  stepNumber: number
  isEditing: boolean
  editTitle: string
  onEditTitleChange: (v: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onStartEdit: () => void
  onToggleComplete: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  })
  const style = transform ? { transform: CSS.Transform.toString(transform), transition } : undefined
  const isCompleted = step.completed === true

  if (isEditing) {
    return (
      <div
        className="rounded-lg border border-neutral-600 bg-neutral-800/90 p-3"
        style={{ borderColor: `${ACCENT}40` }}
      >
        <input
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit()
            if (e.key === "Escape") onCancelEdit()
          }}
          className="mb-3 w-full rounded border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-[#b0853c]"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSaveEdit}
            className="rounded px-3 py-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-700"
          >
            Отмена
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex min-h-[44px] items-center gap-2 rounded-lg border py-2.5 pl-2 pr-3 transition-shadow ${isDragging ? "opacity-50 shadow-lg" : ""} ${isCompleted ? "border-emerald-600/50 bg-emerald-950/30" : "border-neutral-600 bg-neutral-800/90 hover:border-neutral-500"}`}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-neutral-400"
        style={isCompleted ? { backgroundColor: "rgba(34, 197, 94, 0.3)", color: "rgb(134 239 172)" } : { backgroundColor: "rgb(38 38 38)" }}
      >
        {stepNumber}
      </span>
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-700 hover:text-neutral-300 active:cursor-grabbing"
        aria-label="Перетащить"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
      <p className={`min-w-0 flex-1 text-sm ${isCompleted ? "text-neutral-400 line-through" : "text-neutral-200"}`}>{step.title}</p>
      <div
        className={`flex w-[7rem] shrink-0 justify-end gap-0.5 transition-opacity ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!isHovered}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleComplete() }}
          className={`rounded p-1.5 ${isCompleted ? "text-emerald-400 hover:bg-emerald-900/30" : "text-neutral-400 hover:bg-neutral-700 hover:text-emerald-400"}`}
          aria-label={isCompleted ? "Снять отметку" : "Отметить выполненным"}
          title={isCompleted ? "Снять отметку" : "Выполнено"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onStartEdit() }}
          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-[#b0853c]"
          aria-label="Редактировать"
        >
          <IconPencil />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="rounded p-1.5 text-neutral-400 hover:bg-red-900/50 hover:text-red-400"
          aria-label="Удалить"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  )
}

function KanbanColumn({
  col,
  cards,
  addingColumnId,
  setAddingColumnId,
  newCardTitle,
  setNewCardTitle,
  addCard,
  editingId,
  editTitle,
  setEditTitle,
  updateCard,
  setEditingId,
  removeCard,
  startEdit,
}: {
  col: (typeof COLUMNS)[number]
  cards: CardItem[]
  addingColumnId: string | null
  setAddingColumnId: (id: string | null) => void
  newCardTitle: string
  setNewCardTitle: (v: string) => void
  addCard: (columnId: string) => void
  editingId: string | null
  editTitle: string
  setEditTitle: (v: string) => void
  updateCard: (id: string, title: string) => void
  setEditingId: (id: string | null) => void
  removeCard: (id: string) => void
  startEdit: (card: CardItem) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })
  return (
    <div
      ref={setNodeRef}
      className="flex min-h-[280px] min-w-[16rem] w-72 shrink-0 flex-col rounded-xl border border-neutral-700 bg-black/40 p-3 transition-colors lg:min-h-[320px] lg:min-w-0 lg:p-4"
      style={{
        borderColor: isOver ? `${ACCENT}50` : undefined,
        boxShadow: isOver ? `0 4px 24px rgba(0,0,0,0.2), 0 0 0 2px ${ACCENT}40` : "0 4px 24px rgba(0,0,0,0.2)",
      }}
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        {col.title}
      </h2>
      <div className="flex flex-1 flex-col gap-2">
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            isEditing={editingId === card.id}
            editTitle={editTitle}
            onEditTitleChange={setEditTitle}
            onSaveEdit={() => updateCard(card.id, editTitle)}
            onCancelEdit={() => setEditingId(null)}
            onDelete={() => removeCard(card.id)}
            onStartEdit={() => startEdit(card)}
          />
        ))}
        {addingColumnId === col.id ? (
          <div className="rounded-lg border border-dashed border-neutral-600 bg-neutral-800/50 p-3">
            <input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCard(col.id)
                if (e.key === "Escape") setAddingColumnId(null)
              }}
              placeholder="Название карточки"
              className="mb-2 w-full rounded border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-[#b0853c]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addCard(col.id)}
                className="rounded px-3 py-1.5 text-xs font-medium text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Добавить
              </button>
              <button
                type="button"
                onClick={() => setAddingColumnId(null)}
                className="rounded px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-700"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingColumnId(col.id)}
            className="mt-1 cursor-pointer rounded-lg border border-dashed border-neutral-600 py-2.5 text-sm text-neutral-500 transition-colors hover:border-[#b0853c]/50 hover:text-neutral-400"
          >
            + Добавить карточку
          </button>
        )}
      </div>
    </div>
  )
}

export function ProjectBoard({ projectId, hideRoadmap }: { projectId: string; hideRoadmap?: boolean }) {
  const navigate = useNavigate()
  const [cards, setCards] = useState<CardItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [addingColumnId, setAddingColumnId] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [steps, setSteps] = useState<StepItem[]>([])
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editStepTitle, setEditStepTitle] = useState("")
  const [addingStep, setAddingStep] = useState(false)
  const [newStepTitle, setNewStepTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const hasLoaded = useRef(false)

  useEffect(() => {
    hasLoaded.current = false
    setLoading(true)
    setLoadError(null)
    getBoard(projectId)
      .then(({ cards: c, steps: s }) => {
        setCards(c)
        setSteps(s)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearAuthenticated()
          navigate("/login", { replace: true })
          return
        }
        setLoadError("Не удалось загрузить доску")
      })
      .finally(() => {
        setLoading(false)
        hasLoaded.current = true
      })
  }, [projectId, navigate])

  useEffect(() => {
    if (!hasLoaded.current) return
    saveBoard(projectId, cards, steps)
      .then(() => setSaveError(null))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearAuthenticated()
          navigate("/login", { replace: true })
          return
        }
        setSaveError("Не удалось сохранить")
      })
  }, [projectId, cards, steps])

  async function retrySave() {
    setSaveError(null)
    try {
      await saveBoard(projectId, cards, steps)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthenticated()
        navigate("/login", { replace: true })
        return
      }
      setSaveError("Не удалось сохранить")
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null

  const getColumnId = (id: string): string | null => {
    if (COLUMNS.some((c) => c.id === id)) return id
    return cards.find((c) => c.id === id)?.columnId ?? null
  }

  const handleKanbanDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)
  const handleKanbanDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const targetCol = getColumnId(over.id as string)
    const currentCol = cards.find((c) => c.id === active.id)?.columnId
    if (targetCol && targetCol !== currentCol) {
      setCards((prev) =>
        prev.map((c) => (c.id === active.id ? { ...c, columnId: targetCol } : c))
      )
    }
  }

  const handleRoadmapDragStart = (e: DragStartEvent) => setActiveStepId(e.active.id as string)
  const handleRoadmapDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveStepId(null)
    if (!over || active.id === over.id) return
    const oldIndex = steps.findIndex((s) => s.id === active.id)
    const newIndex = steps.findIndex((s) => s.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      setSteps((prev) => arrayMove(prev, oldIndex, newIndex))
    }
  }
  const activeStep = activeStepId ? steps.find((s) => s.id === activeStepId) : null

  const addCard = (columnId: string) => {
    const title = newCardTitle.trim() || "Новая карточка"
    setCards((prev) => [
      ...prev,
      { id: `card-${Date.now()}-${Math.random().toString(36).slice(2)}`, columnId, title },
    ])
    setNewCardTitle("")
    setAddingColumnId(null)
  }

  const updateCard = (id: string, title: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, title: title.trim() || c.title } : c)))
    setEditingId(null)
  }

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id))
    setEditingId(null)
  }

  const startEdit = (card: CardItem) => {
    setEditingId(card.id)
    setEditTitle(card.title)
  }

  const addStep = () => {
    const title = newStepTitle.trim() || "Новый шаг"
    setSteps((prev) => [
      ...prev,
      { id: `step-${Date.now()}-${Math.random().toString(36).slice(2)}`, title, completed: false },
    ])
    setNewStepTitle("")
    setAddingStep(false)
  }

  const updateStep = (id: string, title: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, title: title.trim() || s.title } : s)))
    setEditingStepId(null)
  }

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id))
    setEditingStepId(null)
  }

  const startEditStep = (step: StepItem) => {
    setEditingStepId(step.id)
    setEditStepTitle(step.title)
  }

  const toggleStepComplete = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s))
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        Загрузка…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center text-red-400">
        {loadError}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {saveError && (
        <div
          className="flex items-center justify-between gap-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          <span>{saveError}</span>
          <button
            type="button"
            onClick={retrySave}
            className="shrink-0 rounded px-3 py-1.5 text-sm font-medium text-red-100 transition-colors hover:bg-red-900/50"
          >
            Повторить
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="min-w-0 flex-1 lg:min-h-0">
        <h1 className="mb-4 text-base font-semibold text-neutral-200 lg:mb-6 lg:text-lg" style={{ borderBottom: `2px solid ${ACCENT}`, paddingBottom: 4, width: "fit-content" }}>
          Доска задач
        </h1>
        <DndContext sensors={sensors} onDragStart={handleKanbanDragStart} onDragEnd={handleKanbanDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 lg:gap-4">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                col={col}
                cards={cards.filter((c) => c.columnId === col.id)}
                addingColumnId={addingColumnId}
                setAddingColumnId={setAddingColumnId}
                newCardTitle={newCardTitle}
                setNewCardTitle={setNewCardTitle}
                addCard={addCard}
                editingId={editingId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                updateCard={updateCard}
                setEditingId={setEditingId}
                removeCard={removeCard}
                startEdit={startEdit}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div
                className={`cursor-grabbing rounded-lg border px-3 py-2.5 shadow-xl ${activeCard.columnId === "in-progress" ? "border-amber-500/60 bg-amber-950/50" : ""}`}
                style={{
                  width: 288,
                  minWidth: 288,
                  maxWidth: 288,
                  ...(activeCard.columnId === "done"
                    ? { borderColor: "rgba(34, 197, 94, 0.5)", backgroundColor: "rgba(6, 78, 59, 0.4)" }
                    : activeCard.columnId === "in-progress"
                      ? { boxShadow: "0 8px 24px rgba(245, 158, 11, 0.25)" }
                      : { borderColor: `${ACCENT}60`, backgroundColor: "rgb(38 38 38)" }),
                }}
              >
                <p
                  className={`text-sm break-words pr-10 ${
                    activeCard.columnId === "done"
                      ? "text-neutral-400 line-through"
                      : activeCard.columnId === "in-progress"
                        ? "text-amber-100"
                        : "text-neutral-200"
                  }`}
                >
                  {activeCard.title}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {!hideRoadmap && (
      <aside className="w-full shrink-0 border-t border-neutral-800 pt-4 lg:w-80 lg:border-t-0 lg:pt-0">
        <h2 className="mb-3 text-base font-semibold text-neutral-200 lg:mb-4 lg:text-lg" style={{ borderBottom: `2px solid ${ACCENT}`, paddingBottom: 4, width: "fit-content" }}>
          Роадмап
        </h2>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleRoadmapDragStart}
          onDragEnd={handleRoadmapDragEnd}
        >
          <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col items-center gap-0">
              {steps.map((step, index) => (
                <div key={step.id} className="flex w-full flex-col items-center gap-0.5">
                  <div className="w-full">
                    <RoadmapStepItem
                      step={step}
                      stepNumber={index + 1}
                      isEditing={editingStepId === step.id}
                      editTitle={editStepTitle}
                      onEditTitleChange={setEditStepTitle}
                      onSaveEdit={() => updateStep(step.id, editStepTitle)}
                      onCancelEdit={() => setEditingStepId(null)}
                      onDelete={() => removeStep(step.id)}
                      onStartEdit={() => startEditStep(step)}
                      onToggleComplete={() => toggleStepComplete(step.id)}
                    />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="h-4 w-0.5 shrink-0 rounded-full bg-neutral-500" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeStep ? (
              <div
                className="cursor-grabbing rounded-lg border border-neutral-600 bg-neutral-800/90 px-3 py-2.5 shadow-xl"
                style={{ minWidth: 200 }}
              >
                <p className="text-sm text-neutral-200">{activeStep.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        {addingStep ? (
          <div className="mt-4 rounded-lg border border-dashed border-neutral-600 bg-neutral-800/50 p-3">
            <input
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addStep()
                if (e.key === "Escape") setAddingStep(false)
              }}
              placeholder="Название шага"
              className="mb-2 w-full rounded border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-[#b0853c]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addStep}
                className="rounded px-3 py-1.5 text-xs font-medium text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Добавить
              </button>
              <button
                type="button"
                onClick={() => setAddingStep(false)}
                className="rounded px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-700"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingStep(true)}
            className="mt-4 w-full cursor-pointer rounded-lg border border-dashed border-neutral-600 py-2.5 text-sm text-neutral-500 transition-colors hover:border-[#b0853c]/50 hover:text-neutral-400"
          >
            + Добавить шаг
          </button>
        )}
      </aside>
      )}
      </div>
    </div>
  )
}
