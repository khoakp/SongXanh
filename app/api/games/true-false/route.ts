import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const body = await request.json().catch(() => null) as { questionId?: string; answer?: string } | null
  if (!body?.questionId || !body.answer) return NextResponse.json({ error: 'Thiếu câu trả lời.' }, { status: 400 })
  const { data, error } = await supabase.rpc('submit_daily_quiz_secure', {
    p_question_id: body.questionId,
    p_answer: body.answer,
  })

  if (error) {
    const status = error.message.includes('account_locked') ? 403 : error.message.includes('already_answered') ? 409 : error.message.includes('question_not_found') ? 404 : 400
    const message = error.message.includes('account_locked') ? 'Tài khoản đang bị khóa.' : error.message
    return NextResponse.json({ error: message }, { status })
  }

  const { data: question } = await supabase.from('quiz_questions').select('explanation,source').eq('id', body.questionId).maybeSingle()
  return NextResponse.json({ ...data, explanation: question?.explanation ?? null, source: question?.source ?? null })
}
