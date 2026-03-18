/** Format a ttl_expiry (epoch seconds) as a human-readable countdown */
export function formatTtlCountdown(ttlExpiry: number | null | undefined): string {
  if (!ttlExpiry) return ''
  const diffMs = ttlExpiry * 1000 - Date.now()
  if (diffMs <= 0) return 'Being permanently deleted…'
  const diffDays = diffMs / 86_400_000
  if (diffDays > 2) return `Permanently deleted in ${Math.ceil(diffDays)} days`
  if (diffDays > 1) return 'Permanently deleted tomorrow'
  return 'Permanently deleted today'
}

/** Return a severity level for styling the countdown */
export function ttlUrgency(ttlExpiry: number | null | undefined): 'normal' | 'warning' | 'danger' | 'expired' {
  if (!ttlExpiry) return 'normal'
  const diffMs = ttlExpiry * 1000 - Date.now()
  if (diffMs <= 0) return 'expired'
  const diffDays = diffMs / 86_400_000
  if (diffDays < 1) return 'danger'
  if (diffDays <= 2) return 'warning'
  return 'normal'
}

/** True if the TTL has passed (item may still exist due to eventual consistency) */
export function isTtlExpired(ttlExpiry: number | null | undefined): boolean {
  if (!ttlExpiry) return false
  return ttlExpiry * 1000 < Date.now()
}

/** "Deleted today" / "Deleted yesterday" / "Deleted N days ago" */
export function formatDeletedAgo(deletedAt: string | null | undefined): string {
  if (!deletedAt) return ''
  const diffDays = Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86_400_000)
  if (diffDays === 0) return 'Deleted today'
  if (diffDays === 1) return 'Deleted yesterday'
  return `Deleted ${diffDays} days ago`
}
