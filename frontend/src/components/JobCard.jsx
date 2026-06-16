import { useState } from 'react'
import EquipmentGroup from './EquipmentGroup.jsx'
import GroupModal from './GroupModal.jsx'
import MilestonePanel from './MilestonePanel.jsx'

const fmt = (n) => n ? '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '$0'

export default function JobCard({ job, onEdit, onDelete, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [activeTab, setActiveTab] = useState('equipment')
  const { stats } = job

  const margin = job.project_sell > 0
    ? ((job.project_sell - stats.totalCost - job.estimated_install - job.outbound_freight) / job.project_sell * 100).toFixed(1)
    : null

  const handleSaveGroup = async (data) => {
    if (editingGroup) {
      await fetch(`/api/groups/${editingGroup.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
    } else {
      await fetch(`/api/jobs/${job.id}/groups`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
    }
    setShowGroupModal(false)
    setEditingGroup(null)
    onRefresh()
  }

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Delete this group and all its line items?')) return
    await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', marginBottom: 10, overflow: 'hidden',
    }}>
      {/* Card header */}
      <div
        style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{job.job_number}</span>
              <span className={`tag tag-${job.stats.completion}`}>{job.stats.completion}%</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, fontWeight: 500 }}>{job.customer || '—'}</div>
            {job.revision && <div style={{ fontSize: 11, color: 'var(--text3)' }}>Rev: {job.revision}</div>}
          </div>
          <span style={{ color: 'var(--text3)', fontSize: 16, flexShrink: 0, marginTop: 2 }}>{expanded ? '▲' : '▼'}</span>
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <Stat label="Items" value={`${stats.poCount}/${stats.totalItems} POs`} />
          <Stat label="Received" value={`${stats.receivedCount}/${stats.totalItems}`} />
          <Stat label="Equipment $" value={fmt(stats.totalCost)} highlight />
          {job.project_sell > 0 && <Stat label="Sell $" value={fmt(job.project_sell)} />}
          {margin !== null && <Stat label="Margin" value={margin + '%'} color={Number(margin) >= 20 ? 'var(--success)' : Number(margin) >= 10 ? 'var(--warning)' : 'var(--danger)'} />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
            {['equipment', 'financials', 'milestones'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? 'var(--surface3)' : 'transparent',
                  color: activeTab === tab ? 'var(--text)' : 'var(--text3)',
                  padding: '7px 14px', borderRadius: 0, fontWeight: activeTab === tab ? 600 : 400,
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  fontSize: 12, textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEdit() }} title="Edit job" style={{ margin: '4px 4px' }}>✏️</button>
            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onDelete() }} title="Delete job" style={{ margin: '4px 4px' }}>🗑️</button>
          </div>

          {activeTab === 'equipment' && (
            <div style={{ padding: '10px 12px' }}>
              {job.groups.map(group => (
                <EquipmentGroup
                  key={group.id}
                  group={group}
                  onEdit={() => { setEditingGroup(group); setShowGroupModal(true) }}
                  onDelete={() => handleDeleteGroup(group.id)}
                  onRefresh={onRefresh}
                />
              ))}
              <button
                className="btn-ghost btn-sm"
                onClick={() => { setEditingGroup(null); setShowGroupModal(true) }}
                style={{ marginTop: 6, width: '100%', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}
              >
                + Add Equipment Group
              </button>
            </div>
          )}

          {activeTab === 'financials' && (
            <FinancialsTab job={job} stats={stats} />
          )}

          {activeTab === 'milestones' && (
            <MilestonePanel job={job} onRefresh={onRefresh} />
          )}
        </div>
      )}

      {showGroupModal && (
        <GroupModal
          group={editingGroup}
          onSave={handleSaveGroup}
          onClose={() => { setShowGroupModal(false); setEditingGroup(null) }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, highlight, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: color || (highlight ? 'var(--accent)' : 'var(--text2)') }}>{value}</div>
    </div>
  )
}

function FinancialsTab({ job, stats }) {
  const fmt = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const totalCogs = (stats.totalCost || 0) + (job.estimated_install || 0) + (job.outbound_freight || 0) + (stats.totalFreight || 0)
  const margin = job.project_sell > 0 ? ((job.project_sell - totalCogs) / job.project_sell * 100) : 0
  const budgetVariance = stats.totalBudgeted > 0 ? stats.totalCost - stats.totalBudgeted : null

  const rows = [
    { label: 'Equipment (PO Actuals)', value: stats.totalCost, indent: false },
    { label: 'Budgeted Equipment', value: stats.totalBudgeted, indent: false, dim: true },
    budgetVariance !== null && { label: 'Budget Variance', value: budgetVariance, indent: true, color: budgetVariance > 0 ? 'var(--danger)' : 'var(--success)' },
    { label: 'Inland Freight', value: stats.totalFreight, indent: false },
    { label: 'Est. Installation', value: job.estimated_install, indent: false },
    { label: 'Outbound Freight', value: job.outbound_freight, indent: false },
    { label: 'Total COGS', value: totalCogs, indent: false, bold: true },
    { label: 'Project Sell Price', value: job.project_sell, indent: false, bold: true, color: 'var(--accent)' },
    job.project_sell > 0 && { label: 'Gross Margin', value: margin.toFixed(1) + '%', raw: true, bold: true, color: margin >= 20 ? 'var(--success)' : margin >= 10 ? 'var(--warning)' : 'var(--danger)' },
    { label: 'Down Payments Sent', value: stats.totalDownPayment, indent: false },
    { label: 'Total PO Committed', value: stats.totalPoTotal, indent: false, bold: true },
  ].filter(Boolean)

  return (
    <div style={{ padding: '12px 16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--surface3)' }}>
              <td style={{ padding: '5px 0', paddingLeft: row.indent ? 16 : 0, color: row.dim ? 'var(--text3)' : 'var(--text2)', fontWeight: row.bold ? 700 : 400 }}>
                {row.label}
              </td>
              <td style={{ textAlign: 'right', fontWeight: row.bold ? 700 : 500, color: row.color || (row.bold ? 'var(--text)' : 'var(--text2)'), paddingLeft: 20 }}>
                {row.raw ? row.value : fmt(row.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
