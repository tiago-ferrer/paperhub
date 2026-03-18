<script lang="ts">
  import type { PageData } from './$types'
  import { goto } from '$app/navigation'
  import { ganttApi } from '$lib/api/gantt'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { GanttTask } from '$lib/types/gantt'
  import Button from '$lib/components/ui/Button.svelte'
  import SlideOver from '$lib/components/dialogs/SlideOver.svelte'
  import Modal from '$lib/components/dialogs/Modal.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import AddToProjectModal from '$lib/components/projects/AddToProjectModal.svelte'
  import {
    Plus, Pencil, Trash2, GripVertical, Check, X,
    GanttChart as GanttIcon, Calendar, FolderOpen
  } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  // Scroll container — bound in template, used to center on today
  let scrollEl = $state<HTMLElement | null>(null)
  let showAddToProject = $state(false)

  // ── Constants ────────────────────────────────────────────────────────────────
  const LABEL_W   = 220
  const ROW_H     = 44
  const HEADER_H  = 40
  const DEFAULT_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#FF6D00', '#46BDC6', '#7B61FF', '#F06292']

  // ── State ────────────────────────────────────────────────────────────────────
  let chart = $state({ ...data.chart })
  let tasks = $state<GanttTask[]>(data.tasks.filter(t => !t.deleted))

  // Zoom
  let zoom = $state<'day' | 'week' | 'month' | 'year'>('week')
  const pxPerDay = $derived(zoom === 'day' ? 40 : zoom === 'week' ? 20 : zoom === 'month' ? 8 : 3)

  // Chart title editing
  let editingTitle = $state(false)
  let titleInput   = $state(chart.title)
  let savingTitle  = $state(false)

  // Task edit slide-over
  let editTask      = $state<GanttTask | null>(null)
  let editForm      = $state({ title: '', description: '', start_date: '', end_date: '', progress: 0, color: '', depends_on: [] as string[], labels: [] as string[], labelInput: '' })
  let savingEdit    = $state(false)
  let editErrors    = $state<Record<string, string>>({})

  // Add task modal
  let addOpen     = $state(false)
  let addForm     = $state({ title: '', description: '', start_date: '', end_date: '', progress: 0, color: '', labels: [] as string[], depends_on: [] as string[], labelInput: '' })
  let adding      = $state(false)
  let addErrors   = $state<Record<string, string>>({})

  // Delete task
  let deleteTarget = $state<GanttTask | null>(null)
  let deleting     = $state(false)

  // Drag/resize bars (mouse events)
  let dragState = $state<{
    type: 'move' | 'resize-left' | 'resize-right'
    taskId: string
    startClientX: number
    origStart: string
    origEnd: string
  } | null>(null)

  // Row reorder (HTML5 DnD)
  let rowDragId    = $state<string | null>(null)
  let rowDragOver  = $state<string | null>(null)

  // Tooltip
  let tooltip = $state<{ task: GanttTask; x: number; y: number } | null>(null)

  // ── Date helpers ─────────────────────────────────────────────────────────────
  function gParse(s: string): Date {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  function gFormat(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  function gAdd(d: Date, n: number): Date {
    const r = new Date(d); r.setDate(r.getDate() + n); return r
  }
  function gDiff(from: Date, to: Date): number {
    return Math.round((to.getTime() - from.getTime()) / 86400000)
  }
  function gDisplayDate(s: string): string {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const d = gParse(s)
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }

  // ── Timeline bounds ──────────────────────────────────────────────────────────
  const timelineBounds = $derived.by(() => {
    const active = sortedTasks
    if (active.length === 0) {
      const today = new Date()
      return { start: gFormat(gAdd(today, -14)), end: gFormat(gAdd(today, 60)) }
    }
    const minDate = active.reduce((a, t) => {
      const d = gParse(t.start_date); return d < a ? d : a
    }, gParse(active[0].start_date))
    const maxDate = active.reduce((a, t) => {
      const d = gParse(t.end_date); return d > a ? d : a
    }, gParse(active[0].end_date))
    return { start: gFormat(gAdd(minDate, -7)), end: gFormat(gAdd(maxDate, 7)) }
  })

  const totalDays  = $derived(gDiff(gParse(timelineBounds.start), gParse(timelineBounds.end)) + 1)
  const totalWidth = $derived(totalDays * pxPerDay)

  const sortedTasks = $derived([...tasks].sort((a, b) => a.position - b.position))

  // ── Timeline header units ────────────────────────────────────────────────────
  const timeUnits = $derived.by((): { label: string; x: number; width: number; isToday?: boolean }[] => {
    const start = gParse(timelineBounds.start)
    const end   = gParse(timelineBounds.end)
    const dayNames   = ['Su','Mo','Tu','We','Th','Fr','Sa']
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const units: { label: string; x: number; width: number; isToday?: boolean }[] = []

    if (zoom === 'day') {
      let d = new Date(start)
      while (d <= end) {
        const x = gDiff(start, d) * pxPerDay
        units.push({ label: `${dayNames[d.getDay()]} ${d.getDate()}`, x, width: pxPerDay })
        d = gAdd(d, 1)
      }
    } else if (zoom === 'week') {
      // Align to nearest Monday before start
      let d = new Date(start)
      while (d.getDay() !== 1) d = gAdd(d, -1)
      while (d <= end) {
        const x = gDiff(start, d) * pxPerDay
        units.push({ label: `${monthNames[d.getMonth()]} ${d.getDate()}`, x, width: 7 * pxPerDay })
        d = gAdd(d, 7)
      }
    } else if (zoom === 'month') {
      let y = start.getFullYear(), m = start.getMonth()
      const fullMonthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
      while (true) {
        const ms = new Date(y, m, 1)
        const me = new Date(y, m + 1, 0)
        if (ms > end) break
        const x    = Math.max(0, gDiff(start, ms)) * pxPerDay
        const endX = (gDiff(start, me) + 1) * pxPerDay
        units.push({ label: `${fullMonthNames[m]} ${y}`, x, width: endX - x })
        m++; if (m > 11) { m = 0; y++ }
        if (y > end.getFullYear() + 2) break
      }
    } else {
      // Year view — one column per year, subdivided by quarter markers
      let y = start.getFullYear()
      while (y <= end.getFullYear()) {
        const ys   = new Date(y, 0, 1)
        const ye   = new Date(y, 11, 31)
        const x    = Math.max(0, gDiff(start, ys)) * pxPerDay
        const endX = (gDiff(start, ye) + 1) * pxPerDay
        units.push({ label: String(y), x, width: endX - x })
        y++
        if (y > end.getFullYear() + 1) break
      }
    }
    return units
  })

  // Today marker
  const todayX = $derived.by(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    const start = gParse(timelineBounds.start)
    const end   = gParse(timelineBounds.end)
    if (today < start || today > end) return null
    return gDiff(start, today) * pxPerDay
  })

  // Scroll to center today's line whenever the container mounts or zoom changes
  $effect(() => {
    const x = todayX
    const el = scrollEl
    if (x === null || !el) return
    // After paint so the inner width is already applied
    requestAnimationFrame(() => {
      el.scrollLeft = LABEL_W + x - el.clientWidth / 2
    })
  })

  // ── Bar geometry ─────────────────────────────────────────────────────────────
  function barLeft(task: GanttTask): number {
    return gDiff(gParse(timelineBounds.start), gParse(task.start_date)) * pxPerDay
  }
  function barW(task: GanttTask): number {
    return (gDiff(gParse(task.start_date), gParse(task.end_date)) + 1) * pxPerDay
  }
  function taskColor(task: GanttTask, idx: number): string {
    return task.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
  }
  function labelColor(label: string): string {
    const palette = ['#e57373','#81c784','#64b5f6','#ffb74d','#ba68c8','#4db6ac','#f06292','#aed581']
    let h = 0
    for (let i = 0; i < label.length; i++) h = (Math.imul(31, h) + label.charCodeAt(i)) | 0
    return palette[Math.abs(h) % palette.length]
  }

  // ── Dependency arrow paths ───────────────────────────────────────────────────
  const arrowPaths = $derived.by(() => {
    const paths: { d: string; key: string }[] = []
    const idxMap = new Map(sortedTasks.map((t, i) => [t.id, i]))
    for (const task of sortedTasks) {
      for (const depId of task.depends_on) {
        const dep = sortedTasks.find(t => t.id === depId)
        if (!dep) continue
        const fi = idxMap.get(depId), ti = idxMap.get(task.id)
        if (fi === undefined || ti === undefined) continue
        const x1 = LABEL_W + barLeft(dep) + barW(dep)
        const y1 = fi * ROW_H + ROW_H / 2
        const x2 = LABEL_W + barLeft(task)
        const y2 = ti * ROW_H + ROW_H / 2
        const dx = Math.max(Math.abs(x2 - x1) / 2, 30)
        paths.push({ d: `M ${x1},${y1} C ${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`, key: `${depId}->${task.id}` })
      }
    }
    return paths
  })

  // ── Bar drag (mouse events) ──────────────────────────────────────────────────
  function onBarMouseDown(e: MouseEvent, task: GanttTask, type: 'move' | 'resize-left' | 'resize-right') {
    e.preventDefault()
    e.stopPropagation()
    dragState = { type, taskId: task.id, startClientX: e.clientX, origStart: task.start_date, origEnd: task.end_date }
    tooltip = null
  }

  $effect(() => {
    function onMove(e: MouseEvent) {
      if (!dragState) return
      const delta = Math.round((e.clientX - dragState.startClientX) / pxPerDay)
      const idx = tasks.findIndex(t => t.id === dragState!.taskId)
      if (idx < 0) return
      const t = tasks[idx]
      if (dragState.type === 'move') {
        tasks[idx] = { ...t, start_date: gFormat(gAdd(gParse(dragState.origStart), delta)), end_date: gFormat(gAdd(gParse(dragState.origEnd), delta)) }
      } else if (dragState.type === 'resize-right') {
        const newEnd = gAdd(gParse(dragState.origEnd), delta)
        if (newEnd >= gParse(t.start_date)) tasks[idx] = { ...t, end_date: gFormat(newEnd) }
      } else {
        const newStart = gAdd(gParse(dragState.origStart), delta)
        if (newStart <= gParse(t.end_date)) tasks[idx] = { ...t, start_date: gFormat(newStart) }
      }
    }
    async function onUp() {
      if (!dragState) return
      const ds = dragState
      dragState = null
      const task = tasks.find(t => t.id === ds.taskId)
      if (!task || (task.start_date === ds.origStart && task.end_date === ds.origEnd)) return
      const idx = tasks.findIndex(t => t.id === ds.taskId)
      try {
        const updated = await ganttApi.patchTask(chart.id, ds.taskId, { start_date: task.start_date, end_date: task.end_date })
        if (idx >= 0) tasks[idx] = updated
      } catch {
        if (idx >= 0) tasks[idx] = { ...tasks[idx], start_date: ds.origStart, end_date: ds.origEnd }
        toast.error('Failed to update task dates')
      }
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  })

  // ── Row reorder (HTML5 DnD) ──────────────────────────────────────────────────
  function onRowDragStart(e: DragEvent, taskId: string) {
    rowDragId = taskId
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', taskId) }
  }
  function onRowDragOver(e: DragEvent, taskId: string) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    rowDragOver = taskId
  }
  async function onRowDrop(e: DragEvent, targetId: string) {
    e.preventDefault()
    if (!rowDragId || rowDragId === targetId) { rowDragId = null; rowDragOver = null; return }
    const fromIdx = sortedTasks.findIndex(t => t.id === rowDragId)
    const toIdx   = sortedTasks.findIndex(t => t.id === targetId)
    if (fromIdx < 0 || toIdx < 0) { rowDragId = null; rowDragOver = null; return }

    const reordered = [...sortedTasks]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    const updates = reordered.flatMap((t, i) => t.position !== i ? [{ id: t.id, pos: i }] : [])
    const savedPos = new Map(tasks.map(t => [t.id, t.position]))

    tasks = tasks.map(t => { const u = updates.find(x => x.id === t.id); return u ? { ...t, position: u.pos } : t })
    rowDragId = null; rowDragOver = null

    try {
      await Promise.all(updates.map(u => ganttApi.patchTask(chart.id, u.id, { position: u.pos })))
    } catch {
      tasks = tasks.map(t => { const p = savedPos.get(t.id); return p !== undefined ? { ...t, position: p } : t })
      toast.error('Failed to reorder tasks')
    }
  }

  // ── Chart title save ─────────────────────────────────────────────────────────
  async function saveTitle() {
    if (!titleInput.trim() || titleInput === chart.title) { editingTitle = false; return }
    savingTitle = true
    try {
      const updated = await ganttApi.patchChart(chart.id, { title: titleInput })
      chart = updated
      editingTitle = false
    } catch {
      toast.error('Failed to update title')
    } finally {
      savingTitle = false }
  }

  // ── Task edit ────────────────────────────────────────────────────────────────
  function openEdit(task: GanttTask) {
    editTask  = task
    editForm  = { title: task.title, description: task.description ?? '', start_date: task.start_date, end_date: task.end_date, progress: task.progress, color: task.color ?? DEFAULT_COLORS[0], depends_on: [...task.depends_on], labels: [...task.labels], labelInput: '' }
    editErrors = {}
  }

  async function handleEditSubmit(e: Event) {
    e.preventDefault()
    if (!editTask) return
    savingEdit = true; editErrors = {}
    try {
      const updated = await ganttApi.patchTask(chart.id, editTask.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        progress: editForm.progress,
        color: editForm.color,
        depends_on: editForm.depends_on,
        labels: editForm.labels,
      })
      const idx = tasks.findIndex(t => t.id === editTask!.id)
      if (idx >= 0) tasks[idx] = updated
      editTask = null
      toast.success('Task updated')
    } catch (e) {
      if (e instanceof ApiError) { if (e.fields) editErrors = e.fields; else toast.error(e.message) }
      else toast.error('Something went wrong, please try again')
    } finally {
      savingEdit = false
    }
  }

  // ── Add task ─────────────────────────────────────────────────────────────────
  function openAdd() {
    const today = new Date()
    addForm = { title: '', description: '', start_date: gFormat(today), end_date: gFormat(gAdd(today, 14)), progress: 0, color: DEFAULT_COLORS[tasks.length % DEFAULT_COLORS.length], labels: [], depends_on: [], labelInput: '' }
    addErrors = {}
    addOpen = true
  }

  async function handleAddSubmit(e: Event) {
    e.preventDefault()
    adding = true; addErrors = {}
    try {
      const created = await ganttApi.createTask(chart.id, {
        title: addForm.title,
        description: addForm.description || undefined,
        start_date: addForm.start_date,
        end_date: addForm.end_date,
        progress: addForm.progress,
        color: addForm.color,
        depends_on: addForm.depends_on,
        labels: addForm.labels,
        position: tasks.length,
      })
      tasks = [...tasks, created]
      addOpen = false
      toast.success('Task added')
    } catch (e) {
      if (e instanceof ApiError) { if (e.fields) addErrors = e.fields; else toast.error(e.message) }
      else toast.error('Something went wrong, please try again')
    } finally {
      adding = false
    }
  }

  // ── Delete task ──────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return
    deleting = true
    try {
      await ganttApi.removeTask(chart.id, deleteTarget.id)
      tasks = tasks.filter(t => t.id !== deleteTarget!.id)
      toast.success('Task deleted')
      deleteTarget = null
    } catch {
      toast.error('Something went wrong, please try again')
    } finally {
      deleting = false
    }
  }

  // ── Label helpers ─────────────────────────────────────────────────────────────
  function addLabel(form: typeof editForm | typeof addForm) {
    const l = form.labelInput.trim()
    if (l && !form.labels.includes(l)) form.labels = [...form.labels, l]
    form.labelInput = ''
  }
  function removeLabel(form: typeof editForm | typeof addForm, label: string) {
    form.labels = form.labels.filter(l => l !== label)
  }
