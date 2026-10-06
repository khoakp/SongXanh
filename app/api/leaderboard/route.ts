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
  const payload = data && typeof data === 'object' ? data as Record<string, unknown> : {}
  const people = Array.isArray(payload.people) ? payload.people.map((item, index) => {
    const person = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    return {
      id: String(person.id ?? `rank-${index + 1}`),
      display_name: String(person.display_name ?? 'Ẩn danh'),
      faculty: String(person.faculty ?? ''),
      school: String(person.school ?? ''),
      class_name: String(person.class_name ?? ''),
      points: Number(person.points ?? 0),
      rank: Number(person.rank ?? index + 1),
    }
  }) : []
  return NextResponse.json({
    people,
    groups: Array.isArray(payload.groups) ? payload.groups : [],
    me: payload.me && typeof payload.me === 'object' ? payload.me : {},
    hasMore: Boolean(payload.hasMore),
  })
}
