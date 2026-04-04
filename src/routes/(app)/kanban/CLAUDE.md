# Kanban

Drag-and-drop task board with columns and cards.

## Routes

```
kanban/
  +page.svelte            # Boards list
  +page.ts                # Loads boards (also refreshes kanbanBoards store for sidebar)
  new/
    +page.svelte          # Create board (name, description)
  [boardId]/
    +layout.ts            # Loads board by ID with all columns and cards
    +page.svelte          # Board detail: horizontal-scrollable column layout
    +page.ts
```

## Data Model (`$lib/types/kanban.ts`)

**KanbanBoard:** `id`, `name`, `description`, `columns: KanbanColumn[]`

**KanbanColumn:** `id`, `title`, `position: number`, `cards: KanbanCard[]`

**KanbanCard:** `id`, `title`, `description?`, `position: number`, `columnId`

## API (`$lib/api/kanban.ts`)

- `listBoards()`, `getBoard(id)`, `createBoard(payload)`, `patchBoard(id, payload)`, `deleteBoard(id)`
- `createColumn(boardId, payload)`, `patchColumn(boardId, colId, payload)`, `deleteColumn(boardId, colId)`
- `createCard(boardId, colId, payload)`, `patchCard(boardId, colId, cardId, payload)`, `deleteCard(boardId, colId, cardId)`
- `reorderCards(boardId, colId, cardIds: string[])` — updates card positions after drag
- `moveCard(boardId, cardId, targetColId, position)` — move card between columns

## Board Detail UI

- **Horizontal scroll** — columns laid out side by side with `overflow-x: auto`
- **HTML5 native drag-and-drop** for cards (not a library — uses `draggable`, `ondragstart`, `ondrop`)
- **SlideOver panel** for card detail/edit (open by clicking a card)
- **Board settings SlideOver** — rename board, add/reorder/delete columns
- **Inline add-card form** — "+" at bottom of each column expands an inline form
- **Inline column rename** — click column title to edit in place