</script>

<!-- Page layout -->
<div class="gantt-page" role="presentation" onmouseleave={() => { if (!dragState) tooltip = null }}>

  <!-- Header -->
  <div class="gantt-header">
    <div class="gantt-header-left">
      <a href="/gantt" class="back-link">← Charts</a>
      <div class="title-row">
        {#if editingTitle}
          <input bind:value={titleInput} class="title-input" onkeydown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { editingTitle = false; titleInput = chart.title } }} />
          <button class="icon-btn" onclick={saveTitle} disabled={savingTitle}><Check size={16} /></button>
          <button class="icon-btn" onclick={() => { editingTitle = false; titleInput = chart.title }}><X size={16} /></button>
        {:else}
          <h1 class="chart-title">{chart.title}</h1>
          <button class="icon-btn" onclick={() => { editingTitle = true; titleInput = chart.title }} title="Edit title"><Pencil size={15} /></button>
        {/if}
      </div>
      {#if chart.description}<span class="chart-desc">{chart.description}</span>{/if}
    </div>
    <div class="gantt-header-right">
      <!-- Zoom controls -->
      <div class="zoom-controls">
        {#each (['day', 'week', 'month', 'year'] as const) as z}
          <button class="zoom-btn" class:active={zoom === z} onclick={() => zoom = z}>{z.charAt(0).toUpperCase() + z.slice(1)}</button>
        {/each}
      </div>
      <Button variant="outlined" size="sm" onclick={() => showAddToProject = true}>
        <FolderOpen size={16} /><span class="btn-label"> Add to Project</span>
      </Button>
      <Button onclick={openAdd}>
        <Plus size={16} />
        Add Task
      </Button>
    </div>
  </div>

  <!-- Gantt body -->
  <div class="gantt-wrapper">
    {#if sortedTasks.length === 0}
      <div class="gantt-empty">
        <Calendar size={40} />
        <p>No tasks yet — add your first task to start planning.</p>
        <Button onclick={openAdd}><Plus size={16} /> Add Task</Button>
      </div>
    {:else}
      <div class="gantt-scroll" bind:this={scrollEl}>
        <div class="gantt-inner" style:min-width="{LABEL_W + totalWidth}px">

          <!-- Header row -->
          <div class="gantt-header-row" style:height="{HEADER_H}px">
            <div class="label-col-header" style:width="{LABEL_W}px" style:min-width="{LABEL_W}px">
              <GanttIcon size={14} />
              Tasks
            </div>
            <div class="timeline-col-header" style:width="{totalWidth}px" style:min-width="{totalWidth}px">
              {#each timeUnits as unit}
                <div class="time-unit" style:left="{unit.x}px" style:width="{unit.width}px">{unit.label}</div>
              {/each}
              {#if todayX !== null}
                <div class="today-line" style:left="{todayX}px"></div>
              {/if}
            </div>
          </div>

          <!-- Rows + SVG overlay container -->
          <div class="gantt-rows" style:position="relative">

            {#each sortedTasks as task, idx (task.id)}
              <div
                class="gantt-row"
                class:drag-over={rowDragOver === task.id}
                ondragover={(e) => onRowDragOver(e, task.id)}
                ondrop={(e) => onRowDrop(e, task.id)}
                ondragleave={() => { if (rowDragOver === task.id) rowDragOver = null }}
              >
                <!-- Label cell -->
                <div
                  class="label-cell"
                  style:width="{LABEL_W}px"
                  style:min-width="{LABEL_W}px"
                  onclick={() => openEdit(task)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => e.key === 'Enter' && openEdit(task)}
                >
                  <!-- Drag handle -->
                  <div
                    class="drag-handle"
                    draggable="true"
                    ondragstart={(e) => { e.stopPropagation(); onRowDragStart(e, task.id) }}
                    ondragend={() => { rowDragId = null; rowDragOver = null }}
                    onclick={(e) => e.stopPropagation()}
                    role="button"
                    tabindex="-1"
                  >
                    <GripVertical size={14} />
                  </div>
                  <div class="label-text">
                    <span class="label-title">{task.title}</span>
                    {#if task.labels.length > 0}
                      <div class="label-tags">
                        {#each task.labels.slice(0, 2) as lbl}
                          <span class="label-tag" style:background="{labelColor(lbl)}22" style:color="{labelColor(lbl)}">{lbl}</span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  <span class="progress-badge">{task.progress}%</span>
                  <button
                    class="row-delete-btn"
                    onclick={(e) => { e.stopPropagation(); deleteTarget = task }}
                    title="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <!-- Bar area -->
                <div class="bar-area" style:width="{totalWidth}px" style:min-width="{totalWidth}px" style:height="{ROW_H}px">
                  <!-- Today marker in row -->
                  {#if todayX !== null}
                    <div class="row-today-line" style:left="{todayX}px"></div>
                  {/if}

                  <!-- Task bar -->
                  <div
                    class="task-bar"
                    class:dragging={dragState?.taskId === task.id}
                    style:left="{barLeft(task)}px"
                    style:width="{Math.max(barW(task), 4)}px"
                    style:background="{taskColor(task, idx)}"
                    style:height="{ROW_H - 12}px"
                    style:top="6px"
                    onmousedown={(e) => { if ((e.target as HTMLElement).classList.contains('handle')) return; onBarMouseDown(e, task, 'move') }}
                    onmouseenter={(e) => { if (!dragState) tooltip = { task, x: e.clientX, y: e.clientY } }}
                    onmousemove={(e) => { if (!dragState && tooltip?.task.id === task.id) tooltip = { task, x: e.clientX, y: e.clientY } }}
                    onmouseleave={() => { if (!dragState) tooltip = null }}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === 'Enter' && openEdit(task)}
                    aria-label={task.title}
                  >
                    <!-- Progress fill -->
                    <div class="progress-fill" style:width="{task.progress}%"></div>

                    <!-- Left resize handle -->
                    <div
                      class="handle handle-left"
                      onmousedown={(e) => { e.stopPropagation(); onBarMouseDown(e, task, 'resize-left') }}
                      role="presentation"
                    ></div>

                    <!-- Right resize handle -->
                    <div
                      class="handle handle-right"
                      onmousedown={(e) => { e.stopPropagation(); onBarMouseDown(e, task, 'resize-right') }}
                      role="presentation"
                    ></div>
                  </div>
                </div>
              </div>
            {/each}

            <!-- Dependency arrows SVG -->
            {#if arrowPaths.length > 0}
              <svg
                class="dep-svg"
                style:width="{LABEL_W + totalWidth}px"
                style:height="{sortedTasks.length * ROW_H}px"
                aria-hidden="true"
              >
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="currentColor" opacity="0.5" />
                  </marker>
                </defs>
                {#each arrowPaths as { d, key } (key)}
                  <path {d} fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5" marker-end="url(#arrowhead)" />
                {/each}
              </svg>
            {/if}

          </div><!-- /gantt-rows -->
        </div><!-- /gantt-inner -->
      </div><!-- /gantt-scroll -->
    {/if}
  </div><!-- /gantt-wrapper -->
</div>

<!-- Tooltip -->
{#if tooltip && !dragState}
  <div
    class="tooltip"
    style:left="{tooltip.x + 12}px"
    style:top="{tooltip.y + 12}px"
  >
    <div class="tooltip-title">{tooltip.task.title}</div>
    <div class="tooltip-row"><span>Start:</span> {gDisplayDate(tooltip.task.start_date)}</div>
    <div class="tooltip-row"><span>End:</span> {gDisplayDate(tooltip.task.end_date)}</div>
    <div class="tooltip-row"><span>Progress:</span> {tooltip.task.progress}%</div>
    {#if tooltip.task.labels.length > 0}
      <div class="tooltip-labels">
        {#each tooltip.task.labels as l}
          <span class="tooltip-label">{l}</span>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<!-- Task Edit SlideOver -->
<SlideOver open={!!editTask} title="Edit Task" onclose={() => editTask = null} width="500px">
  {#if editTask}
    <form onsubmit={handleEditSubmit} class="task-form">
      <div class="form-group">
        <label for="et-title">Title *</label>
        <input id="et-title" bind:value={editForm.title} required />
        {#if editErrors.title}<span class="field-error">{editErrors.title}</span>{/if}
      </div>

      <div class="form-group">
        <label for="et-desc">Description</label>
        <textarea id="et-desc" bind:value={editForm.description} rows="3"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="et-start">Start Date *</label>
          <input id="et-start" type="date" bind:value={editForm.start_date} required />
          {#if editErrors.start_date}<span class="field-error">{editErrors.start_date}</span>{/if}
        </div>
        <div class="form-group">
          <label for="et-end">End Date *</label>
          <input id="et-end" type="date" bind:value={editForm.end_date} required />
          {#if editErrors.end_date}<span class="field-error">{editErrors.end_date}</span>{/if}
        </div>
      </div>

      <div class="form-group">
        <label for="et-progress">Progress: {editForm.progress}%</label>
        <input id="et-progress" type="range" min="0" max="100" bind:value={editForm.progress} class="progress-range" />
      </div>

      <div class="form-group">
        <label>Color</label>
        <div class="color-row">
          <input type="color" bind:value={editForm.color} class="color-input" />
          <div class="color-presets">
            {#each DEFAULT_COLORS as c}
              <button type="button" class="color-swatch" class:selected={editForm.color === c} style:background={c} onclick={() => editForm.color = c} title={c}></button>
            {/each}
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Labels</label>
        <div class="label-input-row">
          <input
            placeholder="Add label…"
            bind:value={editForm.labelInput}
            onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel(editForm) } }}
          />
          <button type="button" onclick={() => addLabel(editForm)}>Add</button>
        </div>
        {#if editForm.labels.length > 0}
          <div class="labels-list">
            {#each editForm.labels as lbl}
              <span class="lbl-chip" style:background="{labelColor(lbl)}22" style:color="{labelColor(lbl)}">
                {lbl}
                <button type="button" onclick={() => removeLabel(editForm, lbl)}><X size={10} /></button>
              </span>
            {/each}
          </div>
        {/if}
      </div>

      <div class="form-group">
        <label>Depends On</label>
        <div class="depends-list">
          {#each sortedTasks.filter(t => t.id !== editTask!.id) as t}
            <label class="dep-item">
              <input
                type="checkbox"
                checked={editForm.depends_on.includes(t.id)}
                onchange={(e) => {
                  if (e.currentTarget.checked) editForm.depends_on = [...editForm.depends_on, t.id]
                  else editForm.depends_on = editForm.depends_on.filter(id => id !== t.id)
                }}
              />
              {t.title}
            </label>
          {/each}
          {#if sortedTasks.length <= 1}
            <span class="dep-empty">No other tasks yet</span>
          {/if}
        </div>
      </div>

      <div class="form-actions">
        <Button type="submit" loading={savingEdit} disabled={!editForm.title.trim()}>Save Changes</Button>
        <Button variant="text" onclick={() => editTask = null}>Cancel</Button>
      </div>
    </form>
  {/if}
</SlideOver>

<!-- Add Task Modal -->
<Modal open={addOpen} title="Add Task" onclose={() => addOpen = false}>
  <form onsubmit={handleAddSubmit} class="task-form">
    <div class="form-group">
      <label for="at-title">Title *</label>
      <input id="at-title" bind:value={addForm.title} placeholder="Task name" required />
      {#if addErrors.title}<span class="field-error">{addErrors.title}</span>{/if}
    </div>

    <div class="form-group">
      <label for="at-desc">Description</label>
      <textarea id="at-desc" bind:value={addForm.description} rows="2" placeholder="Optional notes"></textarea>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="at-start">Start Date *</label>
        <input id="at-start" type="date" bind:value={addForm.start_date} required />
        {#if addErrors.start_date}<span class="field-error">{addErrors.start_date}</span>{/if}
      </div>
      <div class="form-group">
        <label for="at-end">End Date *</label>
        <input id="at-end" type="date" bind:value={addForm.end_date} required />
        {#if addErrors.end_date}<span class="field-error">{addErrors.end_date}</span>{/if}
      </div>
    </div>

    <div class="form-group">
      <label for="at-progress">Progress: {addForm.progress}%</label>
      <input id="at-progress" type="range" min="0" max="100" bind:value={addForm.progress} class="progress-range" />
    </div>

    <div class="form-group">
      <label>Color</label>
      <div class="color-row">
        <input type="color" bind:value={addForm.color} class="color-input" />
        <div class="color-presets">
          {#each DEFAULT_COLORS as c}
            <button type="button" class="color-swatch" class:selected={addForm.color === c} style:background={c} onclick={() => addForm.color = c} title={c}></button>
          {/each}
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Labels</label>
      <div class="label-input-row">
        <input
          placeholder="Add label…"
          bind:value={addForm.labelInput}
          onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel(addForm) } }}
        />
        <button type="button" onclick={() => addLabel(addForm)}>Add</button>
      </div>
      {#if addForm.labels.length > 0}
        <div class="labels-list">
          {#each addForm.labels as lbl}
            <span class="lbl-chip" style:background="{labelColor(lbl)}22" style:color="{labelColor(lbl)}">
              {lbl}
              <button type="button" onclick={() => removeLabel(addForm, lbl)}><X size={10} /></button>
            </span>
          {/each}
        </div>
      {/if}
    </div>

    <div class="form-group">
      <label>Depends On</label>
      <div class="depends-list">
        {#each sortedTasks as t}
          <label class="dep-item">
            <input
              type="checkbox"
              checked={addForm.depends_on.includes(t.id)}
              onchange={(e) => {
                if (e.currentTarget.checked) addForm.depends_on = [...addForm.depends_on, t.id]
                else addForm.depends_on = addForm.depends_on.filter(id => id !== t.id)
              }}
            />
            {t.title}
          </label>
        {/each}
        {#if sortedTasks.length === 0}
          <span class="dep-empty">No tasks yet</span>
        {/if}
      </div>
    </div>

    <div class="form-actions">
      <Button type="submit" loading={adding} disabled={!addForm.title.trim()}>Add Task</Button>
      <Button variant="text" onclick={() => addOpen = false}>Cancel</Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirm -->
<DestructiveConfirmDialog
  open={!!deleteTarget}
  title="Delete task?"
  message="This task cannot be recovered once deleted."
  confirmPhrase={`I want to delete ${deleteTarget?.title ?? ''}`}
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<AddToProjectModal
  open={showAddToProject}
  entityType="GANTT_CHART"
  entityId={chart.id}
  onclose={() => showAddToProject = false}
/>

<style>
  /* ── Page Layout ──────────────────────────────────────────────────────────── */
  .gantt-page {
    display: flex;
    flex-direction: column;
    padding: 16px 20px;
    gap: 12px;
  }

  .gantt-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .gantt-header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .gantt-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .back-link {
    font-size: 0.8125rem;
    color: var(--color-primary);
    text-decoration: none;
  }
  .back-link:hover { text-decoration: underline; }
  .title-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .chart-title {
    font-size: 1.375rem;
    font-weight: 500;
    margin: 0;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chart-desc {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }
  .title-input {
    font-size: 1.1rem;
    font-weight: 600;
    border: 1px solid var(--color-primary);
    border-radius: 6px;
    padding: 4px 8px;
    background: var(--color-surface-0);
    color: var(--color-text-primary);
    outline: none;
    width: 300px;
  }
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--color-text-secondary);
  }
  .icon-btn:hover:not(:disabled) { background: var(--color-surface-2); color: var(--color-text-primary); }
  .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .zoom-controls {
    display: flex;
    border: 1px solid var(--color-surface-3);
    border-radius: 8px;
    overflow: hidden;
  }

  .zoom-btn {
    padding: 6px 14px;
    font-size: 13px;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .zoom-btn:not(:last-child) { border-right: 1px solid var(--color-surface-3); }
  .zoom-btn.active { background: var(--color-primary-subtle); color: var(--color-primary); font-weight: 500; }
  .zoom-btn:hover:not(.active) { background: var(--color-surface-2); }

  /* ── Gantt Wrapper ────────────────────────────────────────────────────────── */
  .gantt-wrapper {
    overflow: hidden;
    border: 1px solid var(--color-surface-3);
    border-radius: 10px;
    background: var(--color-surface-0);
    box-shadow: var(--shadow-1);
  }

  .gantt-scroll {
    overflow: auto;
  }

  .gantt-inner {
    position: relative;
  }

  /* ── Header Row ───────────────────────────────────────────────────────────── */
  .gantt-header-row {
    display: flex;
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--color-surface-1);
    border-bottom: 2px solid var(--color-surface-3);
  }

  .label-col-header {
    position: sticky;
    left: 0;
    z-index: 21;
    background: var(--color-surface-1);
    border-right: 1px solid var(--color-surface-3);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  .timeline-col-header {
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }

  .time-unit {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    padding-left: 8px;
    font-size: 11px;
    color: var(--color-text-secondary);
    border-right: 1px solid var(--color-surface-3);
    white-space: nowrap;
    overflow: hidden;
  }

  .today-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-primary);
    opacity: 0.7;
    pointer-events: none;
  }

  /* ── Rows ─────────────────────────────────────────────────────────────────── */
  .gantt-rows {
    position: relative;
  }

  .gantt-row {
    display: flex;
    border-bottom: 1px solid var(--color-surface-2);
    transition: background var(--transition-standard);
  }

  .gantt-row:hover {
    background: var(--color-surface-1);
  }

  .gantt-row.drag-over {
    border-top: 2px solid var(--color-primary);
  }

  /* ── Label Cell ───────────────────────────────────────────────────────────── */
  .label-cell {
    position: sticky;
    left: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    border-right: 1px solid var(--color-surface-3);
    background: var(--color-surface-0);
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-standard);
    overflow: hidden;
  }

  .gantt-row:hover .label-cell { background: var(--color-surface-1); }

  .drag-handle {
    color: var(--color-text-disabled);
    cursor: grab;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity var(--transition-standard);
  }

  .gantt-row:hover .drag-handle { opacity: 1; }
  .drag-handle:active { cursor: grabbing; }

  .label-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .label-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .label-tags {
    display: flex;
    gap: 4px;
    flex-wrap: nowrap;
  }

  .label-tag {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    white-space: nowrap;
    font-weight: 500;
  }

  .progress-badge {
    font-size: 11px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .row-delete-btn {
    opacity: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: opacity var(--transition-standard), background var(--transition-standard);
    flex-shrink: 0;
  }

  .gantt-row:hover .row-delete-btn { opacity: 1; }
  .row-delete-btn:hover { background: #fde8e8; color: var(--color-error); }

  /* ── Bar Area ─────────────────────────────────────────────────────────────── */
  .bar-area {
    position: relative;
    flex-shrink: 0;
  }

  .row-today-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--color-primary);
    opacity: 0.25;
    pointer-events: none;
  }

  .task-bar {
    position: absolute;
    border-radius: 5px;
    cursor: grab;
    user-select: none;
    overflow: hidden;
    display: flex;
    align-items: center;
    transition: box-shadow var(--transition-standard);
    min-width: 4px;
  }

  .task-bar:hover:not(.dragging) { box-shadow: var(--shadow-2); }
  .task-bar.dragging { cursor: grabbing; box-shadow: var(--shadow-3); opacity: 0.9; }

  .progress-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
    pointer-events: none;
    border-radius: 5px 0 0 5px;
    transition: width 0.1s;
  }

  .handle {
    position: absolute;
    top: 0;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
    z-index: 2;
  }

  .handle-left {
    left: 0;
    border-radius: 5px 0 0 5px;
    background: rgba(0, 0, 0, 0.15);
  }

  .handle-right {
    right: 0;
    border-radius: 0 5px 5px 0;
    background: rgba(0, 0, 0, 0.15);
  }

  /* ── Dependency SVG ───────────────────────────────────────────────────────── */
  .dep-svg {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    color: var(--color-text-secondary);
    z-index: 5;
  }

  /* ── Empty State ──────────────────────────────────────────────────────────── */
  .gantt-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px 24px;
    padding: 60px;
    color: var(--color-text-secondary);
    text-align: center;
  }

  .gantt-empty p { margin: 0; font-size: 14px; }

  /* ── Tooltip ──────────────────────────────────────────────────────────────── */
  .tooltip {
    position: fixed;
    background: var(--color-surface-0);
    border: 1px solid var(--color-surface-3);
    border-radius: 8px;
    padding: 10px 14px;
    box-shadow: var(--shadow-2);
    font-size: 13px;
    z-index: 100;
    pointer-events: none;
    min-width: 180px;
  }

  .tooltip-title { font-weight: 600; color: var(--color-text-primary); margin-bottom: 6px; }
  .tooltip-row { display: flex; gap: 6px; color: var(--color-text-secondary); margin-bottom: 2px; }
  .tooltip-row span { color: var(--color-text-disabled); min-width: 60px; }
  .tooltip-labels { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
  .tooltip-label { font-size: 11px; background: var(--color-surface-2); padding: 2px 6px; border-radius: 4px; color: var(--color-text-secondary); }

  /* ── Task Form (shared by edit slideOver + add modal) ─────────────────────── */
  .task-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .form-group input[type="text"],
  .form-group input:not([type="checkbox"]):not([type="range"]):not([type="color"]):not([type="date"]),
  .form-group input[type="date"],
  .form-group textarea {
    padding: 8px 12px;
    border: 1px solid var(--color-surface-3);
    border-radius: 6px;
    font-size: 13px;
    background: var(--color-surface-0);
    color: var(--color-text-primary);
    width: 100%;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .progress-range {
    width: 100%;
    accent-color: var(--color-primary);
  }

  .color-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .color-input {
    width: 40px !important;
    height: 36px;
    padding: 2px !important;
    border-radius: 6px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .color-presets {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .color-swatch {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform var(--transition-standard), border-color var(--transition-standard);
  }

  .color-swatch:hover { transform: scale(1.15); }
  .color-swatch.selected { border-color: var(--color-text-primary); transform: scale(1.1); }

  .label-input-row {
    display: flex;
    gap: 8px;
  }

  .label-input-row input {
    flex: 1;
    padding: 7px 10px;
    border: 1px solid var(--color-surface-3);
    border-radius: 6px;
    font-size: 13px;
    background: var(--color-surface-0);
    color: var(--color-text-primary);
  }

  .label-input-row input:focus { outline: none; border-color: var(--color-primary); }

  .label-input-row button {
    padding: 7px 14px;
    border: 1px solid var(--color-surface-3);
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    background: var(--color-surface-1);
    color: var(--color-text-secondary);
  }

  .label-input-row button:hover { background: var(--color-surface-2); }

  .labels-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .lbl-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 500;
  }

  .lbl-chip button {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: inherit;
    opacity: 0.7;
  }

  .depends-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 180px;
    overflow-y: auto;
    border: 1px solid var(--color-surface-3);
    border-radius: 6px;
    padding: 8px 12px;
    background: var(--color-surface-1);
  }

  .dep-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .dep-empty { font-size: 13px; color: var(--color-text-disabled); }

  .field-error { font-size: 12px; color: var(--color-error); }

  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 4px;
    border-top: 1px solid var(--color-surface-2);
    margin-top: 4px;
  }

  @media (max-width: 1019px) {
    .btn-label { display: none; }
  }
</style>
