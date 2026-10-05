import { CommitmentsPage } from '@/components/commitments-page'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Cam kết xanh | Sống Xanh Campus', description: 'Chọn một cam kết xanh và cùng xây dựng bức tường cam kết của campus.' }

export default async function CommitmentsRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: rows, count }, { data: profile }] = await Promise.all([
    supabase.from('commitments_public').select('id,title,user_name,class_name,faculty,created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(60),
    user ? supabase.from('users').select('display_name,class_name,faculty').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const commitments = (rows ?? []).map((row: { id: string; title: string; user_name: string; class_name: string | null; faculty: string | null; created_at: string }) => ({ id: row.id, title: row.title, display_name: row.user_name !== 'Ẩn danh', user_name: row.user_name, class_name: row.class_name, faculty: row.faculty, created_at: row.created_at }))
  return <CommitmentsPage commitments={commitments} total={count ?? 0} user={user ? { id: user.id, name: profile?.display_name || 'Bạn', className: profile?.class_name || null, faculty: profile?.faculty || null } : null} />
}
