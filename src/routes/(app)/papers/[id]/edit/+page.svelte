<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'
  import { papersApi } from '$lib/api/papers'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { buildPatch } from '$lib/utils/diff'
  import FormField from '$lib/components/forms/FormField.svelte'
  import TagInput from '$lib/components/forms/TagInput.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import type { Paper } from '$lib/types/paper'
  import { onMount } from 'svelte'

  const id = $page.params.id as string

  let original = $state<Paper | null>(null)
  let loading  = $state(true)
  let saving   = $state(false)
  let errors   = $state<Record<string, string>>({})

  let title     = $state('')
  let category  = $state('')
  let authors   = $state<string[]>([])
  let year      = $state(2024)
  let journal   = $state('')
  let volume    = $state('')
  let issue     = $state('')
  let pages     = $state('')
  let doi       = $state('')
  let url       = $state('')
  let abstract  = $state('')
  let citationCount = $state(0)
  let categories = $state<string[]>([])

  onMount(async () => {
    try {
      const paper = await papersApi.get(id)
      original = paper
      title    = paper.title
      category = paper.category
      authors  = [...paper.authors]
      year     = paper.year
      journal  = paper.journal
      volume   = paper.volume ?? ''
      issue    = paper.issue ?? ''
      pages    = paper.pages
      doi      = paper.doi
      url      = paper.url ?? ''
      abstract = paper.abstract ?? ''
      citationCount = paper.citation_count ?? 0
      categories = [...(paper.categories ?? [])]
    } catch {
      toast.error('Failed to load paper')
      goto('/papers')
    } finally {
      loading = false
    }
  })

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim())    e.title    = 'Title is required'
    if (!category.trim()) e.category = 'Category is required'
    if (!journal.trim())  e.journal  = 'Journal is required'
    if (!pages.trim())    e.pages    = 'Pages are required'
    if (!doi.trim())      e.doi      = 'DOI is required'
    if (!authors.length)  e.authors  = 'At least one author is required'
    if (year < 1000 || year > new Date().getFullYear() + 1) e.year = 'Invalid year'
    return e
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    if (!original) return
    errors = validate()
    if (Object.keys(errors).length) return

    const current = { title, category, authors, year, journal, volume, issue: issue || null, pages, doi, url, abstract, citation_count: citationCount, categories }
    const patch = buildPatch(original, current as Partial<Paper>)

    if (!Object.keys(patch).length) {
      toast.info('No changes to save')
      return
    }

    saving = true
    try {
      await papersApi.patch(id, patch)
      toast.success('Paper updated')
      await invalidateAll()
      goto(`/papers/${id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update')
    } finally {
      saving = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/papers/{id}" class="back-link">← Paper</a>
    <h1>Edit Paper</h1>
  </div>

  {#if loading}
    <div class="loading"><Spinner size={41} /></div>
  {:else}
    <form onsubmit={submit} class="form">
      <div class="form-grid">
        <FormField label="Title" required error={errors.title}>
          <input type="text" bind:value={title} />
        </FormField>
        <FormField label="Category" required error={errors.category}>
          <input type="text" bind:value={category} />
        </FormField>
        <FormField label="Authors" required error={errors.authors}>
          <TagInput bind:tags={authors} placeholder="Name, press Enter…" />
        </FormField>
        <FormField label="Year" required error={errors.year}>
          <input type="number" bind:value={year} min="1000" max={new Date().getFullYear() + 1} />
        </FormField>
        <FormField label="Journal" required error={errors.journal}>
          <input type="text" bind:value={journal} />
        </FormField>
        <div class="row-2">
          <FormField label="Volume"><input type="text" bind:value={volume} /></FormField>
          <FormField label="Issue"><input type="text" bind:value={issue} /></FormField>
        </div>
        <FormField label="Pages" required error={errors.pages}>
          <input type="text" bind:value={pages} />
        </FormField>
        <FormField label="DOI" required error={errors.doi}>
          <input type="text" bind:value={doi} />
        </FormField>
        <FormField label="URL"><input type="url" bind:value={url} /></FormField>
        <FormField label="Citation Count"><input type="number" bind:value={citationCount} min="0" /></FormField>
        <FormField label="Categories">
          <TagInput bind:tags={categories} placeholder="Tag, press Enter…" />
        </FormField>
        <FormField label="Abstract">
          <textarea bind:value={abstract} rows={6}></textarea>
        </FormField>
      </div>
    </form>
  {/if}
</div>

<style>
  .page { max-width: 100%; overflow-x: hidden; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .loading { display: flex; justify-content: center; padding: 80px; }

  .form { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 28px; width: 100%; box-sizing: border-box; }
  .form-grid { display: flex; flex-direction: column; gap: 18px; }
  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .form { padding: 16px 14px; border-radius: 8px; }
    .row-2 { grid-template-columns: 1fr; }
  }

  :global(.form textarea) {
    width: 100%; padding: 8px 12px; border-radius: 6px; resize: vertical;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
  }
  :global(.form textarea:focus) { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

</style>
