const TITLES = {
  setup:      'Camp Setup',
  tiers:      'Tiers',
  groups:     'Groups',
  days:       'Days of Operation',
  timeblocks: 'Time Blocks',
  activities: 'Activities',
  anchors:    'Anchors',
  schedule:   'Schedule',
}

// Three-line hamburger icon rendered with CSS spans
function HamburgerIcon({ open }) {
  const bar = {
    display: 'block', width: 16, height: 1.5,
    background: 'var(--text-secondary)', borderRadius: 1,
    transition: 'opacity 0.18s, transform 0.18s',
  }
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ ...bar, transform: open ? 'translateY(5.5px) rotate(45deg)' : 'none' }} />
      <span style={{ ...bar, opacity: open ? 0 : 1 }} />
      <span style={{ ...bar, transform: open ? 'translateY(-5.5px) rotate(-45deg)' : 'none' }} />
    </span>
  )
}

export default function TopBar({ screen, onLogout, sidebarOpen, onToggleSidebar }) {
  return (
    <header style={{
      height: 52, minHeight: 52, background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 0 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={sidebarOpen ? 'Collapse menu' : 'Expand menu'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, border: 'none', borderRadius: 6,
              background: 'none', cursor: 'pointer', padding: 0,
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <HamburgerIcon open={!sidebarOpen} />
          </button>
        )}
        <h1 style={{
          fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 18,
          letterSpacing: '-0.2px', color: 'var(--text)', margin: 0,
        }}>
          {TITLES[screen] || 'Shoresh'}
        </h1>
      </div>

      {onLogout && (
        <button onClick={onLogout} style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 6,
          padding: '5px 12px', fontSize: 12, color: 'var(--text-secondary)',
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
        }}>
          Log out
        </button>
      )}
    </header>
  )
}
