import { useState } from 'react'
import ItemModal from './ItemModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'

const fmtDate = (str) => {
  if (!str) return '—'
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return '—'
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] + ' ' + d + ', ' + y
}

const STATUS_LABELS = {
  not_started: 'Not Started',
  rfq_sent: 'RFQ Sent',
  quote_received: 'Quote Rcvd',
  po_issued: 'PO Issued',
  received: 'Received',
  invoiced: 'Invoiced',
}

const fmt$ = (n) => n ? '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'

// section: { code, name, order_index }
// items:   array of item rows for this section on this job
export default function EquipmentGroup({ section, items, jobId, onRefresh }) {
  // Auto-collapse if section has no PO'd items
  const hasPOs = items.some(i => i.po_number)
  const [expanded, setExpanded] = useState(hasPOs)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const handleSaveItem = async (data) => {
    if (editingItem) {
      await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch(`/api/jobs/${jobId}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, section_code: section.code }),
      })
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

  const totalCost = items.reduce((s, i) => s + (i.cost || 0), 0)
  const isEmpty = items.length === 0

  return (
    <div style={{ marginBottom: 10, background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', opacity: isEmpty ? 0.55 : 1 }}>
      {/* Section header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(e => !e)}
      >
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{expanded ? '▼' : '▶'}</span>
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1, color: isEmpty ? 'var(--text3)' : 'var(--accent2)' }}>{section.name}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)', position: 'relative', top: 1 }}>
          {items.length > 0 ? `${items.length} item${items.length !== 1 ? 's' : ''} · ${fmt$(totalCost)}` : 'empty'}
        </span>
      </div>

      {/* Line items table */}
      {expanded && (
        <div style={{ overflowX: 'auto', borderTop: '1px solid var(--border)' }}>
          {items.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'var(--surface3)' }}>
                  {['Drawing', 'Description', 'Qty', 'P&ID', 'Wks', 'Vendor', 'PO #', 'Est. Delivery', 'Cost $', 'Budgeted $', 'Frt $', 'DP%', 'Status', 'Rcvd', ''].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} style={{ borderTop: '1px solid var(--surface3)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{item.drawing || '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>{item.description || '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', textAlign: 'center' }}>{item.qty_ordered ?? item.qty_per_dwg ?? '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{item.pid_number || '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', textAlign: 'center' }}>{item.weeks_lead ?? '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.vendor || '—'}</td>
                    <td style={{ padding: '5px 8px', color: item.po_number ? 'var(--success)' : 'var(--text3)', fontWeight: item.po_number ? 700 : 400, whiteSpace: 'nowrap' }}>{item.po_number || '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(item.estimated_delivery)}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'right' }}>{fmt$(item.cost)}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text3)', whiteSpace: 'nowrap', textAlign: 'right' }}>{fmt$(item.budgeted_cost)}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap', textAlign: 'right' }}>{fmt$(item.freight)}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', textAlign: 'center' }}>{item.dp_percent ? item.dp_percent + '%' : '—'}</td>
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
            <div style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 12 }}>No line items in this section.</div>
          )}
          <div style={{ padding: '6px 10px', borderTop: '1px solid var(--surface3)' }}>
            <button
              className="btn-ghost btn-sm"
              onClick={() => { setEditingItem(null); setShowItemModal(true) }}
            >
              + Add Line Item
            </button>
          </div>
        </div>
      )}

      {showItemModal && (
        <ItemModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => { setShowItemModal(false); setEditingItem(null) }}
        />
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
