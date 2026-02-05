import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getBoard, saveBoard } from "@/lib/api"
import type { CardItem } from "@/lib/api"
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
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"

const ACCENT = "#b0853c"

const COLUMNS = [
  { id: "comfortrade", label: "ComforTrade", image: "/comfortrade.png" },
  { id: "dovi", label: "Dovi", image: "/dovi.jpg" },
  { id: "zavdannya-ua", label: "Завдання", image: "/tasks.png" },
  { id: "prochee", label: "Прочее", image: null },
] as const

const BOARD_ID = "todo"

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

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group grid cursor-grab rounded-lg border border-neutral-600 bg-neutral-800/90 px-3 py-2.5 active:cursor-grabbing items-start ${isDragging ? "opacity-50 shadow-lg" : ""}`}
      style={{
        gridTemplateColumns: "1fr 3.5rem",
        minHeight: 40,
        ...(isDragging ? { boxShadow: `0 8px 24px ${ACCENT}20` } : isHovered ? { boxShadow: `0 0 0 1px rgba(255,255,255,0.08)` } : {}),
      }}
    >
      <p className="text-sm min-w-0 break-words pr-2 text-neutral-200">{card.title}</p>
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
      <div className="mb-4 flex items-center gap-2">
        {col.image ? (
          <img src={col.image} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-700 text-xs text-neutral-400">…</span>
        )}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          {col.label}
        </h2>
      </div>
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

export function ToDoPage() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<CardItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [addingColumnId, setAddingColumnId] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const hasLoaded = useRef(false)

  useEffect(() => {
    setLoading(true)
    setLoadError(null)
    hasLoaded.current = false
    getBoard(BOARD_ID)
      .then(({ cards: c }) => setCards(c ?? []))
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
  }, [navigate])

  useEffect(() => {
    if (!hasLoaded.current) return
      saveBoard(BOARD_ID, cards, [])
        .then(() => setSaveError(null))
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            clearAuthenticated()
            navigate("/login", { replace: true })
            return
          }
          setSaveError("Не удалось сохранить")
        })
  }, [cards, navigate])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null

  const getColumnId = (id: string): string | null => {
    if (COLUMNS.some((c) => c.id === id)) return id
    return cards.find((c) => c.id === id)?.columnId ?? null
  }

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)
  const handleDragEnd = (e: DragEndEvent) => {
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
            onClick={() => {
              setSaveError(null)
              saveBoard(BOARD_ID, cards, []).then(() => setSaveError(null)).catch(() => setSaveError("Не удалось сохранить"))
            }}
            className="shrink-0 rounded px-3 py-1.5 text-sm font-medium text-red-100 transition-colors hover:bg-red-900/50"
          >
            Повторить
          </button>
        </div>
      )}
      <h1 className="text-base font-semibold text-neutral-200 lg:text-lg" style={{ borderBottom: `2px solid ${ACCENT}`, paddingBottom: 4, width: "fit-content" }}>
        To Do
      </h1>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
              className="cursor-grabbing rounded-lg border border-neutral-600 bg-neutral-800/90 px-3 py-2.5 shadow-xl"
              style={{ width: 288, minWidth: 288, maxWidth: 288 }}
            >
              <p className="text-sm break-words pr-10 text-neutral-200">{activeCard.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
