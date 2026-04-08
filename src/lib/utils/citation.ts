import type { Reference } from '$lib/types/reference'

export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'ABNT'

// ── Name parsing ──────────────────────────────────────────────────────────────

function parseName(raw: string): { last: string; first: string } {
  const name = raw.trim()
  if (name.includes(',')) {
    const idx = name.indexOf(',')
    return { last: name.slice(0, idx).trim(), first: name.slice(idx + 1).trim() }
  }
  const parts = name.split(/\s+/)
  if (parts.length === 1) return { last: parts[0], first: '' }
  return { last: parts[parts.length - 1], first: parts.slice(0, -1).join(' ') }
}

function initials(first: string): string {
  return first.split(/\s+/).filter(Boolean).map(p => `${p[0].toUpperCase()}.`).join(' ')
}

// ── Per-style name formatters ─────────────────────────────────────────────────

// APA: "Last, F. I."
function nameApa(raw: string): string {
  const { last, first } = parseName(raw)
  return first ? `${last}, ${initials(first)}` : last
}

// MLA first author: "Last, First"
function nameMlaFirst(raw: string): string {
  const { last, first } = parseName(raw)
  return first ? `${last}, ${first}` : last
}

// Full order: "First Last" (Chicago subsequent, MLA 2+)
function nameNatural(raw: string): string {
  const { last, first } = parseName(raw)
  return first ? `${first} ${last}` : last
}

// ABNT: "LAST, First"
function nameAbnt(raw: string): string {
  const { last, first } = parseName(raw)
  return first ? `${last.toUpperCase()}, ${first}` : last.toUpperCase()
}

// ── Author-list builders ──────────────────────────────────────────────────────

function apaList(names: string[]): string {
  const f = names.map(nameApa)
  if (f.length === 1) return f[0]
  if (f.length === 2) return `${f[0]}, & ${f[1]}`
  if (f.length <= 20) return `${f.slice(0, -1).join(', ')}, & ${f[f.length - 1]}`
  return `${f.slice(0, 19).join(', ')}, . . . ${f[f.length - 1]}`
}

function mlaList(names: string[]): string {
  if (names.length === 1) return nameMlaFirst(names[0])
  if (names.length === 2) return `${nameMlaFirst(names[0])}, and ${nameNatural(names[1])}`
  if (names.length === 3) return `${nameMlaFirst(names[0])}, ${nameNatural(names[1])}, and ${nameNatural(names[2])}`
  return `${nameMlaFirst(names[0])}, et al.`
}

function chicagoList(names: string[]): string {
  if (names.length === 1) return nameNatural(names[0])
  if (names.length <= 3) {
    const mapped = names.map(nameNatural)
    return `${mapped.slice(0, -1).join(', ')}, and ${mapped[mapped.length - 1]}`
  }
  return `${nameNatural(names[0])} et al.`
}

