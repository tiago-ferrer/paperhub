<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { buildPatch } from '$lib/utils/diff'
  import { BIBTEX_ENTRY_TYPES, type BibTexEntryType, type Reference } from '$lib/types/reference'
  import FormField from '$lib/components/forms/FormField.svelte'
  import TagInput from '$lib/components/forms/TagInput.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import { onMount } from 'svelte'

  const id = $page.params.id as string

  let original = $state<Reference | null>(null)
  let loading  = $state(true)
  let saving   = $state(false)
  let errors   = $state<Record<string, string>>({})

  // Identity
  let entryType   = $state<BibTexEntryType>('article')
  let citationKey = $state('')
  let title       = $state('')
  let abstract    = $state('')

  // Authors
  let author = $state<string[]>([])
  let editor = $state<string[]>([])

  // Publication
  let journal   = $state('')
  let booktitle = $state('')
  let year      = $state<number | null>(null)
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
  let citationCount = $state<number | null>(null)

  function autoKey() {
    const lastName = author[0]?.split(' ').pop() ?? editor[0]?.split(' ').pop() ?? ''
    if (lastName && year) citationKey = `${lastName.toLowerCase()}${year}`
  }

  onMount(async () => {
    try {
      const p = await referencesApi.get(id)
      original    = p
      entryType   = p.entry_type
      citationKey = p.citation_key ?? ''
      title       = p.title
      abstract    = p.abstract ?? ''
      author      = [...(p.author ?? [])]
      editor      = [...(p.editor ?? [])]
      journal     = p.journal ?? ''
      booktitle   = p.booktitle ?? ''
      year        = p.year
      month       = p.month ?? ''
      volume      = p.volume ?? ''
      number      = p.number ?? ''
      pages       = p.pages ?? ''
      series      = p.series ?? ''
      publisher   = p.publisher ?? ''
      address     = p.address ?? ''
      edition     = p.edition ?? ''
      doi         = p.doi ?? ''
      url         = p.url ?? ''
      note        = p.note ?? ''
      categories  = [...(p.categories ?? [])]
      citationCount = p.citation_count
    } catch {
      toast.error('Failed to load reference')
      goto('/references')
    } finally {
      loading = false
    }
  })

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    return e
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    if (!original) return
    errors = validate()
    if (Object.keys(errors).length) return

    const current = {
      entry_type:     entryType,
      citation_key:   citationKey.trim() || null,
      title:          title.trim(),
      author:         author.length ? author : null,
      editor:         editor.length ? editor : null,
      year,
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
      citation_count: citationCount,
    }

    const patch = buildPatch(original, current as Partial<Reference>)
    if (!Object.keys(patch).length) {
      toast.info('No changes to save')
      return
    }

    saving = true
    try {
      await referencesApi.patch(id, patch)
      toast.success('Reference updated')
      await invalidateAll()
      goto(`/references/${id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update')
    } finally {
      saving = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/references/{id}" class="back-link">← Reference</a>
    <h1>Edit Reference</h1>
  </div>

  {#if loading}
    <div class="loading"><Spinner size={41} /></div>
  {:else}
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
            <textarea bind:value={abstract} rows={5}></textarea>
          </FormField>
        </div>
      </fieldset>

      <!-- Authors -->
      <fieldset class="group">
        <legend class="group-legend">Authors</legend>
        <div class="form-grid">
          <FormField label="Author(s)">
            <TagInput bind:tags={author} placeholder="Full name, press Enter…" />
          </FormField>
          <FormField label="Editor(s)">
            <TagInput bind:tags={editor} placeholder="Full name, press Enter…" />
          </FormField>
        </div>
      </fieldset>

      <!-- Publication -->
      <fieldset class="group">
        <legend class="group-legend">Publication</legend>
        <div class="form-grid">
          <FormField label="Journal">
            <input type="text" bind:value={journal} />
          </FormField>
          <FormField label="Booktitle">
            <input type="text" bind:value={booktitle} placeholder="Conference or book title" />
          </FormField>
          <div class="row-2">
            <FormField label="Year">
              <input type="number" bind:value={year} min="1000" max={new Date().getFullYear() + 5} />
            </FormField>
            <FormField label="Month">
              <input type="text" bind:value={month} placeholder="e.g. jan, March" />
            </FormField>
          </div>
          <div class="row-2">
            <FormField label="Volume"><input type="text" bind:value={volume} /></FormField>
            <FormField label="Number / Issue"><input type="text" bind:value={number} /></FormField>
          </div>
          <FormField label="Pages">
            <input type="text" bind:value={pages} placeholder="e.g. 123–145" />
          </FormField>
          <FormField label="Series"><input type="text" bind:value={series} /></FormField>
        </div>
      </fieldset>

      <!-- Publisher -->
      <fieldset class="group">
        <legend class="group-legend">Publisher</legend>
        <div class="form-grid">
          <FormField label="Publisher">
            <input type="text" bind:value={publisher} />
          </FormField>
          <FormField label="Address / City">
            <input type="text" bind:value={address} />
          </FormField>
          <FormField label="Edition">
            <input type="text" bind:value={edition} placeholder='e.g. "2nd"' />
          </FormField>
        </div>
      </fieldset>

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
          <FormField label="Bibliographic note">
            <input type="text" bind:value={note} placeholder="BibTeX note field" />
          </FormField>
          <FormField label="Categories">
            <TagInput bind:tags={categories} placeholder="Tag, press Enter…" />
          </FormField>
          <FormField label="Citation Count">
            <input type="number" bind:value={citationCount} min="0" />
          </FormField>
        </div>
      </fieldset>

      <div class="form-actions">
        <Button variant="outlined" onclick={() => goto(`/references/${id}`)}>Cancel</Button>
        <Button type="submit" loading={saving}>Save Changes</Button>
      </div>
    </form>
  {/if}
</div>

<style>
  .page { max-width: 100%; overflow-x: hidden; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .loading { display: flex; justify-content: center; padding: 80px; }

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

  :global(.group input[type="text"]),
  :global(.group input[type="url"]),
  :global(.group input[type="number"]) {
    width: 100%; padding: 8px 12px; border-radius: 6px;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
    box-sizing: border-box;
  }
  :global(.group input:focus) { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }
  :global(.group textarea) {
    width: 100%; padding: 8px 12px; border-radius: 6px; resize: vertical;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
    box-sizing: border-box;
  }
  :global(.group textarea:focus) { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .form-actions { display: flex; justify-content: flex-end; gap: 10px; }

  @media (max-width: 1019px) {
    .page { max-width: 100%; }
    .group { padding: 14px 12px; }
    .row-2 { grid-template-columns: 1fr; }
  }
</style>
