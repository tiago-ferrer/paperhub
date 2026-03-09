import { marked } from 'marked'
import katex from 'katex'

export function renderMarkdown(content: string): string {
  const rendered: string[] = []

  // Replace $$...$$ (block math) before inline to avoid double-matching
  let out = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    rendered.push(katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }))
    return `\x00MATH${rendered.length - 1}\x00`
  })

  // Replace $...$ (inline math)
  out = out.replace(/\$([^\n$]+?)\$/g, (_, math) => {
    rendered.push(katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }))
    return `\x00MATH${rendered.length - 1}\x00`
  })

  // Parse markdown
  out = marked.parse(out) as string

  // Restore math renders
  out = out.replace(/\x00MATH(\d+)\x00/g, (_, i) => rendered[Number(i)])

  return out
}

export function stripMarkdown(content: string, maxLen = 200): string {
  // Simple strip for preview text
  let text = content
    .replace(/\$\$[\s\S]+?\$\$/g, '[math]')
    .replace(/\$[^\n$]+?\$/g, '[math]')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}