function abntList(names: string[]): string {
  if (names.length <= 3) return names.map(nameAbnt).join('; ')
  return `${nameAbnt(names[0])} et al.`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function doiUrl(ref: Reference): string {
  if (ref.doi) return `https://doi.org/${ref.doi}`
  if (ref.url) return ref.url
  return ''
}

// Join non-empty pieces with sep; skip empty/null
function join(pieces: (string | null | undefined)[], sep = ', '): string {
  return pieces.filter(Boolean).join(sep)
}

// ── APA (7th ed.) ─────────────────────────────────────────────────────────────

function apa(ref: Reference): string {
  const authors = ref.author?.length
    ? apaList(ref.author)
    : ref.editor?.length ? `${apaList(ref.editor)} (Eds.)` : ''
  const year = ref.year ? `(${ref.year})` : '(n.d.)'
  const title = ref.title
  const doi = doiUrl(ref)
  const t = ref.entry_type

  const out: string[] = []

  if (authors) out.push(`${authors}.`)
  out.push(`${year}.`)

  if (t === 'article') {
    out.push(`${title}.`)
    const venue = join([
      ref.journal,
      ref.volume ? (ref.number ? `${ref.volume}(${ref.number})` : ref.volume) : null,
      ref.pages,
    ])
    if (venue) out.push(`${venue}.`)
    if (doi) out.push(doi)
  } else if (['book', 'booklet', 'proceedings', 'manual'].includes(t)) {
    const ed = ref.edition ? ` (${ref.edition} ed.)` : ''
    out.push(`${title}${ed}.`)
    if (ref.publisher) out.push(`${ref.publisher}.`)
    if (doi) out.push(doi)
  } else if (['inproceedings', 'conference', 'incollection', 'inbook'].includes(t)) {
    out.push(`${title}.`)
    const edNote = ref.editor?.length ? `${apaList(ref.editor)} (Eds.), ` : ''
    const pages = ref.pages ? ` (pp. ${ref.pages})` : ''
    if (ref.booktitle) out.push(`In ${edNote}${ref.booktitle}${pages}.`)
    if (ref.publisher) out.push(`${ref.publisher}.`)
    if (doi) out.push(doi)
  } else if (t === 'phdthesis' || t === 'mastersthesis') {
    const label = t === 'phdthesis' ? 'Doctoral dissertation' : "Master's thesis"
    out.push(`${title}`)
    const inst = ref.publisher || ref.address
    out.push(inst ? `[${label}, ${inst}].` : `[${label}].`)
    if (doi) out.push(doi)
  } else if (t === 'techreport') {
    out.push(`${title}`)
    out.push(ref.number ? `(Report No. ${ref.number}).` : '.')
    if (ref.publisher) out.push(`${ref.publisher}.`)
    if (doi) out.push(doi)
  } else {
    out.push(`${title}.`)
    if (ref.publisher) out.push(`${ref.publisher}.`)
    if (doi) out.push(doi)
  }

  return out.join(' ')
}

// ── MLA (9th ed.) ─────────────────────────────────────────────────────────────

function mla(ref: Reference): string {
  const authors = ref.author?.length
    ? mlaList(ref.author)
    : ref.editor?.length ? `${mlaList(ref.editor)}, editors` : ''
  const year = ref.year ? String(ref.year) : ''
  const doi = doiUrl(ref)
  const t = ref.entry_type
  const out: string[] = []

  if (authors) out.push(`${authors}.`)

  if (t === 'article') {
    out.push(`"${ref.title}."`)
    const venue = join([
      ref.journal,
      ref.volume ? `vol. ${ref.volume}` : null,
      ref.number ? `no. ${ref.number}` : null,
      year,
      ref.pages ? `pp. ${ref.pages}` : null,
    ])
    if (venue) out.push(`${venue}.`)
    if (doi) out.push(doi.startsWith('http') ? `${doi}.` : `doi:${ref.doi}.`)
  } else if (['book', 'booklet', 'proceedings', 'manual'].includes(t)) {
    out.push(`${ref.title}.`)
    const pub = join([
      ref.edition ? `${ref.edition} ed.` : null,
      ref.publisher,
      year,
    ])
    if (pub) out.push(`${pub}.`)
  } else if (['inproceedings', 'conference', 'incollection', 'inbook'].includes(t)) {
    out.push(`"${ref.title}."`)
    if (ref.booktitle) out.push(`${ref.booktitle},`)
    if (ref.editor?.length) out.push(`edited by ${mlaList(ref.editor)},`)
    const pub = join([ref.publisher, year])
    if (pub) out.push(`${pub},`)
    if (ref.pages) out.push(`pp. ${ref.pages}.`)
  } else if (t === 'phdthesis' || t === 'mastersthesis') {
    const label = t === 'phdthesis' ? 'PhD dissertation' : 'MA thesis'
    out.push(`${ref.title}.`)
    const meta = join([label, ref.publisher, year])
    if (meta) out.push(`${meta}.`)
  } else {
    out.push(`${ref.title}.`)
    const pub = join([ref.publisher, year])
    if (pub) out.push(`${pub}.`)
    if (doi) out.push(doi.startsWith('http') ? `${doi}.` : `doi:${ref.doi}.`)
  }

  return out.join(' ').replace(/,\s*\./g, '.')
}

// ── Chicago (17th ed., bibliography) ─────────────────────────────────────────

function chicago(ref: Reference): string {
  const authors = ref.author?.length
    ? chicagoList(ref.author)
    : ref.editor?.length ? `${chicagoList(ref.editor)}, eds.` : ''
  const year = ref.year ? String(ref.year) : 'n.d.'
  const doi = doiUrl(ref)
  const t = ref.entry_type
  const out: string[] = []

  if (authors) out.push(`${authors}.`)

  if (t === 'article') {
    out.push(`"${ref.title}."`)
    const vol = ref.volume ?? ''
    const num = ref.number ? `, no. ${ref.number}` : ''
    const venue = ref.journal ? `${ref.journal} ${vol}${num} (${year})` : `(${year})`
    const pages = ref.pages ? `: ${ref.pages}.` : '.'
    out.push(`${venue}${pages}`)
    if (doi) out.push(doi.startsWith('http') ? `${doi}.` : `https://doi.org/${ref.doi}.`)
  } else if (['book', 'booklet', 'proceedings', 'manual'].includes(t)) {
    const ed = ref.edition ? ` ${ref.edition} ed.` : ''
    out.push(`${ref.title}${ed}.`)
    const city = ref.address ? `${ref.address}: ` : ''
    const pub = ref.publisher ? `${city}${ref.publisher}, ${year}.` : `${year}.`
    out.push(pub)
    if (doi) out.push(doi.startsWith('http') ? `${doi}.` : `https://doi.org/${ref.doi}.`)
  } else if (['inproceedings', 'conference', 'incollection', 'inbook'].includes(t)) {
    out.push(`"${ref.title}."`)
    const edNote = ref.editor?.length ? `, edited by ${chicagoList(ref.editor)}` : ''
    if (ref.booktitle) out.push(`In ${ref.booktitle}${edNote},`)
    if (ref.pages) out.push(`${ref.pages}.`)
    const city = ref.address ? `${ref.address}: ` : ''
    const pub = ref.publisher ? `${city}${ref.publisher}, ${year}.` : `${year}.`
    out.push(pub)
    if (doi) out.push(doi)
  } else if (t === 'phdthesis' || t === 'mastersthesis') {
    const label = t === 'phdthesis' ? 'PhD diss.' : "Master's thesis"
    out.push(`"${ref.title}."`)
    const meta = join([label, ref.publisher, year])
    if (meta) out.push(`${meta}.`)
    if (doi) out.push(doi)
  } else {
    out.push(`${ref.title}.`)
    const city = ref.address ? `${ref.address}: ` : ''
    const pub = ref.publisher ? `${city}${ref.publisher}, ${year}.` : `${year}.`
    out.push(pub)
    if (doi) out.push(doi)
  }

  return out.join(' ').replace(/,\s*\./g, '.').replace(/\s{2,}/g, ' ')
}

// ── ABNT (NBR 6023) ───────────────────────────────────────────────────────────

function abnt(ref: Reference): string {
  const authors = ref.author?.length
    ? abntList(ref.author)
    : ref.editor?.length ? abntList(ref.editor) : ''
  const year = ref.year ? String(ref.year) : '[s.d.]'
  const doi = doiUrl(ref)
  const t = ref.entry_type
  const out: string[] = []

  if (authors) out.push(`${authors}.`)

  if (t === 'article') {
    out.push(`${ref.title}.`)
    const venue = join([
      ref.journal,
      ref.address,
      ref.volume ? `v. ${ref.volume}` : null,
      ref.number ? `n. ${ref.number}` : null,
      ref.pages ? `p. ${ref.pages}` : null,
      year,
    ])
    if (venue) out.push(`${venue}.`)
    if (doi) out.push(`Disponível em: ${doi}.`)
  } else if (['book', 'booklet', 'proceedings', 'manual'].includes(t)) {
    const ed = ref.edition ? ` ${ref.edition}. ed.` : ''
    out.push(`${ref.title}${ed}.`)
    const pub = join([ref.address, ref.publisher], ': ')
    out.push(pub ? `${pub}, ${year}.` : `${year}.`)
    if (doi) out.push(`Disponível em: ${doi}.`)
  } else if (['inproceedings', 'conference'].includes(t)) {
    out.push(`${ref.title}.`)
    if (ref.booktitle) out.push(`In: ${ref.booktitle.toUpperCase()}, ${year}.`)
    const pub = join([ref.address, ref.publisher], ': ')
    if (pub) out.push(`${pub}.`)
    if (ref.pages) out.push(`p. ${ref.pages}.`)
    if (doi) out.push(`Disponível em: ${doi}.`)
  } else if (t === 'phdthesis' || t === 'mastersthesis') {
    const label = t === 'phdthesis' ? 'Tese (Doutorado)' : 'Dissertação (Mestrado)'
    out.push(`${ref.title}.`)
    const meta = join([year, label, ref.publisher, ref.address], '. ')
    if (meta) out.push(`${meta}.`)
    if (doi) out.push(`Disponível em: ${doi}.`)
  } else if (t === 'techreport') {
    out.push(`${ref.title}.`)
    if (ref.number) out.push(`Relatório Técnico n. ${ref.number}.`)
    const pub = join([ref.address, ref.publisher], ': ')
    out.push(pub ? `${pub}, ${year}.` : `${year}.`)
    if (doi) out.push(`Disponível em: ${doi}.`)
  } else {
    out.push(`${ref.title}.`)
    const pub = join([ref.address, ref.publisher], ': ')
    out.push(pub ? `${pub}, ${year}.` : `${year}.`)
    if (doi) out.push(`Disponível em: ${doi}.`)
  }

  return out.join(' ').replace(/,\s*\./g, '.').replace(/\s{2,}/g, ' ')
}

// ── Public API ────────────────────────────────────────────────────────────────

export function formatCitation(ref: Reference, style: CitationStyle): string {
  switch (style) {
    case 'APA':     return apa(ref)
    case 'MLA':     return mla(ref)
    case 'Chicago': return chicago(ref)
    case 'ABNT':    return abnt(ref)
  }
}
