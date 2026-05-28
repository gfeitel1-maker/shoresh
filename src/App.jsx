import { useEffect, useState } from 'react'
import Shell from './components/layout/Shell'
import AuthScreen from './screens/AuthScreen'
import CampSetup from './screens/CampSetup'
import TiersScreen from './screens/TiersScreen'
import GroupsScreen from './screens/GroupsScreen'
import TimeBlocksScreen from './screens/TimeBlocksScreen'
import ActivitiesScreen from './screens/ActivitiesScreen'
import AnchorsScreen from './screens/AnchorsScreen'
import ScheduleScreen from './screens/ScheduleScreen'
import { useSession } from './hooks/useSession'
import { supabase } from './supabase'

const SCREENS = {
  setup: CampSetup,
  tiers: TiersScreen,
  groups: GroupsScreen,
  timeblocks: TimeBlocksScreen,
  activities: ActivitiesScreen,
  anchors: AnchorsScreen,
  schedule: ScheduleScreen,
}

const MON_FRI = [
  { label: 'Monday',    day_of_week: 1, sort_order: 1 },
  { label: 'Tuesday',   day_of_week: 2, sort_order: 2 },
  { label: 'Wednesday', day_of_week: 3, sort_order: 3 },
  { label: 'Thursday',  day_of_week: 4, sort_order: 4 },
  { label: 'Friday',    day_of_week: 5, sort_order: 5 },
]

async function seedDays(campId) {
  const { count } = await supabase
    .from('days_of_operation')
    .select('id', { count: 'exact', head: true })
    .eq('camp_id', campId)
  if (count === 0) {
    await supabase.from('days_of_operation').insert(
      MON_FRI.map(d => ({ ...d, camp_id: campId }))
    )
  }
}

export default function App() {
  const { session, campId, resolving, campIdError } = useSession()
  const [screen, setScreen] = useState('setup')

  useEffect(() => {
    if (campId) seedDays(campId)
  }, [campId])

  // Sign out only when the DB lookup SUCCEEDED but found no camp row.
  // If campIdError is true the lookup failed with a network/timeout error —
  // in that case we keep the session alive and show a retry screen instead of
  // kicking the user back to the login form.
  useEffect(() => {
    if (session && !campId && !resolving && !campIdError) {
      supabase.auth.signOut()
    }
  }, [session, campId, resolving, campIdError])

  // Actively resolving campId for a known session — show a bounded spinner.
  if (resolving) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text-secondary)', fontSize: 13 }}>
        Loading…
      </div>
    )
  }

  // DB lookup failed (network / timeout) — offer a reload instead of signing out.
  if (session && campIdError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', gap: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 320 }}>
          Couldn't reach the database. Check your connection and try again.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 22px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface)', cursor: 'pointer', fontSize: 13,
            fontFamily: 'inherit', color: 'var(--text)',
          }}
        >
          Reload
        </button>
      </div>
    )
  }

  if (!session || !campId) {
    return <AuthScreen />
  }

  const Screen = SCREENS[screen] || CampSetup

  return (
    <Shell currentScreen={screen} onNavigate={setScreen} campId={campId} onLogout={() => supabase.auth.signOut()}>
      <Screen campId={campId} onNavigate={setScreen} />
    </Shell>
  )
}
