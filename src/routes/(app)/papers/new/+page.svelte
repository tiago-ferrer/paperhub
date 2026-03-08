<script lang="ts">
  import { goto } from '$app/navigation'
  import { papersApi } from '$lib/api/papers'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import TagInput from '$lib/components/forms/TagInput.svelte'

  let title     = $state('')
  let category  = $state('')
  let authors   = $state<string[]>([])
  let year      = $state(new Date().getFullYear())
  let journal   = $state('')
  let volume    = $state('')
  let issue     = $state('')
  let pages     = $state('')
  let doi       = $state('')
  let url       = $state('')
  let abstract  = $state('')
  let citationCount = $state(0)
  let categories = $state<string[]>([])

  let saving = $state(false)
  let errors = $state<Record<string, string>>({})

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
    errors = validate()
    if (Object.keys(errors).length) return

    saving = true
    try {
      const paper = await papersApi.create({
        title, category, authors, year, journal,
        volume, issue: issue || null, pages, doi,
        citation_count: citationCount || undefined,
        url: url || undefined,
        abstract: abstract || undefined,
        categories: categories.length ? categories : undefined,
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
    <div class="form-grid">
      <FormField label="Title" required error={errors.title}>
        <input type="text" bind:value={title} />
      </FormField>
      <FormField label="Category" required error={errors.category}>
        <input type="text" bind:value={category} placeholder="e.g. Machine Learning" />
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
        <FormField label="Volume">
          <input type="text" bind:value={volume} />
        </FormField>
        <FormField label="Issue">
          <input type="text" bind:value={issue} />
        </FormField>
      </div>
      <FormField label="Pages" required error={errors.pages}>
        <input type="text" bind:value={pages} placeholder="e.g. 123-145" />
      </FormField>
      <FormField label="DOI" required error={errors.doi}>
        <input type="text" bind:value={doi} placeholder="10.xxxx/xxxxx" />
      </FormField>
      <FormField label="URL">
        <input type="url" bind:value={url} placeholder="https://…" />
      </FormField>
      <FormField label="Citation Count">
        <input type="number" bind:value={citationCount} min="0" />
      </FormField>
      <FormField label="Categories">
        <TagInput bind:tags={categories} placeholder="Tag, press Enter…" />
      </FormField>
      <FormField label="Abstract">
        <textarea bind:value={abstract} rows={6}></textarea>
      </FormField>
    </div>
    <div class="form-actions">
      <Button variant="outlined" onclick={() => goto('/papers')}>Cancel</Button>
      <Button type="submit" loading={saving}>Create Paper</Button>
    </div>
  </form>
</div>

<style>
  .page { max-width: 720px; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 14px; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 28px; font-weight: 400; }

  .form { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 28px; }
  .form-grid { display: flex; flex-direction: column; gap: 18px; }
  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  :global(.form textarea) {
    width: 100%; padding: 8px 12px; border-radius: 6px; resize: vertical;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 14px; font-family: inherit; outline: none;
  }
  :global(.form textarea:focus) { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--color-surface-3); }
</style>
