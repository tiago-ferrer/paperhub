import type { Reference } from '$lib/types/reference'

/**
 * Serializes references back to BibTeX (the inverse of `$lib/utils/bibtex.ts`'s parser).
 * Output is UTF-8 text — accented/non-Latin characters are kept as-is rather than converted
 * to LaTeX accent macros (e.g. "é" not "{\'e}"). This matches how modern reference managers
 * (Zotero, Mendeley) export by default and works out of the box with Overleaf's default
 * setup: current templates declare `\usepackage[utf8]{inputenc}`, and biblatex+biber is
 * fully Unicode-aware regardless. Only a handful of characters are genuinely dangerous
 * regardless of encoding — those are escaped below.
 */

// Characters with special meaning to LaTeX — left unescaped, any of these in a field value
// (e.g. a title containing "&" or "_") breaks compilation once the .bib is processed into
// the .bbl. Walked char-by-char (not chained regex .replace calls) so that e.g. the "{" and
// "}" introduced by escaping "\" don't get re-escaped by a later step.
const SIMPLE_ESCAPES: Record<string, string> = {
  '&': '\\&',
  '%': '\\%',
  '$': '\\$',
  '#': '\\#',
  '_': '\\_',
  '{': '\\{',
  '}': '\\}',
}

export function escapeBibTeXValue(value: string): string {
  let out = ''
  for (const ch of value) {
    if (ch === '\\') out += '\\textbackslash{}'
    else if (ch === '~') out += '\\textasciitilde{}'
    else if (ch === '^') out += '\\textasciicircum{}'
    else out += SIMPLE_ESCAPES[ch] ?? ch
  }
  return out
}

// `url`/`doi` are consumed verbatim by the packages that render them (biblatex+hyperref,
// natbib+url) — they apply their own catcode handling for "%", "#", "&", "_", etc. Escaping
// those here would inject literal backslashes into the link and break it. Only "{"/"}" are
// escaped, since those would otherwise break the field's own {...} delimiters.
function escapeVerbatimValue(value: string): string {
  return value.replace(/[{}]/g, (c) => `\\${c}`)
}

/** Strips a value to a safe, ASCII-only BibTeX key: `\cite{...}` keys are identifiers, not
 *  rendered text, so unlike field values there's no reason to keep Unicode in them — and
 *  doing so sidesteps rare active-character issues under some babel/polyglossia setups. */
export function sanitizeCitationKey(raw: string): string {
  let key = raw
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // strip diacritics (é → e)
    .replace(/[^A-Za-z0-9_:.-]/g, '')
  if (key && !/^[A-Za-z]/.test(key)) key = `ref${key}`
  return key || 'ref'
}

