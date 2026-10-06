import { AuthRequiredToday, TodayTasks } from '@/components/challenges-page'
import { createClient } from '@/lib/supabase/server'

export default async function TodayPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <AuthRequiredToday />
  const { data } = await supabase.rpc('get_today_challenges')
  const tasks = (data ?? []) as { challenge_id: string; title: string; duration_days: number; day_number: number; task_id: string; task_title: string; task_description: string | null; why: string | null; points: number; task_day: number; requires_photo: boolean }[]
  return <main className="min-h-[60vh] bg-[#f8fbf5] text-[#173b2b]"><TodayTasks tasks={tasks} userId={user.id} /></main>
}
