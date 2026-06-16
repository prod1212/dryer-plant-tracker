import { useState } from 'react'
import Modal from './Modal.jsx'

const STATUSES = [
  { value: 'not_started',    label: 'Not Started' },
  { value: 'rfq_sent',       label: 'RFQ Sent' },
  { value: 'quote_received', label: 'Quote Received' },
  { value: 'po_issued',      label: 'PO Issued' },
  { value: 'received',       label: 'Received' },
  { value: 'invoiced',       label: 'Invoiced' },
]

export default function ItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    drawing: item?.drawing || '',
    description: item?.description || '',
    qty_per_dwg: item?.qty_per_dwg || 1,
    pid_number: item?.pid_number || '',
    weeks_lead: item?.weeks_lead || '',
    qty_ordered: item?.qty_ordered || '',
    vendor: item?.vendor || '',
    vendor_part_no: item?.vendor_part_no || '',
    rfq_date: item?.rfq_date || '',
    po_number: item?.po_number || '',
    date_ordered: item?.date_ordered || '',
    ship_to: item?.ship_to || '',
    estimated_delivery: item?.estimated_delivery || '',
    received: item?.received ? true : false,
    ship_list: item?.ship_list || '',
    cost: item?.cost || '',
    budgeted_cost: item?.budgeted_cost || '',
    dp_percent: item?.dp_percent || '',
    down_payment: item?.down_payment || '',
    freight: item?.freight || '',
    po_total: item?.po_total || '',
    status: item?.status || 'not_started',
    notes: item?.notes || '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const Section = ({ title }) => (
    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginTop: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
    </div>
  )

  return (
    <Modal
      title={item ? 'Edit Line Item' : 'Add Line Item'}
      onClose={onClose}
      onSave={() => onSave(form)}
      saveLabel={item ? 'Save Changes' : 'Add Item'}
      wide
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <Section title="Item Info" />
        <div style={{ gridColumn: '1 / 3' }}>
          <label>Description *</label>
          <input value={form.description} onChange={set('description')} placeholder="e.g. Rotary Drum 8x40" autoFocus />
        </div>
        <div>
          <label>Drawing #</label>
          <input value={form.drawing} onChange={set('drawing')} placeholder="DWG-001" />
        </div>
        <div>
          <label>P&ID #</label>
          <input value={form.pid_number} onChange={set('pid_number')} />
        </div>
        <div>
          <label>Qty / Dwg</label>
          <input type="number" value={form.qty_per_dwg} onChange={set('qty_per_dwg')} />
        </div>
        <div>
          <label>Lead Time (wks)</label>
          <input type="number" value={form.weeks_lead} onChange={set('weeks_lead')} />
        </div>

        <Section title="Procurement" />
        <div>
          <label>Status</label>
          <select value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label>Vendor</label>
          <input value={form.vendor} onChange={set('vendor')} placeholder="Vendor name" />
        </div>
        <div>
          <label>Vendor Part #</label>
          <input value={form.vendor_part_no} onChange={set('vendor_part_no')} />
        </div>
        <div>
          <label>RFQ Date</label>
          <input type="date" value={form.rfq_date} onChange={set('rfq_date')} />
        </div>
        <div>
          <label>PO Number</label>
          <input value={form.po_number} onChange={set('po_number')} placeholder="PO-XXXXX" />
        </div>
        <div>
          <label>Date Ordered</label>
          <input type="date" value={form.date_ordered} onChange={set('date_ordered')} />
        </div>
        <div>
          <label>Qty Ordered</label>
          <input type="number" value={form.qty_ordered} onChange={set('qty_ordered')} />
        </div>
        <div>
          <label>Ship To</label>
          <input value={form.ship_to} onChange={set('ship_to')} placeholder="Destination" />
        </div>
        <div>
          <label>Est. Delivery</label>
          <input type="date" value={form.estimated_delivery} onChange={set('estimated_delivery')} />
        </div>

        <Section title="Costs" />
        <div>
          <label>Budgeted Cost ($)</label>
          <input type="number" value={form.budgeted_cost} onChange={set('budgeted_cost')} placeholder="0" />
        </div>
        <div>
          <label>Actual Cost ($)</label>
          <input type="number" value={form.cost} onChange={set('cost')} placeholder="0" />
        </div>
        <div>
          <label>Down Payment %</label>
          <input type="number" value={form.dp_percent} onChange={set('dp_percent')} placeholder="0" min="0" max="100" />
        </div>
        <div>
          <label>Down Payment ($)</label>
          <input type="number" value={form.down_payment} onChange={set('down_payment')} placeholder="0" />
        </div>
        <div>
          <label>Freight ($)</label>
          <input type="number" value={form.freight} onChange={set('freight')} placeholder="0" />
        </div>
        <div>
          <label>PO Total ($)</label>
          <input type="number" value={form.po_total} onChange={set('po_total')} placeholder="0" />
        </div>

        <Section title="Delivery" />
        <div>
          <label>Ship List</label>
          <input value={form.ship_list} onChange={set('ship_list')} placeholder="Shipping list ref" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
          <input type="checkbox" id="rcvd" checked={form.received} onChange={set('received')} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--success)' }} />
          <label htmlFor="rcvd" style={{ margin: 0, textTransform: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>Received</label>
        </div>

        <Section title="Notes" />
        <div style={{ gridColumn: '1 / -1' }}>
          <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Additional notes..." />
        </div>
      </div>
    </Modal>
  )
}
