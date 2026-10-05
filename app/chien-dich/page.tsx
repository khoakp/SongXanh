import { CampaignsPage } from '@/components/campaigns-page'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Chiến dịch xanh | Sống Xanh Campus', description: 'Theo dõi các chiến dịch sống xanh trong campus.' }

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('campaigns').select('id,name,description,starts_at,ends_at,published').eq('published', true).order('starts_at', { ascending: true })
  return <CampaignsPage campaigns={data ?? []} />
}
