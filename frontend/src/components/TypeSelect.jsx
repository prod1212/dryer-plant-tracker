import { useState, useRef, useEffect } from 'react'

export const PROJECT_TYPES = [
  { value: 'frac_sand',  label: 'Frac Sand',          color: '#f97316' },
  { value: 'soil',       label: 'Soil Remediation',    color: '#22c55e' },
  { value: 'aggregate',  label: 'Concrete Aggregate',  color: '#3b82f6' },
  { value: 'parts',      label: 'Parts Order',         color: '#a855f7' },
  { value: 'other',      label: 'Other',               color: '#64748b' },
]

export default function TypeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const ref = useRef(null)
  const selected = PROJECT_TYPES.find(t => t.value === value) || PROJECT_TYPES[0]

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger — use onMouseDown so we control toggle before focus fires */}
      <div
        onMouseDown={(e) => {
          e.preventDefault() // prevents the focus event from firing on click,
                             // so only ONE thing opens/closes the dropdown
          setOpen(o => !o)
        }}
        onKeyDown={(e) => {
          const idx = PROJECT_TYPES.findIndex(t => t.value === value)
          if (e.key === 'ArrowDown') { e.preventDefault(); onChange(PROJECT_TYPES[Math.min(idx + 1, PROJECT_TYPES.length - 1)].value) }
          if (e.key === 'ArrowUp')   { e.preventDefault(); onChange(PROJECT_TYPES[Math.max(idx - 1, 0)].value) }
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) }
          if (e.key === 'Escape') { setOpen(false) }
        }}
        tabIndex={0}
        role="combobox"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface2)',
          border: `1px solid ${focused ? 'var(--accent2)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '7px 10px', cursor: 'pointer',
          userSelect: 'none', outline: 'none',
        }}
        onFocus={() => { setFocused(true); setOpen(true) }}
        onBlur={(e) => {
          setFocused(false)
          // Only close if focus moved outside the whole component
          if (!ref.current?.contains(e.relatedTarget)) setOpen(false)
        }}
      >
        <span style={{ width: 3, height: 14, borderRadius: 2, background: selected.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{selected.label}</span>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>▼</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', zIndex: 200, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {PROJECT_TYPES.map(t => (
            <div
              key={t.value}
              // onMouseDown instead of onClick so it fires before the trigger's onBlur closes the list
              onMouseDown={(e) => { e.preventDefault(); onChange(t.value); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', cursor: 'pointer',
                background: t.value === value ? 'var(--surface3)' : 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
              onMouseLeave={e => e.currentTarget.style.background = t.value === value ? 'var(--surface3)' : 'transparent'}
            >
              <span style={{ width: 3, height: 16, borderRadius: 2, background: t.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{t.label}</span>
              {t.value === value && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
