import { AuthRequiredToday, TodayTasks } from '@/components/challenges-page'
import { createClient } from '@/lib/supabase/server'

export default async function TodayPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <AuthRequiredToday />
  const { data } = await supabase.rpc('get_today_challenges')
  const tasks = (data ?? []) as { challenge_id: string; title: string; duration_days: number; day_number: number; task_id: string; task_title: string; task_description: string | null; why: string | null; points: number; task_day: number; requires_photo: boolean }[]
  return <main className="min-h-screen bg-[#f8fbf5] text-[#173b2b]"><header className="border-b border-[#dcebdc] px-5 py-4"><div className="mx-auto flex max-w-3xl justify-between"><a href="/thu-thach" className="font-black">Sống Xanh <span className="text-[#72ad42]">Campus</span></a><a href="/profile" className="text-sm font-bold text-[#477b50]">Hồ sơ</a></div></header><TodayTasks tasks={tasks} userId={user.id} /></main>
}
