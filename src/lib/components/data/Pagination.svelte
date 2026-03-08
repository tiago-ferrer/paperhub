<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte'
  import { ChevronLeft, ChevronRight } from 'lucide-svelte'

  interface Props {
    page: number
    hasNext: boolean
    nextToken?: string
    onprev?: () => void
    onnext?: () => void
  }
  let { page, hasNext, onprev, onnext }: Props = $props()
</script>

<div class="pagination">
  <Button variant="outlined" size="sm" disabled={page === 0} onclick={onprev}>
    <ChevronLeft size={16} /> Previous
  </Button>
  <span class="page-info">Page {page + 1}</span>
  <Button variant="outlined" size="sm" disabled={!hasNext} onclick={onnext}>
    Next <ChevronRight size={16} />
  </Button>
</div>

<style>
  .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px 0; }
  .page-info { font-size: 13px; color: var(--color-text-secondary); }
</style>
