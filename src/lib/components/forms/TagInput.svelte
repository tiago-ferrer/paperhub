<script lang="ts">
  import { X } from 'lucide-svelte'

  interface Props {
    tags: string[]
    placeholder?: string
    ontags?: (tags: string[]) => void
  }
  let { tags = $bindable([]), placeholder = 'Type and press Enter…', ontags }: Props = $props()

  let input = $state('')

  function addTag() {
    const v = input.trim()
    if (v && !tags.includes(v)) {
      tags = [...tags, v]
      ontags?.(tags)
    }
    input = ''
  }

  function removeTag(tag: string) {
    tags = tags.filter(t => t !== tag)
    ontags?.(tags)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }
</script>

<div class="tag-input">
  {#each tags as tag}
    <span class="tag">
      {tag}
      <button type="button" onclick={() => removeTag(tag)} aria-label="Remove {tag}">
        <X size={12} />
      </button>
    </span>
  {/each}
  <input
    type="text"
    {placeholder}
    bind:value={input}
    onkeydown={handleKeydown}
    onblur={addTag}
    class="tag-text-input"
  />
</div>

<style>
  .tag-input {
    display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
    padding: 6px 10px; border-radius: 6px;
    border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0);
    min-height: 38px;
  }
  .tag-input:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-subtle);
  }
  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    background: var(--color-primary-subtle); color: var(--color-primary);
    padding: 2px 8px; border-radius: 12px; font-size: 13px;
  }
  .tag button {
    background: none; border: none; cursor: pointer; padding: 0;
    display: flex; align-items: center; color: inherit; opacity: 0.7;
  }
  .tag button:hover { opacity: 1; }
  .tag-text-input {
    border: none; outline: none; background: transparent;
    font-size: 14px; color: var(--color-text-primary);
    font-family: inherit; min-width: 120px; flex: 1;
  }
</style>
