import { useState } from 'react'
import EquipmentGroup from './EquipmentGroup.jsx'
import GroupModal from './GroupModal.jsx'
import ItemModal from './ItemModal.jsx'

const fmt = (n) => n ? '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '$0'

const TYPE_CONFIG = {
  frac_sand:  { label: 'Frac Sand',         color: '#f97316' },
  soil:       { label: 'Soil Remediation',   color: '#22c55e' },
  aggregate:  { label: 'Aggregate',          color: '#3b82f6' },
  parts:      { label: 'Parts Order',        color: '#a855f7' },
  other:      { label: 'Other',              color: '#64748b' },
}

const STATUS_CONFIG = {
  lead:     { label: 'Lead',     bg: '#1e3a5f', color: '#60a5fa' },
  active:   { label: 'Active',   bg: '#14532d', color: '#86efac' },
  on_hold:  { label: 'On Hold',  bg: '#3f2c1a', color: '#fbbf24' },
  complete: { label: 'Complete', bg: '#1e293b', color: '#94a3b8' },
}

export default function JobCard({ job, onEdit, onDelete, onRefresh, onOpenDrawer }) {
  const [expanded, setExpanded] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [activeTab, setActiveTab] = useState('equipment_groups')
  const isPartsJob = /^P/i.test(job.job_number)
  const { stats } = job
  const typeConfig = TYPE_CONFIG[job.project_type] || TYPE_CONFIG.other
  const statusConfig = STATUS_CONFIG[job.job_status] || STATUS_CONFIG.lead

  const targetMargin = job.target_margin ?? 35

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
      background: 'var(--surface)',
      border: `1px solid var(--border)`,
      borderLeft: `5.25px solid ${typeConfig.color}`,
      borderRadius: 'var(--radius-lg)', marginBottom: 10, overflow: 'hidden',
    }}>
      {/* Type label row */}
      <div style={{
        borderBottom: `1px solid ${typeConfig.color}30`,
        padding: '5px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: typeConfig.color,
          letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.85,
        }}>
          {typeConfig.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEdit() }} title="Edit job">✏️</button>
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onDelete() }} title="Delete job" style={{ marginLeft: -9 }}>🗑️</button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDrawer() }}
            title="Open details"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', fontSize: 12, fontWeight: 500, padding: '1px 4px',
              borderRadius: 4,
            }}
            onMouseEnter={e => e.currentTarget.style.color = typeConfig.color}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
          >
            ⤢ Open
          </button>
        </div>
      </div>

      {/* Card header */}
      <div
        style={{ padding: '13px 14px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 20, color: typeConfig.color, lineHeight: 1 }}>{job.job_number}</span>
              <span className={`tag tag-${job.stats.completion}`} style={{ fontSize: 10, position: 'relative', top: 2 }}>{job.stats.completion}%</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                background: statusConfig.bg, color: statusConfig.color, position: 'relative', top: 2 }}>
                {statusConfig.label}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, marginTop: 4 }}>
              {job.customer || '—'}
            </div>
            {job.revision && (
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                <span>Rev: {job.revision}</span>
              </div>
            )}
          </div>
          <span style={{ color: 'var(--text3)', fontSize: 17, flexShrink: 0, marginTop: 2 }}>{expanded ? '▲' : '▼'}</span>
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
          <Stat label={<>PO<span style={{textTransform:'none'}}>s</span> Issued</>} value={stats.poCount} />
          {job.collected > 0 && <Stat label="Collected" value={fmt(job.collected)} highlight />}
          {job.project_sell > 0 && <Stat label="Sell $" value={fmt(job.project_sell)} />}
          {job.project_sell > 0
            ? <Stat label="Target Cost" value={`${fmt(job.project_sell * (1 - targetMargin / 100))} (${targetMargin}%)`} tooltip={`Cost assuming ${targetMargin}% margin`} />
            : <Stat label="Target Margin" value={targetMargin + '%'} />
          }
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
            {[
              { key: 'equipment_groups', label: 'Equipment Groups' },
              { key: 'contacts',         label: 'Contacts' },
              { key: 'documents',        label: 'Documents' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: activeTab === tab.key ? 'var(--surface3)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--text)' : 'var(--text3)',
                  padding: '7px 14px', borderRadius: 0, fontWeight: activeTab === tab.key ? 600 : 400,
                  borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                  fontSize: 12,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'equipment_groups' && (
            isPartsJob
              ? <FlatItemsView job={job} onRefresh={onRefresh} />
              : <div style={{ padding: '10px 12px' }}>
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

          {activeTab === 'contacts' && (
            <ContactsTab job={job} onRefresh={onRefresh} />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab />
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

function Stat({ label, value, highlight, color, tooltip }) {
  return (
    <div title={tooltip || undefined} style={{
      background: 'var(--surface2)',
      border: `1px solid ${tooltip ? 'var(--text3)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '5px 9px',
      cursor: tooltip ? 'help' : 'default',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color || (highlight ? 'var(--accent)' : 'var(--text2)') }}>
        {value}
      </div>
    </div>
  )
}

function FinancialsTab({ job, stats }) {
  const fmt = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const totalCogs = (stats.totalCost || 0) + (job.estimated_install || 0) + (job.outbound_freight || 0) + (stats.totalFreight || 0)
  const budgetVariance = stats.totalBudgeted > 0 ? stats.totalCost - stats.totalBudgeted : null
  const target = job.target_margin ?? 35
  const equipBudget = job.project_sell > 0 ? job.project_sell * (1 - target / 100) : 0

  const rows = [
    { label: 'Project Sell Price', value: job.project_sell, bold: true, color: 'var(--accent)' },
    { label: `Target Cost (${target}%)`, value: equipBudget, dim: true },
    null,
    { label: 'Equipment (PO Actuals)', value: stats.totalCost },
    { label: 'Budgeted Equipment', value: stats.totalBudgeted, dim: true },
    budgetVariance !== null && { label: 'Budget Variance', value: budgetVariance, indent: true, color: budgetVariance > 0 ? 'var(--danger)' : 'var(--success)' },
    { label: 'Inland Freight', value: stats.totalFreight },
    { label: 'Est. Installation', value: job.estimated_install },
    { label: 'Outbound Freight', value: job.outbound_freight },
    { label: 'Total COGS', value: totalCogs, bold: true },
    null,
    { label: 'Down Payments Sent', value: stats.totalDownPayment },
    { label: 'Total PO Committed', value: stats.totalPoTotal, bold: true },
  ].filter(r => r !== undefined)

  return (
    <div style={{ padding: '12px 16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <tbody>
          {rows.map((row, i) => (
            row === null
              ? <tr key={i}><td colSpan={2} style={{ height: 8 }} /></tr>
              : <tr key={i} style={{ borderBottom: '1px solid var(--surface3)' }}>
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

const STATUS_LABELS = {
  not_started: 'Not Started', rfq_sent: 'RFQ Sent', quote_received: 'Quote Rcvd',
  po_issued: 'PO Issued', received: 'Received', invoiced: 'Invoiced',
}
const fmt$ = (n) => n ? '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'

function FlatItemsView({ job, onRefresh }) {
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const allItems = job.groups.flatMap(g => g.items)

  const ensureGroup = async () => {
    if (job.groups.length > 0) return job.groups[0].id
    const res = await fetch(`/api/jobs/${job.id}/groups`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Parts', order_index: 0 }),
    })
    const g = await res.json()
    return g.id
  }

  const handleSaveItem = async (data) => {
    if (editingItem) {
      await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
    } else {
      const groupId = await ensureGroup()
      await fetch(`/api/groups/${groupId}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
    }
    setShowItemModal(false)
    setEditingItem(null)
    onRefresh()
  }

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Delete this line item?')) return
    await fetch(`/api/items/${itemId}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        {allItems.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'var(--surface3)' }}>
                {['Description', 'Qty', 'Vendor', 'PO #', 'Est. Delivery', 'Cost $', 'Status', 'Rcvd', ''].map(h => (
                  <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allItems.map((item, idx) => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--surface3)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '5px 8px', color: 'var(--text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>{item.description || '—'}</td>
                  <td style={{ padding: '5px 8px', color: 'var(--text2)', textAlign: 'center' }}>{item.qty_ordered ?? item.qty_per_dwg ?? '—'}</td>
                  <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.vendor || '—'}</td>
                  <td style={{ padding: '5px 8px', color: item.po_number ? 'var(--success)' : 'var(--text3)', fontWeight: item.po_number ? 700 : 400, whiteSpace: 'nowrap' }}>{item.po_number || '—'}</td>
                  <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{item.estimated_delivery || '—'}</td>
                  <td style={{ padding: '5px 8px', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'right' }}>{fmt$(item.cost)}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                    <span className={`status-badge status-${item.status}`}>{STATUS_LABELS[item.status] || item.status}</span>
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontSize: 14 }}>{item.received ? '✅' : '⬜'}</td>
                  <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>
                    <button className="btn-icon" onClick={() => { setEditingItem(item); setShowItemModal(true) }}>✏️</button>
                    <button className="btn-icon" onClick={() => handleDeleteItem(item.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '18px 12px', textAlign: 'center', color: 'var(--text3)', fontSize: 12,
            border: '1px dashed var(--border)', borderRadius: 8, margin: '10px 12px' }}>
            No line items yet
          </div>
        )}
        <div style={{ padding: '6px 10px', borderTop: allItems.length > 0 ? '1px solid var(--surface3)' : 'none',
          display: 'flex' }}>
          <button className="btn-ghost btn-sm" onClick={() => { setEditingItem(null); setShowItemModal(true) }}>
            + Add Line Item
          </button>
        </div>
      </div>

      {showItemModal && (
        <ItemModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => { setShowItemModal(false); setEditingItem(null) }}
        />
      )}
    </div>
  )
}

const ROLES = [
  { value: 'customer',      label: 'Customer' },
  { value: 'site_contact',  label: 'Site Contact' },
  { value: 'internal_pm',   label: 'Internal PM' },
  { value: 'vendor',        label: 'Vendor' },
  { value: 'other',         label: 'Other' },
]

function ContactsTab({ job, onRefresh }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'customer', phone: '', email: '' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd = () => { setForm({ name: '', role: 'customer', phone: '', email: '' }); setAdding(true); setEditingId(null) }
  const openEdit = (c) => { setForm({ name: c.name, role: c.role, phone: c.phone, email: c.email }); setEditingId(c.id); setAdding(false) }
  const cancel = () => { setAdding(false); setEditingId(null) }

  const save = async () => {
    if (!form.name.trim()) return
    if (editingId) {
      await fetch(`/api/contacts/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch(`/api/jobs/${job.id}/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    cancel()
    onRefresh()
  }

  const remove = async (id) => {
    if (!confirm('Remove this contact?')) return
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  const contacts = job.contacts || []

  return (
    <div style={{ padding: '10px 12px' }}>
      {contacts.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '18px 12px', color: 'var(--text3)', fontSize: 12,
          border: '1px dashed var(--border)', borderRadius: 8, marginBottom: 8 }}>
          No contacts yet
        </div>
      )}

      {contacts.map(c => (
        editingId === c.id ? (
          <ContactForm key={c.id} form={form} set={set} onSave={save} onCancel={cancel} />
        ) : (
          <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            padding: '8px 10px', marginBottom: 6, background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{c.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20,
                  background: 'var(--surface3)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {ROLES.find(r => r.value === c.role)?.label || c.role}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap' }}>
                {c.phone && <span style={{ fontSize: 12, color: 'var(--text2)' }}>📞 {c.phone}</span>}
                {c.email && <span style={{ fontSize: 12, color: 'var(--text2)' }}>✉ {c.email}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              <button className="btn-icon" onClick={() => openEdit(c)} title="Edit">✏️</button>
              <button className="btn-icon" onClick={() => remove(c.id)} title="Remove">🗑️</button>
            </div>
          </div>
        )
      ))}

      {adding && <ContactForm form={form} set={set} onSave={save} onCancel={cancel} />}

      {!adding && editingId === null && (
        <button className="btn-ghost btn-sm" onClick={openAdd}
          style={{ marginTop: 4, width: '100%', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
          + Add Contact
        </button>
      )}
    </div>
  )
}

function ContactForm({ form, set, onSave, onCancel }) {
  return (
    <div style={{ padding: '10px', marginBottom: 8, background: 'var(--surface2)',
      border: '1px solid var(--accent)', borderRadius: 'var(--radius)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ fontSize: 11 }}>Name *</label>
          <input value={form.name} onChange={set('name')} placeholder="Full name" autoFocus />
        </div>
        <div>
          <label style={{ fontSize: 11 }}>Role</label>
          <select value={form.role} onChange={set('role')}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11 }}>Phone</label>
          <input value={form.phone} onChange={set('phone')} placeholder="(555) 000-0000" />
        </div>
        <div>
          <label style={{ fontSize: 11 }}>Email</label>
          <input value={form.email} onChange={set('email')} placeholder="name@company.com" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button className="btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-sm" onClick={onSave}>Save</button>
      </div>
    </div>
  )
}

function DocumentsTab() {
  return (
    <div style={{ padding: '20px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Documents coming soon</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
        Engineering drawings · Quotes · RFQs · POs · Invoices
      </div>
      <div style={{ display: 'inline-block', marginTop: 12, fontSize: 11,
        background: 'var(--surface2)', color: 'var(--text3)',
        padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
        File storage coming in Commit 7
      </div>
    </div>
  )
}
