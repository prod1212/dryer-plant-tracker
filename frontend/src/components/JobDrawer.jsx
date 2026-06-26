import { useEffect, useState } from 'react'
import EquipmentGroup from './EquipmentGroup.jsx'
import ItemModal from './ItemModal.jsx'
import DrawerSchedule from './DrawerSchedule.jsx'
import ConfirmModal from './ConfirmModal.jsx'

const fmtDate = (str) => {
  if (!str) return '—'
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return '—'
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] + ' ' + d + ', ' + y
}

const fmt = (n) => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

const fmtDateShort = (str) => {
  if (!str) return null
  const parts = str.split('-').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const [y, m, d] = parts
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] +
    ' ' + d + ', ' + y
}

const TYPE_CONFIG = {
  frac_sand:  { label: 'Frac Sand',         color: '#f97316' },
  soil:       { label: 'Soil Remediation',   color: '#22c55e' },
  aggregate:  { label: 'Concrete Aggregate', color: '#3b82f6' },
  parts:      { label: 'Parts Order',        color: '#a855f7' },
  other:      { label: 'Other',              color: '#64748b' },
}

const STATUS_CONFIG = {
  lead:     { label: 'Lead',     bg: '#1e3a5f', color: '#60a5fa' },
  active:   { label: 'Active',   bg: '#14532d', color: '#86efac' },
  on_hold:  { label: 'On Hold',  bg: '#3f2c1a', color: '#fbbf24' },
  complete: { label: 'Complete', bg: '#1e293b', color: '#94a3b8' },
}

const ROLES = [
  { value: 'customer',     label: 'Customer' },
  { value: 'site_contact', label: 'Site Contact' },
  { value: 'internal_pm',  label: 'Internal PM' },
  { value: 'vendor',       label: 'Vendor' },
  { value: 'other',        label: 'Other' },
]

