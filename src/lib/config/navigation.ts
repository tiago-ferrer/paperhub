import { FileText, FolderOpen, Plug, KanbanSquare, LayoutDashboard, Mic, NotebookPen, Settings } from 'lucide-svelte'

export interface NavItem {
  label: string
  href: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  badge?: string
  ownerOnly?: boolean
  submenu?: NavItem[]
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
      { label: 'Projects', href: '/projects', icon: FolderOpen },
    ],
  },
  {
    title: 'Library',
    items: [
      { label: 'References', href: '/references', icon: FileText },
      { label: 'Notebooks', href: '/notebooks', icon: NotebookPen },
      { label: 'Transcription', href: '/transcription', icon: Mic },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
      {
        label: 'MCP',
        href: '/mcp',
        icon: Plug,
        submenu: [
          { label: 'Usage', href: '/mcp/usage', icon: Plug },
          { label: 'API Keys', href: '/mcp/keys', icon: Plug },
        ],
      },
    ],
  },
]
