import { useState, useEffect, useCallback } from 'react'
import Board from './components/Board.jsx'
import JobModal from './components/JobModal.jsx'

const API = '/api'

export default function App() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)

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

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Delete this job and all its data?')) return
    await fetch(`${API}/jobs/${jobId}`, { method: 'DELETE' })
    fetchJobs()
  }

  const handleEditJob = (job) => {
    setEditingJob(job)
    setShowJobModal(true)
  }

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
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{jobs.length} active job{jobs.length !== 1 ? 's' : ''}</span>
          <button className="btn-primary" onClick={() => { setEditingJob(null); setShowJobModal(true) }}>
            + New Job
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text3)' }}>
          Loading...
        </div>
      ) : (
        <Board
          jobs={jobs}
          onEditJob={handleEditJob}
          onDeleteJob={handleDeleteJob}
          onRefresh={fetchJobs}
        />
      )}

      {showJobModal && (
        <JobModal
          job={editingJob}
          onSave={handleSaveJob}
          onClose={() => { setShowJobModal(false); setEditingJob(null) }}
        />
      )}
    </div>
  )
}
