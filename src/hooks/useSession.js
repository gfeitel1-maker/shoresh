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
  const [resolving, setResolving] = useState(false)
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

        // Two attempts with a 5-second timeout each.  On a cold Supabase connection
        // (Vercel edge → Supabase cold start, slow network, JWT mid-refresh) the first
        // request can silently hang and never settle, leaving resolving=true forever.
        // The try/finally guarantees resolving is always cleared regardless.
        let cid = null
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            cid = await Promise.race([
              resolveCampId(s),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('campId timeout')), 5000)
              ),
            ])
            break // success — exit retry loop
          } catch {
            if (attempt === 0) await new Promise(r => setTimeout(r, 1200))
          }
        }

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
