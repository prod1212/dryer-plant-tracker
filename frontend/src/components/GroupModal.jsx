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
    </Modal>
  )
}
