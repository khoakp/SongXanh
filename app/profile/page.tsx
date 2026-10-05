import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile-client'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('users').select('display_name,school,faculty,class_name,avatar_url,total_points,streak_days,hide_from_leaderboard,tree_level').eq('id', user.id).maybeSingle()
  const { data: deletionRequest } = await supabase.from('data_deletion_requests').select('status,requested_at').eq('user_id', user.id).order('requested_at', { ascending: false }).limit(1).maybeSingle()
  const [{ data: badges }, { data: activity }] = await Promise.all([
    supabase.from('user_badges').select('awarded_at,badge:badges(name,icon,requirement,campaign_id,campaign:campaigns(name))').eq('user_id', user.id).order('awarded_at', { ascending: false }),
    supabase.from('user_tasks').select('status,updated_at,task:tasks(title)').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20),
  ])
  return <ProfileClient email={user.email || ''} profile={profile} deletionStatus={deletionRequest?.status ?? null} activity={activity ?? []} badges={(badges || []).map((row) => ({ awarded_at: row.awarded_at, badge: Array.isArray(row.badge) ? row.badge[0] : row.badge }))} />
}
