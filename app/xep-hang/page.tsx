import { LeaderboardPage, type Person } from '@/components/leaderboard-page'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <LeaderboardPage currentUserId={user?.id ?? null} />
}

export const metadata = { title: 'Xếp hạng | Sống Xanh Campus', description: 'Bảng xếp hạng những hành động xanh trong campus.' }
