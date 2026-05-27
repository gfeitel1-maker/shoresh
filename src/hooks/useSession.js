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
  if (error) throw error  // caller retries on transient auth/network errors
  return data?.id ?? null
}

export function useSession() {
  const [session, setSession] = useState(null)
  const [campId, setCampId] = useState(null)
  // True only while resolveCampId is in-flight — guaranteed to clear when the async call settles.
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    let active = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!active) return
      setSession(s)
      if (s) {
        setResolving(true)
        // Two attempts with a 6-second timeout each. The first attempt can fail with
        // a JWT/auth error if the token is mid-refresh on page load; a 1.5 s wait
        // lets Supabase finish the refresh before we try again.
        let cid = null
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            cid = await Promise.race([
              resolveCampId(s),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
            ])
            break
          } catch {
            if (attempt === 0) await new Promise(r => setTimeout(r, 1500))
          }
        }
        if (!active) return
        setCampId(cid)
        setResolving(false)
      } else {
        setCampId(null)
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
