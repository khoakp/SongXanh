import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authDestination, authNext, authOrigin } from '@/lib/auth-redirect'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = authOrigin(url.origin)
  const next = authNext(url.searchParams.get('next'))
  const supabase = await createClient()
  const code = url.searchParams.get('code')
  const flowId = url.searchParams.get('sb_flow_id')
  // A stale URL without its SDK flow ID must never borrow a newer verifier.
  if (code && flowId && /^[a-f0-9]{32}$/i.test(flowId) && !url.searchParams.has('error')) {
    await supabase.auth.exchangeCodeForSession(code, { flowId })
  }
  // A failed/consumed callback must not sign out a valid newer app session.
  const { data: { user } } = await supabase.auth.getUser()
  let destination: URL
  if (user) {
    const { data: account } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    destination = new URL(authDestination(next, String(account?.role || user.app_metadata?.role || '')), origin)
  } else {
    destination = new URL('/auth/login', origin)
    destination.searchParams.set('error', 'callback')
    if (next !== '/profile') destination.searchParams.set('next', next)
  }
  const response = NextResponse.redirect(destination, 303)
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
