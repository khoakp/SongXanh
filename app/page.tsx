import { GreenCampusHome } from '@/components/green-campus-home'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { display_name: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()
    profile = data
  }

  const [{ data: impactData }, { count: commitments }] = await Promise.all([
    supabase.rpc('get_impact_metrics'),
    supabase.from('commitments_public').select('id', { count: 'exact', head: true }),
  ])
  const impact = impactData ?? { participants: 0, tasks: 0, co2: 0, cups: 0 }
  const { data: treeProfile } = user ? await supabase.from('users').select('tree_level').eq('id', user.id).maybeSingle() : { data: null }
  const [{ data: weekRanking }, { data: monthRanking }, { data: featured }, { data: facts }, { data: currentCampaign }, { data: featuredChallenges }, { data: streakData }] = await Promise.all([
    supabase.rpc('get_leaderboard', { p_period: 'week', p_scope: 'Trường', p_page: 1, p_page_size: 3 }),
    supabase.rpc('get_leaderboard', { p_period: 'month', p_scope: 'Trường', p_page: 1, p_page_size: 3 }),
    supabase.from('articles').select('slug,title,excerpt,author:users(display_name),source').eq('published', true).eq('category', 'guong-sang').eq('featured', true).eq('subject_consented', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('articles').select('content,source').eq('published', true).eq('category', 'kien-thuc').order('created_at', { ascending: false }).limit(10),
    supabase.from('campaigns').select('id,name,description,starts_at,ends_at,published').eq('active', true).eq('published', true).lte('starts_at', new Date().toISOString()).gte('ends_at', new Date().toISOString()).order('ends_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('challenges').select('id,title,description,points,icon,duration_days,topic').eq('active', true).eq('featured', true).order('created_at', { ascending: false }).limit(3),
    user ? supabase.from('users').select('streak_days').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const selectedFact = facts?.length ? facts[0] : null
  type FeaturedArticleRow = { slug: string; title: string; excerpt: string | null; source: string | null; author: { display_name: string | null } | { display_name: string | null }[] | null }
  const featuredArticle = featured as unknown as FeaturedArticleRow | null
  return <GreenCampusHome user={user ? { id: user.id, email: user.email ?? '', displayName: profile?.display_name || user.email?.split('@')[0] || 'Bạn' } : null} metrics={{ participants: Number(impact.participants || 0), tasks: Number(impact.tasks || 0), co2: Number(impact.co2 || 0), cups: Number(impact.cups || 0) }} featuredArticle={featuredArticle ? { slug: featuredArticle.slug, title: featuredArticle.title, excerpt: featuredArticle.excerpt, author: Array.isArray(featuredArticle.author) ? featuredArticle.author[0]?.display_name ?? null : featuredArticle.author?.display_name ?? null, source: featuredArticle.source } : null} fact={selectedFact} streakDays={user ? Number(streakData?.streak_days ?? 0) : null} treeLevel={treeProfile?.tree_level ?? 0} heroImageUrl={process.env.NEXT_PUBLIC_HERO_IMAGE_URL || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-r5Zhxt6WufoKgMPW3oQPPp6c1v4dS1.png'} commitmentCount={commitments ?? 0} currentCampaign={currentCampaign} featuredChallenges={(featuredChallenges ?? []).map((item) => ({ id: item.id, title: item.title, detail: item.description, points: `+${item.points} điểm`, icon: item.icon ?? '🌱', color: 'bg-emerald-50 text-emerald-700' }))} leaderboardByPeriod={{ week: weekRanking?.people?.slice(0, 3) ?? [], month: monthRanking?.people?.slice(0, 3) ?? [] }} />
}
