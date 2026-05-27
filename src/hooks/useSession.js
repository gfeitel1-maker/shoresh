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
  if (error) console.error('resolveCampId:', error)
  return data?.id ?? null
}

export function useSession() {
  const [session, setSession] = useState(null)
  const [campId, setCampId] = useState(null)
  // Start false so the login screen is visible immediately.
  // Only goes true while we're actively resolving campId for a valid session.
  const [loading, setLoading] = useState(false)
  // Track whether the first auth check has completed so that subsequent
  // token refreshes (tab focus, hourly JWT rotation) don't flash the spinner.
  const didInit = useRef(false)

  useEffect(() => {
    let active = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!active) return
      setSession(s)
      if (s) {
        // Only show the spinner before the very first successful resolution.
        // Token refreshes while already in the app should be invisible.
        if (!didInit.current) setLoading(true)
        const cid = await resolveCampId(s)
        if (!active) return
        setCampId(cid)
        setLoading(false)
        didInit.current = true
      } else {
        // Signed out — clear camp, reset init flag so next login shows spinner.
        setCampId(null)
        didInit.current = false
      }
    })

    // Safety net: if camp lookup hangs (network down, etc.), unblock after 10 s.
    const failsafe = setTimeout(() => {
      if (active) { setLoading(false); didInit.current = true }
    }, 10_000)

    return () => {
      active = false
      clearTimeout(failsafe)
      subscription.unsubscribe()
    }
  }, [])

  return { session, campId, loading }
}
