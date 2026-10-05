import { ChallengesPage } from '@/components/challenges-page'
import { createClient } from '@/lib/supabase/server'

export default async function ChallengesRoute() {
  const supabase = await createClient()
  const [{ data: auth }, { data: rows }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('challenges').select('id,title,description,points,icon,duration_days,topic').eq('active', true).order('created_at', { ascending: false }),
  ])
  const challenges = (rows ?? []).map((item) => ({
    ...item,
    duration: item.duration_days ?? 0,
    topic: item.topic ?? '',
    tasks: [] as { id: string; title: string; description: string | null; why: string | null; points: number; requires_photo: boolean }[],
  }))
  if (challenges.length) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id,title,description,why,points,requires_photo,challenge_id')
      .in('challenge_id', challenges.map((item) => item.id))
    for (const challenge of challenges) {
      challenge.tasks = (tasks ?? []).filter((task) => task.challenge_id === challenge.id)
    }
  }
  return <ChallengesPage challenges={challenges} userId={auth.user?.id ?? null} />
}
