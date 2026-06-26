import { useEffect, useState } from 'react'

const fmt = (n) => {
  if (!n && n !== 0) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n < 0 ? '-' : '') + '$' + (abs / 1_000_000).toFixed(2) + 'M'
  if (abs >= 1_000)     return (n < 0 ? '-' : '') + '$' + (abs / 1_000).toFixed(1) + 'K'
  return (n < 0 ? '-' : '') + '$' + abs.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const fmtDate = (str) => {
  if (!str) return '—'
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return '—'
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] + ' ' + d + ', ' + y
}

const TYPE_LABELS = {
  frac_sand: 'Frac Sand', soil: 'Soil Remediation',
  aggregate: 'Concrete Aggregate', parts: 'Parts Order', other: 'Other',
}
const TYPE_COLORS = {
  frac_sand: '#f97316', soil: '#22c55e', aggregate: '#3b82f6', parts: '#a855f7', other: '#64748b',
}
const STATUS_LABELS = {
  lead: 'Lead', active: 'Active', on_hold: 'On Hold', complete: 'Complete',
}
const STATUS_COLORS = {
  lead: '#60a5fa', active: '#86efac', on_hold: '#fbbf24', complete: '#94a3b8',
}
const ITEM_STATUS_LABELS = {
  not_started: 'Not Started', rfq_sent: 'RFQ Sent', quote_received: 'Quote Rcvd',
  po_issued: 'PO Issued', received: 'Received', invoiced: 'Invoiced',
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text3)' }}>
      Loading dashboard...
    </div>
  )

  const { spend, byStatus, byType, overdue, lateToOrder, forecastByJob } = data
  const totalJobs = Object.values(byStatus).reduce((s, n) => s + n, 0)

  // Spend bar percentages
  const sellBase = spend.totalSell || 1
  const actualPct     = Math.min(100, (spend.totalActual    / sellBase) * 100)
  const committedPct  = Math.min(100, (spend.totalCommitted / sellBase) * 100)
  const budgetedPct   = Math.min(100, (spend.totalBudgeted  / sellBase) * 100)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', background: 'var(--bg)' }}>

      {/* ── Spend Summary ───────────────────────────────────────────────────── */}
      <Section title="Spend Summary" sub="Active &amp; on-hold jobs">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <SpendCard
            label="Contract Value"
            sub="Total sell price, active + on-hold"
            value={fmt(spend.totalSell)}
            color="var(--accent)" />
          <SpendCard
            label="PO Committed"
            sub={spend.totalSell ? 'Orders placed, not yet invoiced · ' + Math.round((spend.totalCommitted / spend.totalSell) * 100) + '% of sell' : 'Orders placed, not yet invoiced'}
            value={fmt(spend.totalCommitted)}
            color="#f97316" />
          <SpendCard
            label="Invoiced to Date"
            sub={spend.totalSell ? 'Vendor invoices received · ' + Math.round((spend.totalActual / spend.totalSell) * 100) + '% of sell' : 'Vendor invoices received'}
            value={fmt(spend.totalActual)}
            color="#22c55e" />
          <SpendCard
            label="Equipment Budget"
            sub="Planned cost across all line items"
            value={fmt(spend.totalBudgeted)}
            color="var(--text2)" />
        </div>

        {/* Spend bar — stacked: invoiced | PO'd pending invoice | uncommitted */}
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '14px 16px',
          border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase',
              letterSpacing: '0.05em' }}>Cost vs. Contract Value</span>
            <div style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{Math.round(committedPct)}%</span>
              <span style={{ color: 'var(--text3)' }}> committed of </span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{fmt(spend.totalSell)}</span>
              <span style={{ color: 'var(--text3)' }}> contract · </span>
              <span style={{ color: 'var(--text3)' }}>{fmt(Math.max(0, spend.totalSell - spend.totalCommitted))} remaining</span>
            </div>
          </div>
          <div style={{ display: 'flex', height: 32, borderRadius: 4, overflow: 'hidden',
            background: 'var(--surface3)', border: '1px solid var(--border)' }}>
            {/* Invoiced (green) */}
            <div style={{ width: actualPct + '%', background: '#22c55e', flexShrink: 0,
              transition: 'width 0.4s', display: 'flex', alignItems: 'center', paddingLeft: 8,
              borderRight: actualPct > 0 ? '1px solid rgba(0,0,0,0.2)' : 'none' }}>
              {actualPct >= 10 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.65)',
                  whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  Invoiced {Math.round(actualPct)}%
                </span>
              )}
            </div>
            {/* PO'd, pending invoice (orange) */}
            <div style={{ width: Math.max(0, committedPct - actualPct) + '%', background: '#f97316',
              flexShrink: 0, transition: 'width 0.4s', display: 'flex', alignItems: 'center',
              paddingLeft: 8, borderRight: (committedPct - actualPct) > 0 ? '1px solid rgba(0,0,0,0.2)' : 'none' }}>
              {(committedPct - actualPct) >= 8 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.65)',
                  whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  PO'd {Math.round(committedPct - actualPct)}%
                </span>
              )}
            </div>
            {/* Uncommitted (gray) */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
              {(100 - committedPct) >= 10 && (
                <span style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                  {fmt(Math.max(0, spend.totalSell - spend.totalCommitted))} uncommitted
                </span>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Breakdowns ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* By Status */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '14px 18px' }}>
          <SectionHeader title="Jobs by Stage" sub={totalJobs + ' total'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {['active','lead','on_hold','complete'].map(s => {
              const count = byStatus[s] || 0
              const pct = totalJobs ? (count / totalJobs) * 100 : 0
              return (
                <div key={s}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{STATUS_LABELS[s]}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLORS[s] }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: STATUS_COLORS[s],
                      opacity: 0.8, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Type */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '14px 18px' }}>
          <SectionHeader title="Jobs by Type" sub={totalJobs + ' total'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {Object.entries(TYPE_LABELS).map(([key, label]) => {
              const count = byType[key] || 0
              const pct = totalJobs ? (count / totalJobs) * 100 : 0
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TYPE_COLORS[key] }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: TYPE_COLORS[key],
                      opacity: 0.8, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Alerts ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Overdue Deliveries */}
        <AlertPanel
          title="Overdue Deliveries"
          sub="PO issued — item not yet received"
          color="#ef4444"
          count={overdue.length}
          empty="No overdue deliveries"
        >
          {overdue.map(item => (
            <AlertRow key={item.itemId}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.description || '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                  {item.jobNumber} · {item.groupName}
                  {item.vendor ? ` · ${item.vendor}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>
                  {item.daysOverdue}d overdue
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtDate(item.estimated_delivery)}</div>
              </div>
            </AlertRow>
          ))}
        </AlertPanel>

        {/* Late to Order */}
        <AlertPanel
          title="Late to Order"
          sub="Order should already be placed"
          color="#f59e0b"
          count={lateToOrder.length}
          empty="All items ordered on time"
        >
          {lateToOrder.map(item => (
            <AlertRow key={item.itemId}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.description || '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                  {item.jobNumber} · {item.groupName}
                  {item.weeks_lead ? ` · ${item.weeks_lead}wk lead` : ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {ITEM_STATUS_LABELS[item.status] || item.status}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>
                  {item.daysLate}d late
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  Order by {fmtDate(item.orderByDate)}
                </div>
              </div>
            </AlertRow>
          ))}
        </AlertPanel>
      </div>

      {/* ── Forecast at Completion ──────────────────────────────────────────── */}
      <Section title="Forecast at Completion" sub="Active, on-hold &amp; lead jobs">
        {forecastByJob.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 }}>
            No active jobs
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Job', 'Customer', 'Type', 'Sell Price', 'Actual', 'Committed', 'Budgeted Rem.', 'Forecast Cost', 'Forecast Margin', 'vs Target', 'Complete'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: h === 'Job' || h === 'Customer' || h === 'Type' ? 'left' : 'right',
                    color: 'var(--text3)', fontWeight: 600, fontSize: 11,
                    whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecastByJob.map((job, idx) => {
                const marginDelta = job.forecastMargin !== null ? job.forecastMargin - job.targetMargin : null
                const marginColor = marginDelta === null ? 'var(--text3)'
                  : marginDelta >= 0 ? '#22c55e' : marginDelta >= -5 ? '#f59e0b' : '#ef4444'
                return (
                  <tr key={job.jobId} style={{ borderBottom: '1px solid var(--surface3)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: TYPE_COLORS[job.projectType] || 'var(--text)' }}>
                      {job.jobNumber}
                    </td>
                    <td style={{ padding: '7px 10px', color: 'var(--text2)', maxWidth: 140,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.customer || '—'}
                    </td>
                    <td style={{ padding: '7px 10px', color: TYPE_COLORS[job.projectType] || 'var(--text3)',
                      fontSize: 11, whiteSpace: 'nowrap' }}>
                      {TYPE_LABELS[job.projectType] || job.projectType}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>
                      {fmt(job.projectSell)}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#22c55e' }}>
                      {fmt(job.actualCost)}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#f97316' }}>
                      {fmt(job.committedCost)}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text3)' }}>
                      {fmt(job.budgetedRemaining)}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text)', fontWeight: 600 }}>
                      {fmt(job.forecastCost)}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: marginColor }}>
                      {job.forecastMargin !== null ? job.forecastMargin.toFixed(1) + '%' : '—'}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600,
                      color: marginColor, fontSize: 11 }}>
                      {marginDelta !== null
                        ? (marginDelta >= 0 ? '+' : '') + marginDelta.toFixed(1) + '%'
                        : '—'}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                      <span className={`tag tag-${job.completion}`} style={{ fontSize: 10 }}>
                        {job.completionPct}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, sub, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <SectionHeader title={title} sub={sub} />
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{title}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</span>}
    </div>
  )
}

function SpendCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '14px 18px' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase',
        letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function AlertPanel({ title, sub, color, count, empty, children }) {
  const ROW_HEIGHT = 62 // approximate px per row
  const MAX_VISIBLE = 5
  const scrollable = count > MAX_VISIBLE

  return (
    <div style={{ background: 'var(--surface)', border: `1px solid var(--border)`,
      borderTop: `3px solid ${color}`, borderRadius: 'var(--radius-lg)', padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>
        </div>
        {count > 0 && (
          <span style={{ background: color + '22', color, border: `1px solid ${color}55`,
            fontWeight: 700, fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>
            {count}
          </span>
        )}
      </div>
      {count === 0
        ? <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text3)', fontSize: 12 }}>{empty}</div>
        : <div style={{
            display: 'flex', flexDirection: 'column', gap: 1,
            maxHeight: scrollable ? ROW_HEIGHT * MAX_VISIBLE + 'px' : 'none',
            overflowY: scrollable ? 'auto' : 'visible',
            paddingRight: scrollable ? 4 : 0,
          }}>
            {children}
          </div>
      }
      {scrollable && (
        <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', marginTop: 6 }}>
          Scroll to see all {count} items
        </div>
      )}
    </div>
  )
}

function AlertRow({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 12, padding: '8px 0', borderBottom: '1px solid var(--surface3)' }}>
      {children}
    </div>
  )
}

function Legend({ color, label, opacity, border }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color,
        opacity: opacity || 1, border: border ? '1px solid var(--border)' : 'none' }} />
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</span>
    </div>
  )
}
