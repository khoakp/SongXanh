import { ContentHub, ArticleDetail } from '@/components/content-hub'
import { ContentImage } from '@/components/content-image'

const variants = ['portrait', 'landscape', 'square', 'broken', 'missing']
const articles = variants.map(variant => ({
  id: variant, slug: `layout-fixture-${variant}`, title: `Kiểm tra ảnh: ${variant}`,
  excerpt: 'Dữ liệu kiểm tra giao diện, không lưu vào cơ sở dữ liệu.',
  content: 'Nội dung kiểm tra giao diện.', category: 'kien-thuc',
  cover_url: variant === 'missing' ? null : `/layout-image/${variant}.svg`,
  source: null, source_url: null, illustration_label: null,
  created_at: '2026-10-06T00:00:00Z', author: null,
}))
// Imported only by the temporary development-only route created by the runner.
export default function LayoutFixture() {
  return <><ContentHub articles={articles} />{articles.map(article => <div data-fixture-detail={article.id} key={article.id}><ArticleDetail article={article} userId={null} /></div>)}<div className="group mx-auto max-w-sm" data-decorative-fixture><ContentImage src="/layout-image/landscape.svg" alt="" decorative fit="cover" interactive className="aspect-square" /></div></>
}
