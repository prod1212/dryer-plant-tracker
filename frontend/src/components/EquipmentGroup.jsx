import { useState } from 'react'
import ItemModal from './ItemModal.jsx'

const STATUS_LABELS = {
  not_started: 'Not Started',
  rfq_sent: 'RFQ Sent',
  quote_received: 'Quote Rcvd',
  po_issued: 'PO Issued',
  received: 'Received',
  invoiced: 'Invoiced',
}

const fmt$ = (n) => n ? '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'

export default function EquipmentGroup({ group, onEdit, onDelete, onRefresh }) {
  const [expanded, setExpanded] = useState(true)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const handleSaveItem = async (data) => {
    if (editingItem) {
      await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
    } else {
      await fetch(`/api/groups/${group.id}/items`, {
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

  const totalCost = group.items.reduce((s, i) => s + (i.cost || 0), 0)

  return (
    <div style={{ marginBottom: 10, background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Group header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(e => !e)}
      >
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{expanded ? '▼' : '▶'}</span>
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1, color: 'var(--accent2)' }}>{group.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', position: 'relative', top: 1 }}>{group.items.length} items · {fmt$(totalCost)}</span>
          <div style={{ display: 'flex' }}>
            <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit() }}>✏️</button>
            <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete() }} style={{ marginLeft: -9 }}>🗑️</button>
          </div>
        </div>
      </div>

      {/* Line items table */}
      {expanded && (
        <div style={{ overflowX: 'auto', borderTop: '1px solid var(--border)' }}>
          {group.items.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'var(--surface3)' }}>
                  {['Drawing', 'Description', 'Qty', 'P&ID', 'Wks', 'Vendor', 'PO #', 'Est. Delivery', 'Cost $', 'Budgeted $', 'Frt $', 'DP%', 'Status', 'Rcvd', ''].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.items.map((item, idx) => (
                  <tr key={item.id} style={{ borderTop: '1px solid var(--surface3)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{item.drawing || '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>{item.description || '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', textAlign: 'center' }}>{item.qty_ordered ?? item.qty_per_dwg ?? '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{item.pid_number || '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', textAlign: 'center' }}>{item.weeks_lead ?? '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.vendor || '—'}</td>
                    <td style={{ padding: '5px 8px', color: item.po_number ? 'var(--success)' : 'var(--text3)', fontWeight: item.po_number ? 700 : 400, whiteSpace: 'nowrap' }}>{item.po_number || '—'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{item.estimated_delivery || '—'}</td>
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
            <div style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 12 }}>No line items yet.</div>
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
    </div>
  )
}
