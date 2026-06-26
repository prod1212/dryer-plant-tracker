import { useState, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

const STATUS_COLOR = {
  not_started:    '#888780',
  rfq_sent:       '#EF9F27',
  quote_received: '#BA7517',
  po_issued:      '#639922',
  received:       '#3B6D11',
  invoiced:       '#185FA5',
}

const STATUS_LABEL = {
  not_started:    'Not started',
  rfq_sent:       'RFQ sent',
  quote_received: 'Quote received',
  po_issued:      'PO issued',
  received:       'Received',
  invoiced:       'Invoiced',
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const MONTH_H = 27
const JOB_H   = 40
const GROUP_H = 30
const ITEM_H  = 30

function parseDate(str) {
  if (!str) return null
  const parts = str.split('-').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d) // local midnight — avoids UTC offset shifting the day
  return isNaN(date.getTime()) ? null : date
}

// Accepts either an already-parsed Date or a date string
function formatDate(dateOrStr) {
  const d = dateOrStr instanceof Date ? dateOrStr : parseDate(dateOrStr)
  if (!d) return '—'
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// ── Custom tooltip ───────────────────────────────────────────────────────────
function GanttTooltip({ x, y, lines }) {
  const w = 220
  const left = x + 16 + w > window.innerWidth ? x - w - 8 : x + 16
  const top  = Math.max(8, y - 10)
  // Use a portal to escape the drawer's CSS transform (which would otherwise
  // offset position:fixed children relative to the drawer, not the viewport)
  return createPortal(
    <div style={{
      position: 'fixed', left, top, zIndex: 9999,
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
      padding: '8px 12px',
      pointerEvents: 'none',
      minWidth: 140, maxWidth: w,
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontSize: i === 0 ? 12 : 11,
          fontWeight: i === 0 ? 700 : 400,
          color: i === 0 ? 'var(--text)' : 'var(--text2)',
          marginTop: i === 0 ? 0 : 3,
          lineHeight: 1.4,
        }}>
          {line}
        </div>
      ))}
    </div>,
    document.body
  )
}

