import { ContentHub } from '@/components/content-hub'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Gương sáng campus | Sống Xanh Campus', description: 'Câu chuyện, kiến thức và tin xanh từ campus.' }
export default async function GuongSangPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('articles').select('id,slug,title,excerpt,content,cover_url,category,source,source_url,author_name,illustration_label,created_at').eq('published', true).or('category.neq.guong-sang,subject_consented.eq.true').order('created_at', { ascending: false })
  return <ContentHub articles={(data ?? []) as never} />
}