export default function JobDrawer({ job, onClose, onEdit, onDelete, onRefresh }) {
  const [activeTab, setActiveTab] = useState('equipment_groups')
  const [visible, setVisible] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const typeConfig = TYPE_CONFIG[job.project_type] || TYPE_CONFIG.other
  const statusConfig = STATUS_CONFIG[job.job_status] || STATUS_CONFIG.lead
  const { stats } = job
  const isPartsJob = /^P/i.test(job.job_number)
  const targetMargin = job.target_margin ?? 35
  const equipBudget = job.project_sell > 0 ? job.project_sell * (1 - targetMargin / 100) : 0

  // Spend bar calculations
  const allItems = job.sections.flatMap(s => s.items)
  const actualCost     = allItems.filter(i => ['received','invoiced'].includes(i.status)).reduce((s, i) => s + (i.cost || 0), 0)
  const poCommitted    = allItems.filter(i => i.status === 'po_issued').reduce((s, i) => s + (i.cost || 0), 0)
  const totalCommitted = actualCost + poCommitted
  const sell = job.project_sell || 0
  const spendActualPct    = sell > 0 ? Math.min(100, (actualCost    / sell) * 100) : 0
  const spendCommittedPct = sell > 0 ? Math.min(100, (totalCommitted / sell) * 100) : 0

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleClose = () => { setVisible(false); setTimeout(onClose, 250) }

  return (
    <>
      {/* Overlay */}
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 500, transition: 'opacity 0.25s', opacity: visible ? 1 : 0,
      }} />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '72%', maxWidth: 1100,
        background: 'var(--bg)', zIndex: 501,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        borderLeft: `3px solid ${typeConfig.color}`,
      }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: typeConfig.color }}>{job.job_number}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: typeConfig.color + '22', color: typeConfig.color, border: `1px solid ${typeConfig.color}55` }}>
                  {typeConfig.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: statusConfig.bg, color: statusConfig.color }}>
                  {statusConfig.label}
                </span>
                <span className={`tag tag-${stats.completion}`}>{stats.completionPct}% Complete</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>{job.customer || '—'}</div>
              {job.revision && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  <span>Rev: {job.revision}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn-secondary btn-sm" onClick={onEdit}>✏️ Edit</button>
              <button className="btn-danger btn-sm" onClick={onDelete}>🗑️</button>
              <button className="btn-ghost" onClick={handleClose} style={{ fontSize: 20, padding: '4px 8px' }}>×</button>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 24, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {job.project_sell > 0 && <BigStat label="Sell Price" value={fmt(job.project_sell)} color={typeConfig.color} />}
            {job.customer_po && <BigStat label="Cust PO" value={job.customer_po} />}
            <BigStat label="POs Issued" value={stats.poCount} />
            {job.collected > 0 && <BigStat label="Collected" value={fmt(job.collected)} color="var(--accent)" />}
            {job.project_sell > 0 && (
              <BigStat label={`Target Cost (${targetMargin}%)`} value={fmt(equipBudget)}
                tooltip={`Cost assuming ${targetMargin}% margin`} />
            )}
            {job.estimated_install > 0 && <BigStat label="Est. Install" value={fmt(job.estimated_install)} />}
            {job.outbound_freight > 0 && <BigStat label="Outbound Freight" value={fmt(job.outbound_freight)} />}
            {/* Gate status */}
            {isPartsJob ? (
              <BigStat
                label="Customer PO"
                value={job.customer_po_received
                  ? (fmtDateShort(job.customer_po_received_date) || 'Received')
                  : 'Pending'}
                color={job.customer_po_received ? '#059669' : '#B45309'}
                tooltip={job.customer_po_received ? 'PO received — items can be ordered' : 'Awaiting customer PO — items cannot be ordered yet'}
              />
            ) : (
              <BigStat
                label="Contract"
                value={job.contract_signed
                  ? (fmtDateShort(job.contract_signed_date) || 'Signed')
                  : 'Pending'}
                color={job.contract_signed ? '#059669' : '#B45309'}
                tooltip={job.contract_signed ? 'Contract signed — POs can be released' : 'Contract not yet signed — POs cannot be released'}
              />
            )}
            {job.target_delivery && (
              <BigStat label="Target Delivery" value={fmtDateShort(job.target_delivery) || job.target_delivery} />
            )}
          </div>

          {/* Spend bar */}
          {sell > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost vs. Contract Value</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{Math.round(spendCommittedPct)}%</span>
                  {' committed of '}<span style={{ fontWeight: 600, color: typeConfig.color }}>{fmt(sell)}</span>
                </span>
              </div>
              <div style={{ display: 'flex', height: 24, borderRadius: 3, overflow: 'hidden',
                background: 'var(--surface3)', border: '1px solid var(--border)' }}>
                <div style={{ width: spendActualPct + '%', background: '#22c55e', flexShrink: 0,
                  transition: 'width 0.4s', display: 'flex', alignItems: 'center', paddingLeft: 6,
                  borderRight: spendActualPct > 0 ? '1px solid rgba(0,0,0,0.2)' : 'none' }}>
                  {spendActualPct >= 10 && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
                      Invoiced {Math.round(spendActualPct)}%
                    </span>
                  )}
                </div>
                <div style={{ width: Math.max(0, spendCommittedPct - spendActualPct) + '%', background: '#f97316',
                  flexShrink: 0, transition: 'width 0.4s', display: 'flex', alignItems: 'center', paddingLeft: 6,
                  borderRight: (spendCommittedPct - spendActualPct) > 0 ? '1px solid rgba(0,0,0,0.2)' : 'none' }}>
                  {(spendCommittedPct - spendActualPct) >= 8 && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
                      PO'd {Math.round(spendCommittedPct - spendActualPct)}%
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                  {(100 - spendCommittedPct) >= 8 && (
                    <span style={{ fontSize: 9, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {fmt(Math.max(0, sell - totalCommitted))} uncommitted
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, paddingLeft: 24 }}>
          {[
            { key: 'equipment_groups', label: 'Equipment Groups' },
            { key: 'schedule',         label: 'Schedule' },
            { key: 'contacts',         label: 'Contacts' },
            { key: 'documents',        label: 'Documents' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background: 'transparent', padding: '10px 18px', borderRadius: 0,
              color: activeTab === tab.key ? 'var(--text)' : 'var(--text3)',
              fontWeight: activeTab === tab.key ? 700 : 400, fontSize: 13,
              borderBottom: activeTab === tab.key ? `2px solid ${typeConfig.color}` : '2px solid transparent',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {activeTab === 'equipment_groups' && (
            isPartsJob
              ? <DrawerFlatItems job={job} onRefresh={onRefresh} />
              : <>
                  {job.sections.map(section => (
                    <EquipmentGroup
                      key={section.code}
                      section={section}
                      items={section.items}
                      jobId={job.id}
                      onRefresh={onRefresh}
                    />
                  ))}
                </>
          )}

          {activeTab === 'schedule' && <DrawerSchedule job={job} />}
          {activeTab === 'contacts' && <DrawerContacts job={job} onRefresh={onRefresh} />}
          {activeTab === 'documents' && <DrawerDocuments />}
        </div>
      </div>

      {pendingDelete && (
        <ConfirmModal
          message={pendingDelete.message}
          confirmLabel={pendingDelete.confirmLabel}
          onConfirm={async () => { await pendingDelete.action(); setPendingDelete(null) }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  )
}

function BigStat({ label, value, color, tooltip }) {
  return (
    <div title={tooltip || undefined} style={{ cursor: tooltip ? 'help' : 'default' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}

const STATUS_LABELS = {
  not_started: 'Not Started', rfq_sent: 'RFQ Sent', quote_received: 'Quote Rcvd',
  po_issued: 'PO Issued', received: 'Received', invoiced: 'Invoiced',
}
const fmt$ = (n) => n ? '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'

function DrawerFlatItems({ job, onRefresh }) {
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const allItems = job.sections.flatMap(s => s.items)

  const handleSaveItem = async (data) => {
    if (editingItem) {
      await fetch(`/api/items/${editingItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    } else {
      await fetch(`/api/jobs/${job.id}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    setShowItemModal(false)
    setEditingItem(null)
    onRefresh()
  }

  const handleDeleteItem = (itemId) => {
    setPendingDelete({
      message: 'Delete this line item?',
      action: async () => { await fetch(`/api/items/${itemId}`, { method: 'DELETE' }); onRefresh() },
    })
  }

  return (
    <div>
      {allItems.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface3)' }}>
              {['Description', 'Qty', 'Vendor', 'PO #', 'Est. Delivery', 'Cost $', 'Status', 'Rcvd', ''].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allItems.map((item, idx) => (
              <tr key={item.id} style={{ borderTop: '1px solid var(--surface3)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '6px 10px', color: 'var(--text)', maxWidth: 220 }}>{item.description || '—'}</td>
                <td style={{ padding: '6px 10px', color: 'var(--text2)', textAlign: 'center' }}>{item.qty_ordered ?? item.qty_per_dwg ?? '—'}</td>
                <td style={{ padding: '6px 10px', color: 'var(--text2)' }}>{item.vendor || '—'}</td>
                <td style={{ padding: '6px 10px', color: item.po_number ? 'var(--success)' : 'var(--text3)', fontWeight: item.po_number ? 700 : 400 }}>{item.po_number || '—'}</td>
                <td style={{ padding: '6px 10px', color: 'var(--text2)' }}>{fmtDate(item.estimated_delivery)}</td>
                <td style={{ padding: '6px 10px', color: 'var(--accent)', fontWeight: 600, textAlign: 'right' }}>{fmt$(item.cost)}</td>
                <td style={{ padding: '6px 10px' }}><span className={`status-badge status-${item.status}`}>{STATUS_LABELS[item.status] || item.status}</span></td>
                <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: 14 }}>{item.received ? '✅' : '⬜'}</td>
                <td style={{ padding: '4px 6px' }}>
                  <button className="btn-icon" onClick={() => { setEditingItem(item); setShowItemModal(true) }}>✏️</button>
                  <button className="btn-icon" onClick={() => handleDeleteItem(item.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 14 }}>No line items yet.</div>
      )}
      <button className="btn-ghost btn-sm" onClick={() => { setEditingItem(null); setShowItemModal(true) }}
        style={{ marginTop: 10, border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '8px 16px' }}>
        + Add Line Item
      </button>
      {showItemModal && (
        <ItemModal item={editingItem} onSave={handleSaveItem} onClose={() => { setShowItemModal(false); setEditingItem(null) }} />
      )}
      {pendingDelete && (
        <ConfirmModal
          message={pendingDelete.message}
          confirmLabel={pendingDelete.confirmLabel}
          onConfirm={async () => { await pendingDelete.action(); setPendingDelete(null) }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}

function DrawerContacts({ job, onRefresh }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'customer', phone: '', email: '' })
  const [pendingDelete, setPendingDelete] = useState(null)
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
    cancel(); onRefresh()
  }

  const remove = (id) => {
    setPendingDelete({
      message: 'Remove this contact?',
      confirmLabel: 'Remove',
      action: async () => { await fetch(`/api/contacts/${id}`, { method: 'DELETE' }); onRefresh() },
    })
  }

  const contacts = job.contacts || []

  return (
    <div style={{ maxWidth: 600 }}>
      {contacts.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 14,
          border: '1px dashed var(--border)', borderRadius: 8, marginBottom: 12 }}>
          No contacts yet
        </div>
      )}
      {contacts.map(c => (
        editingId === c.id
          ? <DrawerContactForm key={c.id} form={form} set={set} onSave={save} onCancel={cancel} />
          : <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '10px 14px', marginBottom: 8, background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{c.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20,
                    background: 'var(--surface3)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {ROLES.find(r => r.value === c.role)?.label || c.role}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  {c.phone && <span style={{ fontSize: 13, color: 'var(--text2)' }}>📞 {c.phone}</span>}
                  {c.email && <span style={{ fontSize: 13, color: 'var(--text2)' }}>✉ {c.email}</span>}
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <button className="btn-icon" onClick={() => openEdit(c)}>✏️</button>
                <button className="btn-icon" onClick={() => remove(c.id)} style={{ marginLeft: -9 }}>🗑️</button>
              </div>
            </div>
      ))}
      {adding && <DrawerContactForm form={form} set={set} onSave={save} onCancel={cancel} />}
      {!adding && editingId === null && (
        <button className="btn-ghost btn-sm" onClick={openAdd}
          style={{ marginTop: 4, border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '8px 16px' }}>
          + Add Contact
        </button>
      )}
      {pendingDelete && (
        <ConfirmModal
          message={pendingDelete.message}
          confirmLabel={pendingDelete.confirmLabel}
          onConfirm={async () => { await pendingDelete.action(); setPendingDelete(null) }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}

function DrawerContactForm({ form, set, onSave, onCancel }) {
  return (
    <div style={{ padding: '12px', marginBottom: 10, background: 'var(--surface2)',
      border: '1px solid var(--accent)', borderRadius: 'var(--radius)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div><label>Name *</label><input value={form.name} onChange={set('name')} placeholder="Full name" autoFocus /></div>
        <div><label>Role</label>
          <select value={form.role} onChange={set('role')}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div><label>Phone</label><input value={form.phone} onChange={set('phone')} placeholder="(555) 000-0000" /></div>
        <div><label>Email</label><input value={form.email} onChange={set('email')} placeholder="name@company.com" /></div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-sm" onClick={onSave}>Save</button>
      </div>
    </div>
  )
}

function DrawerDocuments() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Documents coming soon</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.8 }}>
        Engineering drawings · Quotes · RFQs · POs · Invoices
      </div>
      <div style={{ display: 'inline-block', marginTop: 14, fontSize: 12,
        background: 'var(--surface2)', color: 'var(--text3)',
        padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>
        File storage coming in Commit 7
      </div>
    </div>
  )
}
