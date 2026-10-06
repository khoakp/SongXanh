import { notFound } from 'next/navigation'
import { ArticleDetail } from '@/components/content-hub'
import { createClient } from '@/lib/supabase/server'

async function loadArticle(slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: account } = user ? await supabase.from('users').select('role').eq('id', user.id).maybeSingle() : { data: null }
  const canPreview = ['admin', 'editor'].includes(String(account?.role || user?.app_metadata?.role || ''))
  let query = supabase.from('articles').select('id,slug,title,excerpt,content,cover_url,category,source,source_url,author_name,illustration_label,created_at,published,subject_consented,quiz:quiz_questions(question,options)').eq('slug', slug)
  if (!canPreview) query = query.eq('published', true)
  const { data: article } = await query.maybeSingle()
  if (!article || (article.category === 'guong-sang' && !article.subject_consented)) return { article: null, user }
  return { article, user }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { article } = await loadArticle(slug)
  const title = article?.title || 'Bài viết | Sống Xanh Campus'
  const description = article?.excerpt || 'Đọc nội dung xanh từ Sống Xanh Campus.'
  const image = article?.cover_url || '/og-song-xanh.png'
  return { title, description, openGraph: { title, description, images: [{ url: image, width: 1200, height: 630, alt: title }] }, twitter: { card: 'summary_large_image' as const, images: [image] }, ...(!article?.published ? { robots: { index: false, follow: false } } : {}) }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { article, user } = await loadArticle(slug)
  if (!article) notFound()
  return <>{!article.published && <p className="bg-amber-100 p-3 text-center font-bold">Bản xem trước dành cho biên tập viên — chưa công bố</p>}<ArticleDetail article={article as never} userId={user?.id ?? null} /></>
}