export default function DrawerSchedule({ job }) {
  const [hoveredGroupId,   setHoveredGroupId]   = useState(null)
  const [hoveredItemId,    setHoveredItemId]     = useState(null)
  const [collapsedGroups,  setCollapsedGroups]   = useState(new Set())
  const [tooltip,          setTooltip]           = useState(null) // { x, y, lines }

  const leftRef       = useRef(null)
  const rightRef      = useRef(null)
  const syncingLeft   = useRef(false)
  const syncingRight  = useRef(false)
  const monthInnerRef  = useRef(null)
  const jobBarInnerRef = useRef(null)

  // ── Tooltip helpers ─────────────────────────────────────────────────────────
  const showTip  = useCallback((e, lines) => setTooltip({ x: e.clientX, y: e.clientY, lines }), [])
  const moveTip  = useCallback((e) => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null), [])
  const hideTip  = useCallback(() => setTooltip(null), [])

  // ── Scroll sync ─────────────────────────────────────────────────────────────
  const onScrollLeft = useCallback(() => {
    if (syncingLeft.current) return
    syncingRight.current = true
    if (rightRef.current) rightRef.current.scrollTop = leftRef.current.scrollTop
    syncingRight.current = false
  }, [])

  const onScrollRight = useCallback(() => {
    if (syncingRight.current) return
    syncingLeft.current = true
    if (leftRef.current) leftRef.current.scrollTop = rightRef.current.scrollTop
    syncingLeft.current = false
    const sl = rightRef.current.scrollLeft
    if (monthInnerRef.current)  monthInnerRef.current.style.transform  = `translateX(-${sl}px)`
    if (jobBarInnerRef.current) jobBarInnerRef.current.style.transform = `translateX(-${sl}px)`
  }, [])

  const toggleGroup = (id) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Timeline range ──────────────────────────────────────────────────────────
  const { minDate, maxDate, months } = useMemo(() => {
    const dates = []
    job.groups.forEach(g => g.items.forEach(item => {
      const s = parseDate(item.date_ordered) || parseDate(item.rfq_date)
      const e = parseDate(item.estimated_delivery)
      if (s) dates.push(s)
      if (e) dates.push(e)
    }))
    if (job.target_delivery) dates.push(parseDate(job.target_delivery))
    if (!dates.length) {
      const now = new Date()
      const end = new Date(now); end.setMonth(end.getMonth() + 4)
      return buildRange(now, end)
    }
    const min = new Date(Math.min(...dates.map(d => d.getTime())))
    const max = new Date(Math.max(...dates.map(d => d.getTime())))
    return buildRange(min, max)
  }, [job])

  function buildRange(min, max) {
    const pad = 12 * 24 * 60 * 60 * 1000
    const lo = new Date(min.getTime() - pad)
    const hi = new Date(max.getTime() + pad)
    const months = []
    const cur = new Date(lo.getFullYear(), lo.getMonth(), 1)
    while (cur <= hi) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1) }
    return { minDate: lo, maxDate: hi, months }
  }

  const totalMs  = maxDate - minDate
  const pct      = (date) => date ? ((date - minDate) / totalMs) * 100 : null
  const todayPct = pct(new Date())

  // ── Bar calculations ────────────────────────────────────────────────────────
  function itemBar(item) {
    const start = parseDate(item.date_ordered) || parseDate(item.rfq_date)
    const end   = parseDate(item.estimated_delivery)
    if (!start && !end) return null
    const s = start ? pct(start) : Math.max(0, pct(end) - 4)
    const e = end   ? pct(end)   : Math.min(100, pct(start) + 4)
    return { left: Math.max(0, s), width: Math.max(0.5, e - s) }
  }

  function groupBar(group) {
    const bars = group.items.map(itemBar).filter(Boolean)
    if (!bars.length) return null
    const left  = Math.min(...bars.map(b => b.left))
    const right = Math.max(...bars.map(b => b.left + b.width))
    return { left, width: right - left }
  }

  const jobBarData = useMemo(() => {
    const bars = job.groups.flatMap(g => g.items.map(itemBar)).filter(Boolean)
    if (!bars.length) return null
    const left  = Math.min(...bars.map(b => b.left))
    const right = Math.max(...bars.map(b => b.left + b.width))
    return { left, width: right - left }
  }, [job, minDate, maxDate])

  const jobDateRange = useMemo(() => {
    const dates = []
    job.groups.forEach(g => g.items.forEach(item => {
      const s = parseDate(item.date_ordered) || parseDate(item.rfq_date)
      const e = parseDate(item.estimated_delivery)
      if (s) dates.push(s)
      if (e) dates.push(e)
    }))
    if (!dates.length) return null
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end:   new Date(Math.max(...dates.map(d => d.getTime()))),
    }
  }, [job])

  const criticalItemId = useMemo(() => {
    let latest = null, latestDate = null
    job.groups.forEach(g => g.items.forEach(item => {
      const d = parseDate(item.estimated_delivery)
      if (d && (!latestDate || d > latestDate)) { latest = item.id; latestDate = d }
    }))
    return latest
  }, [job])

  // ── Shared sub-elements ─────────────────────────────────────────────────────
  const gridLines = (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
      {months.map((_, i) => <div key={i} style={{ flex: 1, borderRight: '0.5px solid var(--border)', opacity: 0.5 }} />)}
    </div>
  )

  const todayLineEl = todayPct >= 0 && todayPct <= 100
    ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${todayPct}%`, width: 1.5, background: '#f87171', opacity: 0.7, zIndex: 2, pointerEvents: 'none' }} />
    : null

  const targetPct = job.target_delivery ? pct(parseDate(job.target_delivery)) : null
  const targetLineEl = targetPct !== null && targetPct >= 0 && targetPct <= 100
    ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${targetPct}%`, width: 1.5, background: '#fbbf24', zIndex: 3, pointerEvents: 'none' }} />
    : null

  // ── Row styles ──────────────────────────────────────────────────────────────
  const groupRow = (hov) => ({
    height: GROUP_H, boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
    borderBottom: '1px solid var(--border)',
    background: hov ? 'var(--surface3)' : 'var(--surface2)',
    cursor: 'pointer', transition: 'background 0.1s', flexShrink: 0,
  })

  const itemRow = (hov) => ({
    height: ITEM_H, boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px 0 28px',
    borderBottom: '1px solid var(--border)',
    background: hov ? 'var(--surface3)' : 'transparent',
    cursor: 'default', transition: 'background 0.1s', flexShrink: 0,
  })

  const ganttRow = (hov) => ({
    height: GROUP_H, boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', position: 'relative',
    background: hov ? 'var(--surface3)' : 'transparent',
    borderBottom: '1px solid var(--border)', transition: 'background 0.1s', flexShrink: 0,
  })

  const noItems = job.groups.every(g => g.items.length === 0)

  if (noItems) {
    return (
      <div style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: '60px 0' }}>
        No line items with dates yet. Add items with RFQ or delivery dates to see the schedule.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Fixed non-scrolling header ── */}
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>

        {/* Left column */}
        <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            height: MONTH_H, boxSizing: 'border-box', display: 'flex', alignItems: 'center',
            padding: '0 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)',
            fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Schedule
          </div>
          <div style={{
            height: JOB_H, boxSizing: 'border-box', display: 'flex', alignItems: 'center',
            padding: '0 14px', background: 'var(--surface2)',
            fontSize: 13, fontWeight: 700, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {job.job_number} — {job.customer}
          </div>
        </div>

        {/* Right column */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Month labels */}
          <div style={{ overflow: 'hidden', height: MONTH_H, boxSizing: 'border-box', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
            <div ref={monthInnerRef} style={{ display: 'flex', minWidth: 480 }}>
              {months.map((m, i) => (
                <div key={i} style={{
                  flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--text3)',
                  height: MONTH_H, boxSizing: 'border-box',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRight: '1px solid var(--border)',
                }}>
                  {MONTH_NAMES[m.getMonth()]} {m.getFullYear() !== new Date().getFullYear() ? m.getFullYear() : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Job bar row — no today/target lines here to avoid alignment artifacts */}
          <div style={{ overflow: 'hidden', height: JOB_H, boxSizing: 'border-box', background: 'var(--surface2)' }}>
            <div ref={jobBarInnerRef} style={{ minWidth: 480, height: '100%', position: 'relative' }}>
              {gridLines}
              {jobBarData && (
                <div
                  onMouseEnter={(e) => showTip(e, [
                    'Project Duration',
                    jobDateRange
                      ? `${formatDate(jobDateRange.start.toISOString())} → ${formatDate(jobDateRange.end.toISOString())}`
                      : job.job_number,
                  ])}
                  onMouseMove={moveTip}
                  onMouseLeave={hideTip}
                  style={{
                    position: 'absolute', left: `${jobBarData.left}%`, width: `${jobBarData.width}%`,
                    height: 22, top: '50%', transform: 'translateY(-50%)',
                    background: '#185FA5', borderRadius: 4, zIndex: 1,
                    display: 'flex', alignItems: 'center', paddingLeft: 8,
                    fontSize: 10, color: '#E6F1FB', overflow: 'hidden', whiteSpace: 'nowrap',
                    fontWeight: 600, cursor: 'default',
                  }}
                >
                  Project Duration
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left panel */}
        <div
          ref={leftRef}
          style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}
          onScroll={onScrollLeft}
        >
          {job.groups.map(group => {
            const collapsed = collapsedGroups.has(group.id)
            const gHov = hoveredGroupId === group.id
            return (
              <div key={group.id} style={{ flexShrink: 0 }}>
                <div
                  style={groupRow(gHov)}
                  onMouseEnter={() => setHoveredGroupId(group.id)}
                  onMouseLeave={() => setHoveredGroupId(null)}
                  onClick={() => toggleGroup(group.id)}
                >
                  <span style={{ fontSize: 9, color: 'var(--text3)', width: 10 }}>{collapsed ? '▶' : '▼'}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5DCAA5', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {group.name}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{group.items.length}</span>
                </div>
                {!collapsed && group.items.map(item => {
                  const iHov = hoveredItemId === item.id
                  const isCritical = item.id === criticalItemId
                  return (
                    <div
                      key={item.id}
                      style={itemRow(iHov)}
                      onMouseEnter={() => setHoveredItemId(item.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[item.status] || '#888', flexShrink: 0 }} />
                      <span
                        style={{ fontSize: 11, color: isCritical ? '#f87171' : 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={item.description}
                      >
                        {item.description || '(no description)'}
                      </span>
                      {isCritical && <span style={{ fontSize: 9, color: '#f87171' }}>★</span>}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Right panel — gantt bars */}
        <div
          ref={rightRef}
          style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}
          onScroll={onScrollRight}
        >
          <div style={{ minWidth: 480 }}>
            {job.groups.map(group => {
              const collapsed = collapsedGroups.has(group.id)
              const gBar      = groupBar(group)
              const gHov      = hoveredGroupId === group.id

              const gDates = group.items.flatMap(item => {
                const s = parseDate(item.date_ordered) || parseDate(item.rfq_date)
                const e = parseDate(item.estimated_delivery)
                return [s, e].filter(Boolean)
              })
              const gTipLines = gDates.length ? [
                group.name,
                `${group.items.length} item${group.items.length !== 1 ? 's' : ''}`,
                `${formatDate(new Date(Math.min(...gDates.map(d=>d.getTime()))))} → ${formatDate(new Date(Math.max(...gDates.map(d=>d.getTime()))))}`,
              ] : [group.name, `${group.items.length} items`]

              return (
                <div key={group.id} style={{ flexShrink: 0 }}>
                  {/* Group bar row */}
                  <div
                    style={ganttRow(gHov)}
                    onMouseEnter={() => setHoveredGroupId(group.id)}
                    onMouseLeave={() => setHoveredGroupId(null)}
                  >
                    {gridLines}
                    {todayLineEl}
                    {targetLineEl}
                    {gBar && (
                      <div
                        onMouseEnter={(e) => showTip(e, gTipLines)}
                        onMouseMove={moveTip}
                        onMouseLeave={hideTip}
                        style={{
                          position: 'absolute', left: `${gBar.left}%`, width: `${gBar.width}%`,
                          height: 12, top: '50%', transform: 'translateY(-50%)',
                          background: '#5DCAA5', borderRadius: 3, zIndex: 1, opacity: 0.85,
                          cursor: 'default',
                        }}
                      />
                    )}
                  </div>

                  {/* Item bar rows */}
                  {!collapsed && group.items.map(item => {
                    const bar        = itemBar(item)
                    const iHov       = hoveredItemId === item.id
                    const isCritical = item.id === criticalItemId

                    const iTipLines = [
                      item.description || '(no description)',
                      item.vendor      ? `Vendor: ${item.vendor}`   : null,
                      item.po_number   ? `PO #: ${item.po_number}`  : null,
                      item.budgeted_cost > 0
                        ? `Budget: $${Number(item.budgeted_cost).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                        : null,
                      `Status: ${STATUS_LABEL[item.status] || item.status}`,
                      item.estimated_delivery ? `Delivery: ${formatDate(item.estimated_delivery)}` : null,
                      isCritical ? '★ Critical path' : null,
                    ].filter(Boolean)

                    return (
                      <div
                        key={item.id}
                        style={ganttRow(iHov)}
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                      >
                        {gridLines}
                        {todayLineEl}
                        {targetLineEl}
                        {bar && (
                          <div
                            onMouseEnter={(e) => showTip(e, iTipLines)}
                            onMouseMove={moveTip}
                            onMouseLeave={hideTip}
                            style={{
                              position: 'absolute', left: `${bar.left}%`, width: `${bar.width}%`,
                              height: 8, top: '50%', transform: 'translateY(-50%)',
                              background: STATUS_COLOR[item.status] || '#888',
                              borderRadius: 2, zIndex: 1,
                              outline: isCritical ? '1.5px solid #f87171' : 'none',
                              outlineOffset: 1,
                              cursor: 'default',
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, padding: '8px 14px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', background: 'var(--surface2)', flexShrink: 0 }}>
        {Object.entries(STATUS_COLOR).map(([k, c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
            <div style={{ width: 10, height: 6, borderRadius: 2, background: c }} />
            {STATUS_LABEL[k]}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
          <div style={{ width: 10, height: 6, borderRadius: 2, background: '#888', outline: '1.5px solid #f87171', outlineOffset: 1 }} />
          Critical path
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
          <div style={{ width: 1.5, height: 10, background: '#f87171' }} /> Today
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
          <div style={{ width: 1.5, height: 10, background: '#fbbf24' }} /> Target delivery
        </div>
      </div>

      {/* Custom tooltip */}
      {tooltip && <GanttTooltip x={tooltip.x} y={tooltip.y} lines={tooltip.lines} />}
    </div>
  )
}
