import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const params = request.nextUrl.searchParams
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_period: params.get('period') || 'week',
    p_scope: params.get('scope') || 'Trường',
    p_school: params.get('school') || null,
    p_faculty: params.get('faculty') || null,
    p_cohort: params.get('cohort') || null,
    p_page: Number(params.get('page') || 1),
    p_page_size: 50,
  })
  if (error) return NextResponse.json({ error: 'Không thể tải bảng xếp hạng.' }, { status: 500 })
  return NextResponse.json(data)
}
