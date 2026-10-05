import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 })
  const body = await request.json().catch(() => null) as { title?: string; displayName?: boolean } | null
  if (!body?.title?.trim()) return NextResponse.json({ error: 'Thiếu cam kết.' }, { status: 400 })
  const { data: recent } = await supabase.from('commitments').select('id').eq('user_id', user.id).eq('title', body.title.trim()).gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()).limit(1)
  if (recent?.length) return NextResponse.json({ error: 'Cam kết này vừa được ghi nhận.' }, { status: 409 })
  const { error } = await supabase.rpc('create_commitment_secure', {
    p_title: body.title.trim(),
    p_display_name: Boolean(body.displayName),
  })
  if (error) {
    const status = error.message.includes('account_locked') ? 403 : 400
    const message = error.message.includes('account_locked') ? 'Tài khoản đang bị khóa.' : 'Không thể lưu cam kết.'
    return NextResponse.json({ error: message }, { status })
  }
  return NextResponse.json({ ok: true })
}
