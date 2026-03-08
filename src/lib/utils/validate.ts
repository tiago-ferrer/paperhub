export type Validator<T> = (v: T) => string | null

export const required = (label: string): Validator<string> =>
  v => v.trim() ? null : `${label} is required`

export const minLength = (n: number): Validator<string> =>
  v => v.length >= n ? null : `Minimum ${n} characters`

export const isYear: Validator<number> =
  v => v >= 1000 && v <= new Date().getFullYear() + 1 ? null : 'Invalid year'

export const isUrl: Validator<string> =
  v => !v || /^https?:\/\/.+/.test(v) ? null : 'Must be a valid URL'
