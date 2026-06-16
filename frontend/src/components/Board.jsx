import JobCard from './JobCard.jsx'

const COLUMNS = [
  { pct: 0,   label: '0%',   sub: 'Not Started' },
  { pct: 25,  label: '25%',  sub: 'In Progress' },
  { pct: 50,  label: '50%',  sub: 'Halfway' },
  { pct: 75,  label: '75%',  sub: 'Nearly Done' },
  { pct: 100, label: '100%', sub: 'Complete' },
]

export default function Board({ jobs, onEditJob, onDeleteJob, onRefresh }) {
  return (
    <div style={{
      display: 'flex', gap: 0, flex: 1, overflow: 'hidden',
    }}>
      {COLUMNS.map((col, ci) => {
        const colJobs = jobs.filter(j => j.stats.completion === col.pct)
        return (
          <div key={col.pct} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            borderRight: ci < COLUMNS.length - 1 ? '1px solid var(--border)' : 'none',
            minWidth: 0,
          }}>
            {/* Column header */}
            <div style={{
              padding: '10px 14px', background: 'var(--surface)',
              borderBottom: '2px solid ' + colColor(col.pct),
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: colColor(col.pct) }}>{col.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>{col.sub}</span>
                </div>
                <span style={{
                  background: 'var(--surface2)', color: 'var(--text3)',
                  fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                }}>
                  {colJobs.length}
                </span>
              </div>
              <ColumnProgress pct={col.pct} color={colColor(col.pct)} />
            </div>

            {/* Job cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
              {colJobs.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '24px 12px',
                  color: 'var(--text3)', fontSize: 12,
                  border: '1px dashed var(--border)', borderRadius: 8, marginTop: 4,
                }}>
                  No jobs
                </div>
              ) : (
                colJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onEdit={() => onEditJob(job)}
                    onDelete={() => onDeleteJob(job.id)}
                    onRefresh={onRefresh}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ColumnProgress({ pct, color }) {
  return (
    <div style={{ marginTop: 6, height: 3, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', background: color, transition: 'width 0.3s' }} />
    </div>
  )
}

function colColor(pct) {
  if (pct === 0) return '#475569'
  if (pct === 25) return '#3b82f6'
  if (pct === 50) return '#eab308'
  if (pct === 75) return '#f97316'
  return '#22c55e'
}
