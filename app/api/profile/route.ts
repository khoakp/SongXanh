import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const values = Object.fromEntries(Object.entries(body ?? {}).filter(([key]) => ['display_name', 'school', 'faculty', 'class_name', 'hide_from_leaderboard'].includes(key)))
  if (!Object.keys(values).length) return NextResponse.json({ error: 'Không có dữ liệu hợp lệ.' }, { status: 400 })
  const { error } = await supabase.from('users').update(values).eq('id', user.id)
  if (error) return NextResponse.json({ error: 'Không thể cập nhật hồ sơ.' }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 })
  const { error } = await supabase.from('data_deletion_requests').insert({ user_id: user.id, requested_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: 'Không thể gửi yêu cầu xóa dữ liệu.' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
