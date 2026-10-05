import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 })
  const body = await request.json().catch(() => null); if (!body?.challengeId) return NextResponse.json({ error: 'Thiếu thử thách.' }, { status: 400 })
  const { error } = await supabase.rpc('join_challenge_secure', { p_challenge_id: body.challengeId })
  if (error) {
    const status = error.message.includes('account_locked') ? 403 : 400
    return NextResponse.json({ error: status === 403 ? 'Tài khoản đang bị khóa.' : 'Không thể nhận thử thách.' }, { status })
  }
  return NextResponse.json({ ok: true })
}
