import { notFound } from 'next/navigation'
import { CampaignDetail } from '@/components/campaigns-page'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const supabase = await createClient(); const { data } = await supabase.from('campaigns').select('name,description').eq('id', id).maybeSingle(); return { title: data ? `${data.name} | Sống Xanh Campus` : 'Chiến dịch | Sống Xanh Campus', description: data?.description || 'Chiến dịch sống xanh trong campus.' } }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: campaign } = await supabase.from('campaigns').select('id,name,description,starts_at,ends_at,published').eq('id', id).eq('published', true).maybeSingle()
  if (!campaign) notFound()
  const [{ data: challenges }, { data: articles }, { data: summary }] = await Promise.all([
    supabase.from('challenges').select('id,title,description').eq('campaign_id', id).eq('active', true).order('created_at', { ascending: false }),
    supabase.from('articles').select('slug,title,excerpt').eq('published', true).eq('campaign_id', id).order('created_at', { ascending: false }),
    supabase.rpc('get_campaign_summary', { p_campaign_id: id }),
  ])
  const campaignSummary = summary ?? { participants: 0, co2: 0, cups: 0, standout: null }
  return <CampaignDetail campaign={campaign} challenges={challenges ?? []} articles={articles ?? []} participantCount={Number(campaignSummary.participants || 0)} impact={{ co2: Number(campaignSummary.co2 || 0), cups: Number(campaignSummary.cups || 0), standout: campaignSummary.standout }} />
}