function firstAuthorLastName(ref: Reference): string {
  const name = ref.author?.[0] ?? ref.editor?.[0]
  if (!name) return ''
  const part = name.includes(',') ? name.split(',')[0] : name.trim().split(/\s+/).pop()
  return (part ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

function firstTitleWord(ref: Reference): string {
  const word = ref.title.trim().split(/\s+/).find(w => /[A-Za-z]/.test(w))
  return (word ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

/** citation_key if set, else `<lastname><year><titleword>` (e.g. "sweere2022deep"). */
export function generateCitationKey(ref: Reference): string {
  if (ref.citation_key) return sanitizeCitationKey(ref.citation_key)
  const base = `${firstAuthorLastName(ref)}${ref.year ?? ''}${firstTitleWord(ref)}`.toLowerCase()
  const sanitized = sanitizeCitationKey(base)
  return sanitized === 'ref' ? sanitizeCitationKey(ref.id) : sanitized
}

function nn(v: string | number | null | undefined): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s.length ? s : null
}

type FieldEntry = [name: string, value: string]

/** Maps our generic Reference shape onto the correct BibTeX field names per entry_type —
 *  e.g. `@phdthesis`/`@mastersthesis` need `school`, `@techreport` needs `institution`, and
 *  `@manual` needs `organization`, not the generic `publisher` we store them under. Using the
 *  wrong field name doesn't break compilation (unknown fields are silently ignored), but the
 *  institution/school would then just be missing from the rendered bibliography entry. */
function buildFields(ref: Reference): FieldEntry[] {
  const out: FieldEntry[] = []
  const push = (name: string, value: string | number | null | undefined, verbatim = false) => {
    const v = nn(value)
    if (v !== null) out.push([name, verbatim ? escapeVerbatimValue(v) : escapeBibTeXValue(v)])
  }
  const pushNames = (name: string, list: string[] | null | undefined) => {
    const names = (list ?? []).map(n => n.trim()).filter(Boolean)
    if (names.length) out.push([name, names.map(escapeBibTeXValue).join(' and ')])
  }

  push('title', ref.title)
  pushNames('author', ref.author)
  pushNames('editor', ref.editor)

  const t = ref.entry_type
  // Our model has one generic publisher + address pair; some entry types need that value
  // under a different field name (school/institution/organization). When both publisher
  // and address are set, the second one is preserved as a genuine `address` field instead
  // of being silently dropped.
  const orgOrAddress = ref.publisher ?? ref.address ?? null
  const remappedTypes = ['phdthesis', 'mastersthesis', 'techreport', 'manual']

  switch (t) {
    case 'article':
      push('journal', ref.journal); push('volume', ref.volume); push('number', ref.number); push('pages', ref.pages)
      break
    case 'inbook':
    case 'incollection':
    case 'inproceedings':
    case 'conference':
      push('booktitle', ref.booktitle); push('pages', ref.pages)
      push('volume', ref.volume); push('number', ref.number); push('series', ref.series)
      break
    case 'proceedings':
      push('volume', ref.volume); push('series', ref.series)
      break
    case 'phdthesis':
    case 'mastersthesis':
      push('school', orgOrAddress)
      break
    case 'techreport':
      push('institution', orgOrAddress); push('number', ref.number)
      break
    case 'manual':
      push('organization', orgOrAddress)
      break
    // 'book', 'booklet', 'unpublished', 'misc': no extra venue fields — publisher/address
    // (pushed below) already cover them.
  }

  push('year', ref.year)
  push('month', ref.month)

  if (!remappedTypes.includes(t)) {
    push('publisher', ref.publisher)
    push('address', ref.address)
  } else if (ref.publisher && ref.address) {
    push('address', ref.address) // both set — address wasn't consumed as school/institution/organization above
  }
  push('edition', ref.edition)

  push('doi', ref.doi, true)
  push('url', ref.url, true)
  push('abstract', ref.abstract)
  push('note', ref.note)
  if (ref.categories?.length) {
    const kw = ref.categories.map(c => c.trim()).filter(Boolean).join(', ')
    if (kw) push('keywords', kw)
  }

  return out
}

function referenceToBibTeX(ref: Reference, key: string): string {
  const fields = buildFields(ref)
  const body = fields.map(([name, value]) => `  ${name} = {${value}}`).join(',\n')
  return `@${ref.entry_type}{${key},\n${body}\n}`
}

/** Serializes any number of references (1 for item-level export, many for folder-level) into
 *  one .bib document — sanitized, deduplicated citation keys, UTF-8, no LaTeX accent macros. */
export function referencesToBibTeX(refs: Reference[]): string {
  const seen = new Map<string, number>()
  const entries = refs.map((ref) => {
    const base = generateCitationKey(ref)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    const key = count === 0 ? base : `${base}-${count + 1}`
    return referenceToBibTeX(ref, key)
  })
  return `${entries.join('\n\n')}\n`
}

/** Slugifies a display name into a safe, ASCII `.bib` filename. */
export function bibFilename(base: string): string {
  const slug = base
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'references'}.bib`
}
