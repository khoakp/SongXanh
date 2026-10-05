import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = String(user?.app_metadata?.role || '')
  if (!user || !['admin', 'editor'].includes(role)) redirect('/auth/login?next=/quan-tri')
  const [{ count: users }, { data: completedRows }, { data: impactData }, { count: reads }, { data: challengeRows }, { data: taskRows }, { data: wasteRows }, { data: scenarioRows }, { data: articleRows }, { data: quizRows }, { data: campaignRows }, { data: userRows }, { data: deletionRows }, { data: factorRows }, { data: badgeRows }] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('user_tasks').select('completed_at').eq('status', 'completed').not('completed_at', 'is', null),
    supabase.rpc('get_impact_metrics'),
    supabase.from('article_reads').select('article_id', { count: 'exact', head: true }),
    supabase.from('challenges').select('id,title,description,active'),
    supabase.from('tasks').select('id,title,description,points,day_number,why,requires_photo'),
    supabase.from('waste_items').select('id,name,category,explanation,difficulty,active'),
    supabase.from('game_scenarios').select('id,slug,title,description,active'),
    supabase.from('articles').select('id,title,slug,status,published,category,featured,excerpt,content,source,source_url,author_name,review_status'),
    supabase.from('quiz_questions').select('id,question,active,game_type'),
    supabase.from('campaigns').select('id,name,description,active,starts_at,ends_at,banner_url,published'),
    supabase.from('users').select('id,display_name,email,locked,school,faculty').order('created_at', { ascending: false }).limit(100),
    supabase.from('data_deletion_requests').select('id,user_id,requested_at,status,processed_at').order('requested_at', { ascending: false }),
    supabase.from('impact_factors').select('id,name,value,active'),
    supabase.from('badges').select('id,name,description,active'),
  ])
  const carbonTotal = Number(impactData?.co2 || 0)
  const byDay = Object.entries((completedRows ?? []).reduce<Record<string, number>>((acc, row) => { const day = row.completed_at?.slice(0, 10); if (day) acc[day] = (acc[day] || 0) + 1; return acc }, {})).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([day, value]) => ({ day, value }))
  return <AdminDashboard role={role} stats={{ users: Number(impactData?.participants || 0), tasks: Number(impactData?.tasks || 0), carbon: carbonTotal, reads: reads ?? 0, byDay }} data={{ challenges: challengeRows ?? [], tasks: taskRows ?? [], waste_items: wasteRows ?? [], game_scenarios: scenarioRows ?? [], articles: articleRows ?? [], quiz: quizRows ?? [], campaigns: campaignRows ?? [], users: userRows ?? [], deletion_requests: deletionRows ?? [], factors: [...(factorRows ?? []), ...(badgeRows ?? [])] }} />
}
