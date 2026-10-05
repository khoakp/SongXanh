import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('waste_items')
    .select('id,name,difficulty')
    .eq('active', true)
    .order('difficulty')
    .limit(20)

  if (error) {
    return NextResponse.json({ error: 'Không thể tải trò chơi.' }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập để chơi.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { itemId?: string; category?: string } | null
  const categories = ['organic', 'recyclable', 'general', 'hazardous']

  if (!body?.itemId || !body.category || !categories.includes(body.category)) {
    return NextResponse.json({ error: 'Lựa chọn không hợp lệ.' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('submit_waste_sort_secure', {
    p_item_id: body.itemId,
    p_category: body.category,
  })

  if (error) {
    return NextResponse.json({ error: 'Không thể ghi nhận lượt chơi.' }, { status: 400 })
  }

  return NextResponse.json(data)
}
