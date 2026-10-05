import { ContentHub } from '@/components/content-hub'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Gương sáng campus | Sống Xanh Campus', description: 'Câu chuyện, kiến thức và tin xanh từ campus.' }
export default async function GuongSangPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('articles').select('id,slug,title,excerpt,content,cover_url,category,source,source_url,illustration_label,created_at,author:users(display_name)').eq('published', true).eq('category', 'guong-sang').eq('subject_consented', true).order('created_at', { ascending: false })
  return <ContentHub articles={(data ?? []) as never} />
}
