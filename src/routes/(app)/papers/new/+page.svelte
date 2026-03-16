<script lang="ts">
  import { goto } from '$app/navigation'
  import { papersApi } from '$lib/api/papers'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { BIBTEX_ENTRY_TYPES, type BibTexEntryType } from '$lib/types/paper'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import TagInput from '$lib/components/forms/TagInput.svelte'

  // Identity
  let entryType   = $state<BibTexEntryType>('article')
  let citationKey = $state('')
  let title       = $state('')
  let abstract    = $state('')

  // Authors
  let author  = $state<string[]>([])
  let editor  = $state<string[]>([])

  // Publication
  let journal   = $state('')
  let booktitle = $state('')
  let year      = $state(new Date().getFullYear())
  let month     = $state('')
  let volume    = $state('')
  let number    = $state('')
  let pages     = $state('')
  let series    = $state('')

  // Publisher
  let publisher = $state('')
  let address   = $state('')
  let edition   = $state('')

  // Links
  let doi = $state('')
  let url = $state('')

  // Extra
  let note          = $state('')
  let categories    = $state<string[]>([])
  let citationCount = $state(0)

  let saving = $state(false)
  let errors = $state<Record<string, string>>({})

  // Field visibility per entry type
  const showField = $derived.by(() => {
    const t = entryType
    return {
      author:    true,
      editor:    ['book', 'inbook', 'incollection', 'proceedings'].includes(t),
      journal:   ['article'].includes(t),
      booktitle: ['inproceedings', 'conference', 'incollection', 'inbook'].includes(t),
      volume:    ['article', 'book', 'inbook', 'incollection', 'proceedings'].includes(t),
      number:    ['article', 'techreport'].includes(t),
      pages:     ['article', 'inproceedings', 'conference', 'incollection', 'inbook'].includes(t),
      series:    ['book', 'inbook', 'incollection', 'inproceedings', 'conference', 'proceedings'].includes(t),
      publisher: ['book', 'inbook', 'incollection', 'inproceedings', 'conference', 'proceedings', 'techreport', 'manual'].includes(t),
      address:   ['book', 'inbook', 'incollection', 'inproceedings', 'conference', 'phdthesis', 'mastersthesis', 'techreport', 'manual', 'booklet'].includes(t),
      edition:   ['book', 'inbook', 'incollection', 'manual'].includes(t),
      month:     ['article', 'inproceedings', 'conference', 'phdthesis', 'mastersthesis', 'techreport', 'booklet', 'unpublished'].includes(t),
      note:      ['unpublished', 'misc', 'phdthesis', 'mastersthesis', 'techreport', 'manual'].includes(t),
    }
  })

  // Auto-generate citation key: FirstAuthorLastname + Year
  function autoKey() {
    const lastName = author[0]?.split(' ').pop() ?? editor[0]?.split(' ').pop() ?? ''
    if (lastName && year) citationKey = `${lastName.toLowerCase()}${year}`
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'

    // entry-type specific required fields
    const t = entryType
    const needAuthor = ['article', 'inproceedings', 'conference', 'incollection',
                        'phdthesis', 'mastersthesis', 'techreport', 'unpublished',
                        'booklet', 'misc'].includes(t)
    const needAuthorOrEditor = ['book', 'inbook'].includes(t)
    const needJournal    = t === 'article'
    const needBooktitle  = ['inproceedings', 'conference', 'incollection'].includes(t)
    const needPublisher  = ['book', 'inbook', 'incollection'].includes(t)
    const needNote       = t === 'unpublished'

    if (needAuthor && !author.length)            e.author    = 'At least one author is required'
    if (needAuthorOrEditor && !author.length && !editor.length)
                                                  e.author    = 'Author or editor is required'
    if (needJournal   && !journal.trim())         e.journal   = 'Journal is required'
    if (needBooktitle && !booktitle.trim())       e.booktitle = 'Booktitle is required'
    if (needPublisher && !publisher.trim())       e.publisher = 'Publisher is required'
    if (needNote      && !note.trim())            e.note      = 'Note is required for unpublished'

    return e
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    errors = validate()
    if (Object.keys(errors).length) return

    saving = true
    try {
      const paper = await papersApi.create({
        entry_type:     entryType,
        title:          title.trim(),
        citation_key:   citationKey.trim() || null,
        author:         author.length ? author : null,
        editor:         editor.length ? editor : null,
        year:           year || null,
        month:          month.trim() || null,
        journal:        journal.trim() || null,
        booktitle:      booktitle.trim() || null,
        volume:         volume.trim() || null,
        number:         number.trim() || null,
        pages:          pages.trim() || null,
        series:         series.trim() || null,
        publisher:      publisher.trim() || null,
        address:        address.trim() || null,
        edition:        edition.trim() || null,
        doi:            doi.trim() || null,
        url:            url.trim() || null,
        abstract:       abstract.trim() || null,
        note:           note.trim() || null,
        categories:     categories.length ? categories : null,
        citation_count: citationCount || null,
      })
      toast.success('Paper created')
      goto(`/papers/${paper.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create paper')
    } finally {
      saving = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/papers" class="back-link">← Papers</a>
    <h1>New Paper</h1>
  </div>

  <form onsubmit={submit} class="form">

    <!-- Identity -->
    <fieldset class="group">
      <legend class="group-legend">Identity</legend>
      <div class="form-grid">
        <FormField label="Entry Type" required>
          <select bind:value={entryType}>
            {#each BIBTEX_ENTRY_TYPES as t}
              <option value={t}>{t}</option>
            {/each}
          </select>
        </FormField>
        <FormField label="Title" required error={errors.title}>
          <input type="text" bind:value={title} />
        </FormField>
        <FormField label="Citation Key">
          <div class="input-with-action">
            <input type="text" bind:value={citationKey} placeholder="e.g. einstein1905" />
            <button type="button" class="auto-btn" onclick={autoKey} title="Auto-generate from first author + year">
              Auto
            </button>
          </div>
        </FormField>
        <FormField label="Abstract">
          <textarea bind:value={abstract} rows={5} placeholder="Optional abstract…"></textarea>
        </FormField>
      </div>
    </fieldset>

    <!-- Authors -->
    <fieldset class="group">
      <legend class="group-legend">Authors</legend>
      <div class="form-grid">
        <FormField label="Author(s)" error={errors.author}>
          <TagInput bind:tags={author} placeholder="Full name, press Enter…" />
        </FormField>
        {#if showField.editor}
          <FormField label="Editor(s)">
            <TagInput bind:tags={editor} placeholder="Full name, press Enter…" />
          </FormField>
        {/if}
      </div>
    </fieldset>

    <!-- Publication -->
    <fieldset class="group">
      <legend class="group-legend">Publication</legend>
      <div class="form-grid">
        {#if showField.journal}
          <FormField label="Journal" error={errors.journal}>
            <input type="text" bind:value={journal} />
          </FormField>
        {/if}
        {#if showField.booktitle}
          <FormField label="Booktitle" error={errors.booktitle}>
            <input type="text" bind:value={booktitle} placeholder="Conference or book title" />
          </FormField>
        {/if}
        <div class="row-2">
          <FormField label="Year">
            <input type="number" bind:value={year} min="1000" max={new Date().getFullYear() + 5} />
          </FormField>
          {#if showField.month}
            <FormField label="Month">
              <input type="text" bind:value={month} placeholder="e.g. jan, March" />
            </FormField>
          {/if}
        </div>
        {#if showField.volume || showField.number}
          <div class="row-2">
            {#if showField.volume}
              <FormField label="Volume"><input type="text" bind:value={volume} /></FormField>
            {/if}
            {#if showField.number}
              <FormField label="Number / Issue"><input type="text" bind:value={number} /></FormField>
            {/if}
          </div>
        {/if}
        {#if showField.pages}
          <FormField label="Pages">
            <input type="text" bind:value={pages} placeholder="e.g. 123–145" />
          </FormField>
        {/if}
        {#if showField.series}
          <FormField label="Series"><input type="text" bind:value={series} /></FormField>
        {/if}
      </div>
    </fieldset>

    <!-- Publisher -->
    {#if showField.publisher || showField.address || showField.edition}
      <fieldset class="group">
        <legend class="group-legend">Publisher</legend>
        <div class="form-grid">
          {#if showField.publisher}
            <FormField label="Publisher" error={errors.publisher}>
              <input type="text" bind:value={publisher} />
            </FormField>
          {/if}
          {#if showField.address}
            <FormField label="Address / City">
              <input type="text" bind:value={address} />
            </FormField>
          {/if}
          {#if showField.edition}
            <FormField label="Edition">
              <input type="text" bind:value={edition} placeholder='e.g. "2nd"' />
            </FormField>
          {/if}
        </div>
      </fieldset>
    {/if}

    <!-- Links -->
    <fieldset class="group">
      <legend class="group-legend">Links</legend>
      <div class="form-grid">
        <FormField label="DOI">
          <input type="text" bind:value={doi} placeholder="10.xxxx/xxxxx" />
        </FormField>
        <FormField label="URL">
          <input type="url" bind:value={url} placeholder="https://…" />
        </FormField>
      </div>
    </fieldset>

    <!-- Extra -->
    <fieldset class="group">
      <legend class="group-legend">Extra</legend>
      <div class="form-grid">
        {#if showField.note}
          <FormField label="Note" error={errors.note}>
            <input type="text" bind:value={note} placeholder="BibTeX note field" />
          </FormField>
        {/if}
        <FormField label="Categories">
          <TagInput bind:tags={categories} placeholder="Tag, press Enter…" />
        </FormField>
        <FormField label="Citation Count">
          <input type="number" bind:value={citationCount} min="0" />
        </FormField>
      </div>
    </fieldset>

    <div class="form-actions">
      <Button variant="outlined" onclick={() => goto('/papers')}>Cancel</Button>
      <Button type="submit" loading={saving}>Create Paper</Button>
    </div>
  </form>
</div>

<style>
  .page { max-width: 100%; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; }

  .form { display: flex; flex-direction: column; gap: 20px; }

  .group {
    border: 1px solid var(--color-surface-3); border-radius: 10px; padding: 20px;
    background: var(--color-surface-0);
  }
  .group-legend {
    padding: 0 8px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--color-text-secondary);
  }

  .form-grid { display: flex; flex-direction: column; gap: 16px; }
  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  select {
    width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-primary);
    font-size: 0.875rem; font-family: inherit; outline: none;
    transition: border-color var(--transition-standard);
    text-transform: capitalize;
  }
  select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .input-with-action { display: flex; gap: 8px; }
  .input-with-action input { flex: 1; }
  .auto-btn {
    padding: 0 12px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-1); color: var(--color-text-secondary);
    font-size: 0.8125rem; cursor: pointer; white-space: nowrap;
    transition: background var(--transition-standard);
  }
  .auto-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

  :global(.form textarea),
  :global(.group input[type="text"]),
  :global(.group input[type="url"]),
  :global(.group input[type="number"]) {
    width: 100%; padding: 8px 12px; border-radius: 6px;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
    box-sizing: border-box;
  }
  :global(.form textarea:focus),
  :global(.group input:focus) { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }
  :global(.form textarea) { resize: vertical; }

  .form-actions { display: flex; justify-content: flex-end; gap: 10px; }

  @media (max-width: 1019px) {
    .page { max-width: 100%; }
    .group { padding: 14px 12px; }
    .row-2 { grid-template-columns: 1fr; }
  }
</style>
