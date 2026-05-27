// src/hooks/useSession.js
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export async function resolveCampId(session) {
  if (!session) return null
  const { data, error } = await supabase
    .from('camps')
    .select('id')
    .eq('owner_user_id', session.user.id)
    .maybeSingle()
  if (error) console.error('resolveCampId:', error)
  return data?.id ?? null
}

export function useSession() {
  const [session, setSession] = useState(null)
  const [campId, setCampId] = useState(null)
  // Start false so the login screen is visible immediately.
  // Only goes true while we're actively resolving campId for a valid session.
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!active) return
      setSession(s)
      if (s) {
        // Valid session — look up the camp; show spinner during this window.
        setLoading(true)
        const cid = await resolveCampId(s)
        if (!active) return
        setCampId(cid)
        setLoading(false)
      } else {
        // No session — clear camp and stay on (or go to) login, no spinner needed.
        setCampId(null)
      }
    })

    // Safety net: if camp lookup hangs (network down, etc.), unblock after 10 s.
    const failsafe = setTimeout(() => {
      if (active) setLoading(false)
    }, 10_000)

    return () => {
      active = false
      clearTimeout(failsafe)
      subscription.unsubscribe()
    }
  }, [])

  return { session, campId, loading }
}
