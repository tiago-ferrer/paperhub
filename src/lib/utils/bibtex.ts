import type { BibTexEntryType, CreatePaperPayload } from '$lib/types/paper'

export interface ParsedBibTeX {
  entry_type: string
  citation_key: string
  fields: Record<string, string>
}

const VALID_TYPES: BibTexEntryType[] = [
  'article', 'book', 'booklet', 'conference', 'inbook', 'incollection',
  'inproceedings', 'manual', 'mastersthesis', 'misc', 'phdthesis',
  'proceedings', 'techreport', 'unpublished',
]

/** Strip LaTeX braces and basic accent commands, leaving readable text */
export function cleanLatex(raw: string): string {
  return raw
    .replace(/\{\\[`'^~"u=.cbdHvtrT]\{?([a-zA-Z])\}?\}/g, '$1') // accent commands
    .replace(/\{([^{}]*)\}/g, '$1')                               // unwrap braces
    .replace(/\\\w+\s*/g, '')                                     // strip remaining commands
    .replace(/\s+/g, ' ')
    .trim()
}

/** Split a BibTeX author/editor string on " and " */
export function splitNames(raw: string): string[] {
  return raw.split(/\s+and\s+/i).map(n => cleanLatex(n).trim()).filter(Boolean)
}

/** Extract a BibTeX field value starting at pos; handles {}, "", numbers, macros and # concat */
function extractValue(text: string, pos: number): { text: string; endPos: number } {
  const parts: string[] = []

  while (pos < text.length) {
    // skip leading whitespace between concatenated parts
    while (pos < text.length && /\s/.test(text[pos])) pos++
    if (pos >= text.length) break

    if (text[pos] === '{') {
      let depth = 0
      const start = pos + 1
      while (pos < text.length) {
        if (text[pos] === '{') depth++
        else if (text[pos] === '}') { depth--; if (depth === 0) break }
        pos++
      }
      parts.push(text.slice(start, pos))
      pos++ // skip closing }
    } else if (text[pos] === '"') {
      pos++ // skip opening "
      const start = pos
      while (pos < text.length && text[pos] !== '"') {
        if (text[pos] === '\\') pos++ // skip escaped char
        pos++
      }
      parts.push(text.slice(start, pos))
      pos++ // skip closing "
    } else if (/\d/.test(text[pos])) {
      const start = pos
      while (pos < text.length && /\d/.test(text[pos])) pos++
      parts.push(text.slice(start, pos))
    } else if (/\w/.test(text[pos])) {
      // macro name — use literal, no resolution
      const start = pos
      while (pos < text.length && /\w/.test(text[pos])) pos++
      parts.push(text.slice(start, pos))
    } else {
      break
    }

    // check for # concatenation
    while (pos < text.length && /\s/.test(text[pos])) pos++
    if (pos < text.length && text[pos] === '#') { pos++; continue }
    break
  }

  return { text: parts.join(''), endPos: pos }
}

/** Parse a BibTeX entry string into its components */
export function parseBibTeX(raw: string): ParsedBibTeX | null {
  try {
    const text = raw.trim()

    // Match @entrytype{
    const headerMatch = text.match(/^@(\w+)\s*\{/i)
    if (!headerMatch) return null

    const entry_type = headerMatch[1].toLowerCase()
    let pos = headerMatch[0].length

    // Skip whitespace
    while (pos < text.length && /\s/.test(text[pos])) pos++

    // Citation key — up to first comma
    const commaIdx = text.indexOf(',', pos)
    if (commaIdx === -1) return null

    const citation_key = text.slice(pos, commaIdx).trim()
    pos = commaIdx + 1

    const fields: Record<string, string> = {}

    while (pos < text.length) {
      while (pos < text.length && /\s/.test(text[pos])) pos++
      if (pos >= text.length) break
      if (text[pos] === '}') break   // end of entry
      if (text[pos] === ',') { pos++; continue }

      // Field name
      const nameStart = pos
      while (pos < text.length && /\w/.test(text[pos])) pos++
      if (pos === nameStart) { pos++; continue }
      const fieldName = text.slice(nameStart, pos).toLowerCase()

      // Skip whitespace + =
      while (pos < text.length && (text[pos] === ' ' || text[pos] === '\t' ||
             text[pos] === '\n' || text[pos] === '\r' || text[pos] === '=')) pos++

      const val = extractValue(text, pos)
      pos = val.endPos
      if (fieldName) fields[fieldName] = val.text.trim()

      // Skip trailing comma
      while (pos < text.length && /[\s,]/.test(text[pos])) pos++
    }

    return { entry_type, citation_key, fields }
  } catch {
    return null
  }
}

/** Map a ParsedBibTeX to a CreatePaperPayload ready for the API */
export function bibTeXToPayload(parsed: ParsedBibTeX): CreatePaperPayload {
  const f = parsed.fields

  const entry_type: BibTexEntryType = VALID_TYPES.includes(parsed.entry_type as BibTexEntryType)
    ? (parsed.entry_type as BibTexEntryType)
    : 'misc'

  return {
    entry_type,
    citation_key: parsed.citation_key || null,
    title:        cleanLatex(f.title ?? ''),
    author:       f.author    ? splitNames(f.author)           : null,
    editor:       f.editor    ? splitNames(f.editor)           : null,
    year:         f.year      ? parseInt(f.year, 10)           : null,
    month:        f.month     ? cleanLatex(f.month)            : null,
    journal:      f.journal   ? cleanLatex(f.journal)          : null,
    booktitle:    f.booktitle ? cleanLatex(f.booktitle)        : null,
    volume:       f.volume    ? f.volume.trim()                : null,
    number:       f.number    ? f.number.trim()                : null,
    pages:        f.pages     ? f.pages.replace(/--+/g, '–')  : null,
    series:       f.series    ? cleanLatex(f.series)           : null,
    publisher:    f.publisher ? cleanLatex(f.publisher)        : null,
    address:      f.address   ? cleanLatex(f.address)          : null,
    edition:      f.edition   ? cleanLatex(f.edition)          : null,
    doi:          f.doi       ? f.doi.trim()                   : null,
    url:          f.url       ? f.url.trim()                   : null,
    abstract:     f.abstract  ? cleanLatex(f.abstract)         : null,
    note:         f.note      ? cleanLatex(f.note)             : null,
    categories:   null,
    citation_count: null,
  }
}
