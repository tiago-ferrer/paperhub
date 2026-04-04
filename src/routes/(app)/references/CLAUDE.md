# References

Academic paper/citation library. The core research management feature.

## Routes

```
references/
  +page.svelte          # List of all references with search + filters
  +page.ts              # Loads paginated references
  new/
    +page.svelte        # Create reference (manual form or BibTeX import)
  [id]/
    +layout.ts          # Loads reference by ID; shared by all sub-routes
    +page.svelte        # Reference detail: metadata, notes, attachments, viewers
    edit/
      +page.svelte      # Edit reference metadata
    viewers/
      +page.svelte      # Manage shared viewers (who can access this paper)
      +page.ts
```

## Data Model (`$lib/types/reference.ts`)

`Reference` has:
- Bibliographic fields: `title`, `authors`, `year`, `journal`, `doi`, `url`, `abstract`, `tags`
- `entryType: BibTexEntryType` — one of 14 BibTeX types (ARTICLE, BOOK, INPROCEEDINGS, etc.)
- Notes (inline on detail page)
- Attachments (PDF files, etc.)
- Soft delete (`deletedAt`)

## API (`$lib/api/references.ts`)

Key methods beyond standard CRUD:
- `getDownloadUrl(id, attachId)` → presigned URL for downloading/viewing a PDF attachment
- `getAnnotatedPdfUrl(id, attachId)` → presigned URL for the annotated PDF version
- `getAnnotationUrl(id, attachId)` → URL for the annotation image overlay
- `addViewer(id, payload)`, `removeViewer(id, viewerId)` — sharing/collaboration
- `addNote(id, content)`, `patchNote(id, noteId, content)`, `deleteNote(id, noteId)`

## PDF Viewing

The detail page has two PDF view modes:
- **Original** — raw uploaded PDF via presigned download URL
- **Annotated** — annotated version with an image overlay (annotation image rendered on top of the PDF)

Both views use `viewers/+page.svelte` which loads the appropriate URL from the API.

## BibTeX Import

`FromBibTexModal.svelte` parses a BibTeX string (via `$lib/utils/bibtex.ts`) and pre-fills the create form. Accessible from the "New" button on the references list.

## Create Form

Manual form covers all bibliographic fields. `BibTexEntryType` selector determines which fields are shown/required.
