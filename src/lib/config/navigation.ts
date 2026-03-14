import { FileText, Key, KanbanSquare, LayoutDashboard, Mic, NotebookPen, Settings } from 'lucide-svelte'

export interface NavItem {
  label: string
  href: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  badge?: string
  ownerOnly?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Kanban', href: '/kanban', icon: KanbanSquare },
    ],
  },
  {
    title: 'Library',
    items: [

      { label: 'Papers', href: '/papers', icon: FileText },
      { label: 'Notebooks', href: '/notebooks', icon: NotebookPen },
      { label: 'Transcription', href: '/transcription', icon: Mic },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'MCP API Keys', href: '/api-keys', icon: Key },
    ],
  },
]
