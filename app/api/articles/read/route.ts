import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { articleId?: string; answer?: string } | null
  if (!body?.articleId) {
    return NextResponse.json({ error: 'Thiếu bài viết.' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('record_article_read_secure', {
    p_article_id: body.articleId,
    p_answer: body.answer ?? null,
  })

  if (error) {
    const status = error.message.includes('account_locked') ? 403 : error.message.includes('already_read') ? 409 : error.message.includes('not_authenticated') ? 401 : 400
    const message = error.message.includes('account_locked') ? 'Tài khoản đang bị khóa.' : error.message
    return NextResponse.json({ error: message }, { status })
  }

  return NextResponse.json(data)
}
