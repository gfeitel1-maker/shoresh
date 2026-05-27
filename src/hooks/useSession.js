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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // Use onAuthStateChange only — it fires INITIAL_SESSION immediately on subscribe
    // and handles TOKEN_REFRESHED / SIGNED_OUT automatically.
    // Calling getSession() separately can hang when a token refresh is in-flight
    // (happens ~hourly as JWTs expire), leaving the spinner stuck forever.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!active) return
      setSession(s)
      const cid = await resolveCampId(s)
      if (!active) return
      setCampId(cid)
      setLoading(false)
    })

    // Safety net: if auth state hasn't resolved within 10 s (e.g. network down),
    // unblock the spinner so the user isn't permanently stuck.
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
