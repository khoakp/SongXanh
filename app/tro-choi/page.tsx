import { createClient } from '@/lib/supabase/server'
import { GamesPage } from '@/components/games-page'

export default async function GamesRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: questions }, { data: daily }, { data: profile }] = await Promise.all([
    supabase.rpc('get_daily_game_questions'),
    user ? supabase.from('game_daily_scores').select('score').eq('user_id', user.id).eq('played_on', new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from('users').select('tree_level').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  return <GamesPage questions={(questions ?? []) as never} userId={user?.id ?? null} scoreToday={daily?.score ?? 0} treeLevel={(profile?.tree_level ?? 0) as 0 | 1 | 2 | 3 | 4} />
}
