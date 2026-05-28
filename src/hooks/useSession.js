// src/hooks/useSession.js
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

export async function resolveCampId(session) {
  if (!session) return null
  const { data, error } = await supabase
    .from('camps')
    .select('id')
    .eq('owner_user_id', session.user.id)
    .maybeSingle()
  if (error) { console.error('resolveCampId:', error); return null }
  return data?.id ?? null
}

export function useSession() {
  const [session, setSession] = useState(null)
  const [campId, setCampId] = useState(null)
  const [resolving, setResolving] = useState(true)   // true until first auth event settles
  // Mirrors campId so the onAuthStateChange closure can read the current value.
  // Prevents TOKEN_REFRESHED (tab focus, hourly JWT rotation) from re-querying
  // the DB and potentially clearing campId while the user is mid-session.
  const campIdRef = useRef(null)

  useEffect(() => {
    let active = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!active) return
      setSession(s)
      if (s) {
        // Token refresh while already in the app — campId hasn't changed, skip re-query.
        if (_event === 'TOKEN_REFRESHED' && campIdRef.current) return
        setResolving(true)
        const cid = await resolveCampId(s)
        if (!active) return
        setCampId(cid)
        campIdRef.current = cid
        setResolving(false)
      } else {
        setCampId(null)
        campIdRef.current = null
        setResolving(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return { session, campId, resolving }
}
