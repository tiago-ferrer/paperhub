<script lang="ts">
  import { Search } from 'lucide-svelte'

  interface Props {
    placeholder?: string
    value?: string
    onchange?: (value: string) => void
  }
  let { placeholder = 'Search…', value = $bindable(''), onchange }: Props = $props()

  let timer: ReturnType<typeof setTimeout>
  function handleInput(e: Event) {
    value = (e.target as HTMLInputElement).value
    clearTimeout(timer)
    timer = setTimeout(() => onchange?.(value), 300)
  }
</script>

<div class="search-box">
  <Search size={20} />
  <input
    type="search"
    {placeholder}
    {value}
    oninput={handleInput}
    class="search-input"
  />
</div>

<style>
  .search-box {
    display: flex; align-items: center; gap: 8px;
    background: var(--color-surface-1); border: 1px solid var(--color-surface-3);
    border-radius: 24px; padding: 6px 14px;
    color: var(--color-text-secondary);
  }
  .search-input {
    border: none; background: transparent; outline: none;
    font-size: 0.875rem; color: var(--color-text-primary);
    width: 200px;
  }
  @media (max-width: 767px) {
    .search-input { width: 90px; }
  }
  .search-input::placeholder { color: var(--color-text-disabled); }
  .search-input::-webkit-search-cancel-button { cursor: pointer; }
</style>
