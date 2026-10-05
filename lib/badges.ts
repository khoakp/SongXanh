import type { SupabaseClient } from '@supabase/supabase-js'

export async function awardEligibleBadges(supabase: SupabaseClient, userId: string, context?: { taskName?: string; streak?: number }) {
  const [{ data: badges }, { count: taskCount }, { count: articleCount }] = await Promise.all([
    supabase.from('badges').select('id,slug').eq('active', true),
    supabase.from('user_tasks').select('task_id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
    supabase.from('article_reads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  const earned = new Set<string>()
  if ((taskCount ?? 0) >= 1) earned.add('nguoi-moi-nhap-mon')
  if ((context?.streak ?? 0) >= 7) earned.add('streak-7-ngay')
  if ((articleCount ?? 0) >= 5) earned.add('nguoi-doc-cham-chi')
  const taskName = (context?.taskName ?? '').toLowerCase()
  if (taskName.includes('nhựa') || taskName.includes('nhua')) earned.add('chien-binh-khong-nhua')
  if (taskName.includes('điện') || taskName.includes('dien')) earned.add('tiet-kiem-dien')
  if (!earned.size) return
  const eligible = (badges ?? []).filter((badge) => badge.slug && earned.has(badge.slug))
  if (eligible.length) await supabase.from('user_badges').upsert(eligible.map((badge) => ({ user_id: userId, badge_id: badge.id })), { onConflict: 'user_id,badge_id', ignoreDuplicates: true })
}

export function levelFromPoints(points: number) { return ['Hạt giống', 'Mầm cây', 'Cây non', 'Cây lớn', 'Khu rừng'][Math.min(4, Math.floor(points / 100))] }
