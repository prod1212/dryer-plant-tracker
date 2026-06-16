import { useState } from 'react'

const DEFAULT_MILESTONES = [
  'Contract Signed',
  'Drawings Released',
  'Equipment Orders Placed',
  'Delivery to Site',
  'Commissioning / Startup',
]

export default function MilestonePanel({ job, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', target_date: '', completed_date: '' })

  const handleAdd = async () => {
    if (!form.name) return
    await fetch(`/api/jobs/${job.id}/milestones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, order_index: job.milestones.length }),
    })
    setForm({ name: '', target_date: '', completed_date: '' })
    setShowAdd(false)
    onRefresh()
  }

  const handleToggleComplete = async (m) => {
    await fetch(`/api/milestones/${m.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...m,
        completed_date: m.completed_date ? '' : new Date().toISOString().split('T')[0],
      }),
    })
    onRefresh()
  }

  const handleDelete = async (id) => {
    await fetch(`/api/milestones/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  const completedCount = job.milestones.filter(m => m.completed_date).length
  const totalCount = job.milestones.length

  return (
    <div style={{ padding: '12px 14px' }}>
      {totalCount > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'var(--text3)' }}>
            <span>Milestones</span>
            <span>{completedCount}/{totalCount} complete</span>
          </div>
          <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: totalCount ? (completedCount / totalCount * 100) + '%' : 0, height: '100%', background: 'var(--success)', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {job.milestones.length === 0 && !showAdd && (
        <div style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 10 }}>No milestones added yet.</div>
      )}

      {job.milestones.map(m => (
        <div key={m.id} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
          borderBottom: '1px solid var(--surface3)',
        }}>
          <input
            type="checkbox"
            checked={!!m.completed_date}
            onChange={() => handleToggleComplete(m)}
            style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--success)' }}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: m.completed_date ? 'var(--text3)' : 'var(--text)', textDecoration: m.completed_date ? 'line-through' : 'none' }}>
              {m.name}
            </span>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
              {m.target_date && <span>Target: {m.target_date}</span>}
              {m.completed_date && <span style={{ marginLeft: 8, color: 'var(--success)' }}>✓ {m.completed_date}</span>}
            </div>
          </div>
          <button className="btn-icon" onClick={() => handleDelete(m.id)}>🗑️</button>
        </div>
      ))}

      {showAdd ? (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label>Milestone Name</label>
            <input
              list="milestone-suggestions"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Drawings Released"
            />
            <datalist id="milestone-suggestions">
              {DEFAULT_MILESTONES.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label>Target Date</label>
              <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
            </div>
            <div>
              <label>Completed Date</label>
              <input type="date" value={form.completed_date} onChange={e => setForm(f => ({ ...f, completed_date: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary btn-sm" onClick={handleAdd}>Add</button>
            <button className="btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn-ghost btn-sm" onClick={() => setShowAdd(true)} style={{ marginTop: 8 }}>+ Add Milestone</button>
      )}
    </div>
  )
}
