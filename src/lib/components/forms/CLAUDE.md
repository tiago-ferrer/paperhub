# Form Components

Input components and wrappers for building forms.

## Components

### `FormField.svelte`
Wrapper that adds a label, optional description, and error message below any input. Props: `label`, `error?`, `description?`, `required?`, `children` snippet.

### `SearchBox.svelte`
Debounced search input. Props: `value: string`, `onSearch: (q: string) => void`, `placeholder?`, `debounceMs?` (default 300). Emits the search callback after the debounce delay.

### `Select.svelte`
Styled `<select>` element. Props: `value`, `options: { label, value }[]`, `placeholder?`, `disabled?`.

### `TagInput.svelte`
Comma/Enter-separated tag input. Props: `tags: string[]`, `onTagsChange: (tags: string[]) => void`, `placeholder?`.

### `FileUpload.svelte`
Drag-and-drop + click file picker. Props: `onFile: (file: File) => void`, `accept?`, `label?`. Does not upload itself — calls `onFile` and the parent handles the API call.

### `LanguageSelector.svelte`
Dropdown for selecting a spoken language (used in transcription recording creation). Props: `value: string`, `onChange: (lang: string) => void`.

## Convention

- All form components are **uncontrolled** in the sense that the parent owns state
- Validation errors are passed in as `error?: string` — components never validate themselves
- Use `FormField` to wrap native inputs consistently:

```svelte
<FormField label="Title" error={errors.title} required>
  <input bind:value={title} class="input" />
</FormField>
```
