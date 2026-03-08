<script lang="ts">
  interface Option { value: string; label: string }
  interface Props {
    options: Option[]
    value?: string
    placeholder?: string
    onchange?: (value: string) => void
  }
  let { options, value = $bindable(''), placeholder, onchange }: Props = $props()
</script>

<select
  bind:value
  onchange={() => onchange?.(value)}
>
  {#if placeholder}
    <option value="" disabled>{placeholder}</option>
  {/if}
  {#each options as opt}
    <option value={opt.value}>{opt.label}</option>
  {/each}
</select>
