import { useState } from 'react'
import Modal from './Modal.jsx'

const COMMON_GROUPS = [
  'Rotary Drum / Dryer Shell',
  'Burner System',
  'Baghouse / Dust Collection',
  'Blower / Fan System',
  'Conveyor System',
  'Structural Steel',
  'Electrical & Controls',
  'Piping & Ductwork',
  'Instrumentation',
  'Miscellaneous / Hardware',
]

export default function GroupModal({ group, onSave, onClose }) {
  const [form, setForm] = useState({
    name: group?.name || '',
    order_index: group?.order_index || 0,
  })

  return (
    <Modal
      title={group ? 'Edit Equipment Group' : 'Add Equipment Group'}
      onClose={onClose}
      onSave={() => onSave(form)}
      saveLabel={group ? 'Save' : 'Add Group'}
    >
      <div>
        <label>Group Name *</label>
        <input
          list="group-suggestions"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Burner System"
          autoFocus
        />
        <datalist id="group-suggestions">
          {COMMON_GROUPS.map(g => <option key={g} value={g} />)}
        </datalist>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Display Order</label>
        <input
          type="number"
          value={form.order_index}
          onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))}
          placeholder="0"
          style={{ width: 80 }}
        />
      </div>
    </Modal>
  )
}
