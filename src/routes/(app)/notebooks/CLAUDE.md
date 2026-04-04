# Notebooks

Markdown notebook collections with text posts and handwriting post support.

## Routes

```
notebooks/
  +page.svelte              # Notebook list with includeDeleted toggle
  +page.ts                  # Loads paginated notebooks
  new/
    +page.svelte            # Create notebook (name, description)
  [id]/
    +layout.ts              # Loads notebook by ID
    +page.svelte            # Notebook overview: posts list
    +page.ts                # Loads posts with pagination + includeDeleted
    edit/
      +page.svelte          # Edit notebook name/description
    posts/
      +page.ts              # (shared loader for posts sub-routes)
      new/
        +page.svelte        # Create new text post (markdown editor + paper picker)
      [postId]/
        +layout.ts          # Loads post by ID
        +page.svelte        # Post detail: rendered markdown, attachments
        +page.ts
        edit/
          +page.svelte      # Edit post content, title, linked papers, attachments
    handwriting-posts/
      [postId]/
        +layout.ts          # Loads handwriting post by ID
        +page.svelte        # View handwriting post: PDF + drawing overlay
        +page.ts
```

## Data Model (`$lib/types/notebook.ts`)

**Notebook:** `id`, `name`, `description`, `createdAt`, `deletedAt`

**NotebookPost (text post):** `id`, `title`, `content` (Markdown), `linkedPaperIds: string[]`, `attachments: PostAttachment[]`, `deletedAt`

**HandwritingPost:** `id`, `title`, `createdAt` — has a PDF and a drawing file, fetched via separate presigned URL endpoints

## API (`$lib/api/notebooks.ts`)

- Standard CRUD for notebooks and posts
- `restore(id)` / `restorePost(id, postId)` — undo soft delete
- `getHandwritingPostPdfUrl(id, postId)` — presigned URL for PDF
- `getHandwritingPostDrawingUrl(id, postId)` — presigned URL for drawing image
- `uploadPostAttachment(id, postId, file)` — upload file attachment to a post
- `getPostAttachmentUrl(id, postId, attachId)` — presigned download URL
- `deletePostAttachment(id, postId, attachId)`

## Post Editor Features

- Split editor/preview pane
- Markdown + KaTeX math (`$...$` inline, `$$...$$` block)
- Paper association: checkbox picker listing all user's references (`linkedPaperIds`)
- File attachment: upload + list existing + delete

## Soft Deletes

Both notebooks and posts support soft delete. The notebooks list and post list have an `includeDeleted` toggle. Deleted items appear muted with strikethrough and a restore button.
