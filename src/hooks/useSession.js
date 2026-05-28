// src/hooks/useSession.js
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// Sentinel stored in campIdRef when the DB lookup confirmed this user has no
// camp row.  Keeps the ref truthy (preventing re-queries) without polluting
// campId state (which stays null so App.jsx can react to it normally).
const NO_CAMP = 'NO_CAMP'

// Throws on Supabase errors so callers can distinguish a network/RLS failure
// from a genuine "no camp row" (which returns null without throwing).
export async function resolveCampId(session) {
  if (!session) return null
  const { data, error } = await supabase
    .from('camps')
    .select('id')
    .eq('owner_user_id', session.user.id)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

// Races a promise against a hard timeout so a silently-hung network call can
// never leave resolving=true indefinitely.
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export function useSession() {
  const [session,     setSession]     = useState(null)
  const [campId,      setCampId]      = useState(null)
  const [resolving,   setResolving]   = useState(false)
  // true only when both resolution attempts failed with a network/timeout error.
  // Lets App.jsx show a "retry" screen instead of silently signing the user out.
  const [campIdError, setCampIdError] = useState(false)

  // Mirrors campId (or NO_CAMP) so the onAuthStateChange closure can read the
  // current resolved state without stale-closure issues.
  // • null       → not yet resolved (fresh mount or after sign-out)
  // • string ID  → camp resolved
  // • NO_CAMP    → lookup succeeded, user genuinely has no camp
  // • stays null on network error so the next auth event retries automatically
  const campIdRef = useRef(null)

  useEffect(() => {
    let active = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!active) return
      setSession(s)

      // ── Signed out ────────────────────────────────────────────────────────
      if (!s) {
        setCampId(null)
        campIdRef.current = null
        setResolving(false)
        setCampIdError(false)
        return
      }

      // ── Already resolved ──────────────────────────────────────────────────
      // Guard on ref VALUE, not event name.  Supabase v2 fires TOKEN_REFRESHED,
      // SIGNED_IN (tab-focus recovery), USER_UPDATED, etc. — guarding only on
      // TOKEN_REFRESHED lets those other events re-trigger the loading spinner
      // mid-session.  The ref is cleared to null only on sign-out, so fresh
      // logins always run the resolution path.
      if (campIdRef.current) return

      // ── First resolution after login ──────────────────────────────────────
      setResolving(true)
      setCampIdError(false)

      let cid       = null
      let succeeded = false
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          cid       = await withTimeout(resolveCampId(s), 5000)
          succeeded = true
          break
        } catch (err) {
          console.error(`resolveCampId attempt ${attempt + 1}:`, err)
          if (attempt === 0) await new Promise(r => setTimeout(r, 1000))
        }
      }

      if (!active) return

      if (succeeded) {
        // cid is either a UUID string or null (user has no camp row yet).
        setCampId(cid)
        campIdRef.current = cid ?? NO_CAMP  // keep truthy to block re-queries
        setCampIdError(false)
      } else {
        // Network / timeout failure.  Leave campId null and signal the error so
        // App.jsx can show a retry UI instead of signing the user out.
        // campIdRef stays null so the next Supabase auth event retries.
        setCampIdError(true)
      }
      setResolving(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return { session, campId, resolving, campIdError }
}
