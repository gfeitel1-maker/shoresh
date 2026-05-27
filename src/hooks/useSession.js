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
  // True only while resolveCampId is in-flight — guaranteed to clear when the async call settles.
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    let active = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!active) return
      setSession(s)
      if (s) {
        setResolving(true)
        const cid = await resolveCampId(s)
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
