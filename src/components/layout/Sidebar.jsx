import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

const NAV = [
  { key: 'setup',      label: 'Camp Setup' },
  { key: 'tiers',      label: 'Tiers' },
  { key: 'groups',     label: 'Groups' },
  { key: 'timeblocks', label: 'Time Blocks' },
  { key: 'activities', label: 'Activities' },
  { key: 'anchors',    label: 'Anchors' },
  { key: 'schedule',   label: 'Schedule', divider: true },
]

export default function Sidebar({ current, onNavigate, campId, isOpen }) {
  const [campName, setCampName] = useState('')

  useEffect(() => {
    if (!campId) return
    supabase.from('camps').select('name').eq('id', campId).single()
      .then(({ data }) => { if (data) setCampName(data.name) })
  }, [campId])

  return (
    <aside style={{
      // Animate width so the content area expands smoothly when collapsed
      width: isOpen ? 200 : 0,
      flexShrink: 0,
      overflow: 'hidden',
      transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      height: '100%',
    }}>
      {/* Inner div is always 200px so content doesn't reflow during animation */}
      <div style={{ width: 200, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 22,
            color: 'var(--primary)', letterSpacing: '-0.3px',
          }}>Shoresh</div>
          {campName && (
            <div style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: 2,
            }}>{campName}</div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV.map(item => (
            <div key={item.key}>
              {item.divider && <div style={{ height: 1, background: 'var(--border)', margin: '8px 16px' }} />}
              <button
                onClick={() => onNavigate(item.key)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 20px', border: 'none', background: 'none',
                  fontSize: 13, fontWeight: current === item.key ? 600 : 400,
                  color: current === item.key ? 'var(--primary)' : 'var(--text)',
                  borderLeft: current === item.key
                    ? '3px solid var(--primary)'
                    : '3px solid transparent',
                  transition: 'background 0.1s',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (current !== item.key) e.currentTarget.style.background = 'var(--bg)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
              >
                {item.label}
              </button>
            </div>
          ))}
        </nav>

        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border)',
          fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}>
          v0.1.0
        </div>
      </div>
    </aside>
  )
}
