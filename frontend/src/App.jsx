import { useState, useEffect, useCallback } from 'react'
import Board from './components/Board.jsx'
import Dashboard from './components/Dashboard.jsx'
import JobModal from './components/JobModal.jsx'
import JobDrawer from './components/JobDrawer.jsx'
import ConfirmModal from './components/ConfirmModal.jsx'

const API = '/api'

export default function App() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [drawerJobId, setDrawerJobId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [view, setView] = useState('board') // 'board' | 'dashboard'

  const fetchJobs = useCallback(async () => {
    const res = await fetch(`${API}/jobs`)
    const data = await res.json()
    setJobs(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const handleSaveJob = async (jobData) => {
    if (editingJob) {
      await fetch(`${API}/jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      })
    } else {
      await fetch(`${API}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      })
    }
    setShowJobModal(false)
    setEditingJob(null)
    fetchJobs()
  }

  const handleDeleteJob = (jobId, onConfirmed) => {
    setPendingDelete({
      message: 'Delete this job and all its data? This cannot be undone.',
      action: async () => {
        await fetch(`${API}/jobs/${jobId}`, { method: 'DELETE' })
        fetchJobs()
        if (onConfirmed) onConfirmed()
      },
    })
  }

  const handleEditJob = (job) => {
    setEditingJob(job)
    setShowJobModal(true)
  }

  const drawerJob = drawerJobId ? jobs.find(j => j.id === drawerJobId) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 56, background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🏭</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Dryer Plant Project Tracker</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Frac Sand · Contaminated Soil · Concrete Aggregate</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: 3, gap: 2 }}>
            {[['board', '📋 Board'], ['dashboard', '📊 Dashboard']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                style={{
                  padding: '4px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                  borderRadius: 'calc(var(--radius) - 2px)', transition: 'all 0.15s',
                  background: view === key ? 'var(--accent)' : 'transparent',
                  color: view === key ? '#000' : 'var(--text3)',
                }}
              >{label}</button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
          <button className="btn-primary" onClick={() => { setEditingJob(null); setShowJobModal(true) }}>
            + New Job
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text3)' }}>
          Loading...
        </div>
      ) : view === 'board' ? (
        <Board
          jobs={jobs}
          onEditJob={handleEditJob}
          onDeleteJob={handleDeleteJob}
          onRefresh={fetchJobs}
          onOpenDrawer={(job) => setDrawerJobId(job.id)}
        />
      ) : (
        <Dashboard />
      )}

      {showJobModal && (
        <JobModal
          job={editingJob}
          onSave={handleSaveJob}
          onClose={() => { setShowJobModal(false); setEditingJob(null) }}
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

      {drawerJob && (
        <JobDrawer
          job={drawerJob}
          onClose={() => setDrawerJobId(null)}
          onEdit={() => {
            handleEditJob(drawerJob)
            setDrawerJobId(null)
          }}
          onDelete={() => handleDeleteJob(drawerJob.id, () => setDrawerJobId(null))}
          onRefresh={fetchJobs}
        />
      )}
    </div>
  )
}
