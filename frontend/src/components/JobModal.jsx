import { useState } from 'react'
import Modal from './Modal.jsx'
import TypeSelect from './TypeSelect.jsx'


function CurrencyInput({ value, onChange, placeholder }) {
  const [display, setDisplay] = useState(
    value ? '$' + Number(value).toLocaleString('en-US') : ''
  )
  const [focused, setFocused] = useState(false)

  const handleFocus = () => {
    setFocused(true)
    setDisplay(value ? String(value) : '')
  }

  const handleBlur = () => {
    setFocused(false)
    const raw = parseFloat(display.replace(/[^0-9.]/g, ''))
    if (!isNaN(raw)) {
      onChange(raw)
      setDisplay('$' + raw.toLocaleString('en-US'))
    } else {
      onChange('')
      setDisplay('')
    }
  }

  const handleChange = (e) => {
    setDisplay(e.target.value)
    const raw = parseFloat(e.target.value.replace(/[^0-9.]/g, ''))
    if (!isNaN(raw)) onChange(raw)
  }

  return (
    <input
      value={focused ? display : (value ? '$' + Number(value).toLocaleString('en-US') : '')}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  )
}

export default function JobModal({ job, onSave, onClose }) {
  const [form, setForm] = useState({
    job_number:      job?.job_number      || '',
    customer:        job?.customer        || '',
    project_type:    job?.project_type    || 'frac_sand',
    job_status:      job?.job_status      || 'lead', // always defaults to lead on creation
    project_sell:    job?.project_sell    || '',
    customer_po:     job?.customer_po     || '',
    notes:           job?.notes           || '',
    // dashboard-only fields preserved on edit
    revision:           job?.revision           || '',
    estimated_install:  job?.estimated_install  || '',
    outbound_freight:   job?.outbound_freight   || '',
    collected:          job?.collected          || '',
    target_margin:      job?.target_margin      ?? 35,
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setCurrency = (k) => (val) => setForm(f => ({ ...f, [k]: val }))

  const isEdit = !!job

  return (
    <Modal
      title={isEdit ? 'Edit Job' : 'New Job'}
      onClose={onClose}
      onSave={() => onSave(form)}
      saveLabel={isEdit ? 'Save Changes' : 'Create Job'}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label>Job Number *</label>
          <input value={form.job_number} onChange={set('job_number')} placeholder="e.g. TI-1001" autoFocus />
        </div>
        <div>
          <label>Customer</label>
          <input value={form.customer} onChange={set('customer')} placeholder="Company name" />
        </div>
        <div>
          <label>Project Type</label>
          <TypeSelect value={form.project_type} onChange={(val) => setForm(f => ({ ...f, project_type: val }))} />
        </div>
        <div>
          <label>Quoted Price ($)</label>
          <CurrencyInput value={form.project_sell} onChange={setCurrency('project_sell')} placeholder="$0.00" />
        </div>
        <div>
          <label>Customer PO #</label>
          <input value={form.customer_po} onChange={set('customer_po')} placeholder="Customer's PO number" />
        </div>
        <div>
          <label>Target Margin</label>
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            {[25, 30, 35].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => setForm(f => ({ ...f, target_margin: pct }))}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 'var(--radius)',
                  border: form.target_margin === pct ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: form.target_margin === pct ? 'var(--accent)' : 'var(--surface2)',
                  color: form.target_margin === pct ? '#fff' : 'var(--text2)',
                  fontWeight: form.target_margin === pct ? 700 : 400,
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Extra fields shown only when editing */}
      {isEdit && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Additional Details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label>Revision</label>
              <input value={form.revision} onChange={set('revision')} placeholder="e.g. A" />
            </div>
            <div>
              <label>Est. Installation ($)</label>
              <CurrencyInput value={form.estimated_install} onChange={setCurrency('estimated_install')} placeholder="e.g. $25,000" />
            </div>
            <div>
              <label>Outbound Freight ($)</label>
              <CurrencyInput value={form.outbound_freight} onChange={setCurrency('outbound_freight')} placeholder="e.g. $8,000" />
            </div>
            <div>
              <label>Collected ($)</label>
              <CurrencyInput value={form.collected} onChange={setCurrency('collected')} placeholder="$0.00" />
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <label>Notes</label>
        <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Project notes..." />
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Attachments</label>
        <div style={{
          border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
          padding: '20px', textAlign: 'center',
          background: 'var(--surface2)',
        }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>📎</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Drag & drop files here</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
            Mass balances, RFQs, quotes, drawings...
          </div>
          <div style={{
            display: 'inline-block', marginTop: 10, fontSize: 11,
            background: 'var(--surface3)', color: 'var(--text3)',
            padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)',
          }}>
            File storage coming in a future update
          </div>
        </div>
      </div>
    </Modal>
  )
}
