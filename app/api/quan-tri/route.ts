import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedTables = new Set(['challenges', 'tasks', 'articles', 'quiz', 'campaigns', 'users', 'factors', 'badges', 'waste_items', 'game_scenarios', 'game_scenario_steps', 'deletion_requests'])
const allowedFields = new Set(['published', 'active', 'featured', 'locked', 'review_status', 'status'])
const editorTables = new Set(['articles', 'quiz', 'campaigns'])
const adminTables = new Set(['challenges', 'tasks', 'factors', 'badges', 'users', 'waste_items', 'game_scenarios', 'game_scenario_steps'])
const adminDeleteTables = new Set(['challenges', 'tasks', 'articles', 'quiz', 'campaigns', 'factors', 'badges', 'waste_items', 'game_scenarios', 'game_scenario_steps'])
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: account } = user ? await supabase.from('users').select('role').eq('id', user.id).maybeSingle() : { data: null }
  const role = String(account?.role || user?.app_metadata?.role || '')
  if (!user || !['admin', 'editor'].includes(role)) return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 })
  const body = await request.json().catch(() => null) as { table?: string; id?: string; field?: string; value?: boolean | string } | null
  if (!body?.table || !body.id || !body.field || !allowedTables.has(body.table) || !allowedFields.has(body.field)) return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  if (role === 'editor' && !['articles', 'quiz', 'campaigns'].includes(body.table)) return NextResponse.json({ error: 'Editor không có quyền.' }, { status: 403 })
  if (body.table === 'badges' && role !== 'admin') return NextResponse.json({ error: 'Chỉ admin được quản lý huy hiệu.' }, { status: 403 })
  const table = body.table === 'quiz' ? 'quiz_questions' : body.table === 'factors' ? 'impact_factors' : body.table === 'deletion_requests' ? 'data_deletion_requests' : body.table
  const updateValue = table === 'data_deletion_requests' && body.field === 'status' ? (body.value ? 'processed' : 'pending') : body.value
  const { error } = await supabase.from(table).update({ [body.field]: updateValue, ...(table === 'data_deletion_requests' && body.value ? { processed_at: new Date().toISOString(), processed_by: user.id } : {}) }).eq('id', body.id)
  if (error) return NextResponse.json({ error: 'Cập nhật thất bại.' }, { status: 400 })
  const { error: auditError } = await supabase.rpc('write_admin_audit_log', { p_action: 'update', p_table_name: table, p_record_id: body.id, p_changes: { [body.field]: body.value } })
  if (auditError) return NextResponse.json({ error: `Cập nhật thành công nhưng ghi nhật ký quản trị thất bại: ${auditError.message}` }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: account } = user ? await supabase.from('users').select('role').eq('id', user.id).maybeSingle() : { data: null }
  const role = String(account?.role || user?.app_metadata?.role || '')
  if (!user || role !== 'admin') return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 })
  const body = await request.json().catch(() => null) as { table?: string; id?: string } | null
  if (!body?.table || !body.id || !adminDeleteTables.has(body.table)) return NextResponse.json({ error: 'Bảng không được phép xóa.' }, { status: 400 })
  const table = body.table === 'quiz' ? 'quiz_questions' : body.table === 'factors' ? 'impact_factors' : body.table
  const { data: deleted, error } = await supabase.from(table).delete().eq('id', body.id).select('id').maybeSingle()
  if (error) return NextResponse.json({ error: 'Không thể xóa dữ liệu.' }, { status: 400 })
  if (!deleted) return NextResponse.json({ error: 'Không tìm thấy bản ghi.' }, { status: 404 })
  const { error: auditError } = await supabase.rpc('write_admin_audit_log', { p_action: 'delete', p_table_name: table, p_record_id: body.id, p_changes: { deleted: true } })
  if (auditError) return NextResponse.json({ error: 'Đã xóa nhưng ghi nhật ký quản trị thất bại: ' + auditError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

const fieldAllowlist: Record<string, string[]> = {
  articles: ['title', 'slug', 'category', 'excerpt', 'content', 'source', 'source_url', 'author_name', 'review_status', 'featured'],
  quiz: ['question', 'correct_answer', 'explanation', 'source', 'active'],
  campaigns: ['name', 'description', 'starts_at', 'ends_at', 'banner_url', 'published'],
  challenges: ['title', 'description', 'points', 'duration_days', 'topic', 'active'],
  tasks: ['title', 'description', 'points', 'day_number', 'why', 'requires_photo'],
  factors: ['name', 'value', 'unit', 'source', 'source_year', 'active'],
  waste_items: ['name', 'category', 'explanation', 'difficulty', 'active'],
  game_scenarios: ['slug', 'title', 'description', 'active'],
  game_scenario_steps: ['scenario_id', 'step_order', 'prompt', 'options'],
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: account } = user ? await supabase.from('users').select('role').eq('id', user.id).maybeSingle() : { data: null }
  const role = String(account?.role || user?.app_metadata?.role || '')
  if (!user || !['admin', 'editor'].includes(role)) return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 })
  const body = await request.json().catch(() => null) as { table?: string; id?: string; values?: Record<string, unknown> } | null
  if (!body?.table || !fieldAllowlist[body.table] || (role === 'editor' && !editorTables.has(body.table)) || (role === 'admin' && !editorTables.has(body.table) && !adminTables.has(body.table))) return NextResponse.json({ error: 'Bảng không được phép.' }, { status: 400 })
  const values = Object.fromEntries(Object.entries(body.values ?? {}).filter(([key]) => fieldAllowlist[body.table!].includes(key)))
  if (!Object.keys(values).length) return NextResponse.json({ error: 'Không có dữ liệu hợp lệ.' }, { status: 400 })
  const table = body.table === 'quiz' ? 'quiz_questions' : body.table === 'factors' ? 'impact_factors' : body.table === 'deletion_requests' ? 'data_deletion_requests' : body.table
  const query = body.id ? supabase.from(table).update(values).eq('id', body.id) : supabase.from(table).insert(values)
  const { error } = await query
  if (error) return NextResponse.json({ error: 'Không thể lưu dữ liệu.' }, { status: 400 })
  const { error: auditError } = await supabase.rpc('write_admin_audit_log', { p_action: body.id ? 'update' : 'create', p_table_name: table, p_record_id: body.id ?? null, p_changes: values })
  if (auditError) return NextResponse.json({ error: `Lưu thành công nhưng ghi nhật ký quản trị thất bại: ${auditError.message}` }, { status: 500 })
  return NextResponse.json({ ok: true })
}
