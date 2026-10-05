import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { taskId?: string } | null
  if (!body?.taskId) {
    return NextResponse.json({ error: 'Thiếu nhiệm vụ.' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('complete_task_secure', {
    p_task_id: body.taskId,
  })

  if (error) {
    const status = error.message.includes('account_locked') ? 403 : error.message.includes('already_completed') ? 409 : error.message.includes('daily_task_limit') ? 429 : error.message.includes('not_found') ? 404 : 400
    const message = error.message.includes('account_locked') ? 'Tài khoản đang bị khóa.' : error.message
    return NextResponse.json({ error: message }, { status })
  }

  return NextResponse.json({
    ok: true,
    impact: data?.impact ? `${data.impact.name}: giảm khoảng ${data.impact.value} ${data.impact.unit}` : null,
    badges: data?.badges ?? [],
  })
}
