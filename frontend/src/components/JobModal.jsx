import { useState } from 'react'
import Modal from './Modal.jsx'

export default function JobModal({ job, onSave, onClose }) {
  const [form, setForm] = useState({
    job_number: job?.job_number || '',
    customer: job?.customer || '',
    revision: job?.revision || '',
    pcr: job?.pcr || '',
    project_sell: job?.project_sell || '',
    estimated_install: job?.estimated_install || '',
    outbound_freight: job?.outbound_freight || '',
    notes: job?.notes || '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Modal title={job ? 'Edit Job' : 'New Job'} onClose={onClose} onSave={() => onSave(form)} saveLabel={job ? 'Save Changes' : 'Create Job'}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label>Job Number *</label>
          <input value={form.job_number} onChange={set('job_number')} placeholder="e.g. 2024-001" autoFocus />
        </div>
        <div>
          <label>Customer</label>
          <input value={form.customer} onChange={set('customer')} placeholder="Company name" />
        </div>
        <div>
          <label>Revision</label>
          <input value={form.revision} onChange={set('revision')} placeholder="e.g. A" />
        </div>
        <div>
          <label>Project Sell Price ($)</label>
          <input type="number" value={form.project_sell} onChange={set('project_sell')} placeholder="0" />
        </div>
        <div>
          <label>Est. Installation Cost ($)</label>
          <input type="number" value={form.estimated_install} onChange={set('estimated_install')} placeholder="0" />
        </div>
        <div>
          <label>Outbound Freight ($)</label>
          <input type="number" value={form.outbound_freight} onChange={set('outbound_freight')} placeholder="0" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Notes</label>
        <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Project notes..." />
      </div>
    </Modal>
  )
}
