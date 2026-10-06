import { CarbonCalculator } from '@/components/carbon-calculator'
import { createClient } from '@/lib/supabase/server'

export default async function CarbonPage() {
  const supabase = await createClient()
  const [{ data: { user } }, { data: factors }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('emission_factors').select('category, value, unit, name, source, source_year').eq('active', true),
  ])
  const { data: history } = user
    ? await supabase.from('carbon_results').select('created_at, total_kg').eq('user_id', user.id).order('created_at', { ascending: true }).limit(12)
    : { data: [] }

  return <CarbonCalculator factors={factors ?? []} userId={user?.id ?? null} history={history ?? []} />
}
