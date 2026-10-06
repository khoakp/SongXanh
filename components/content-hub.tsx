'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContentImage } from '@/components/content-image'
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Share2 } from 'lucide-react'

type Quiz = { question: string; options: string[] } | null
type Article = { id: string; slug: string; title: string; excerpt: string | null; content: string; cover_url?: string | null; category: string; source: string | null; source_url: string | null; author_name?: string | null; illustration_label: string | null; created_at: string; author: { display_name: string } | null; quiz?: Quiz }
const labels: Record<string, string> = { 'guong-sang': 'Gương sáng', 'kien-thuc': 'Kiến thức', 'tin-xanh': 'Tin xanh' }

export function ContentHub({ articles }: { articles: Article[] }) {
  const [filter, setFilter] = useState('all')
  const visible = filter === 'all' ? articles : articles.filter((article) => article.category === filter)
  return <main className="min-h-[60vh] bg-[#f8fbf5] text-[#173b2b]"><section className="mx-auto max-w-6xl px-5 pb-12 pt-14"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#72ad42]">Góc đọc xanh</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Gương sáng campus</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[#4f6b59]">Những câu chuyện, kiến thức và tin xanh giúp bạn bắt đầu một thay đổi nhỏ mỗi ngày.</p><div className="mt-8 flex gap-2 overflow-x-auto pb-1" aria-label="Lọc bài viết">{[['all','Tất cả'],...Object.entries(labels)].map(([value,label]) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold ${filter === value ? 'bg-[#173b2b] text-white' : 'border border-[#cde6bd] bg-white text-[#47714e]'}`}>{label}</button>)}</div></section><section className="mx-auto grid max-w-6xl gap-5 px-5 pb-20 sm:grid-cols-2 lg:grid-cols-3">{visible.length ? visible.map((article) => <Link href={`/guong-sang/${article.slug}`} key={article.id} className="site-card group overflow-hidden rounded-[2rem] border border-[#dfebdb] bg-white shadow-sm"><ContentImage src={article.cover_url} alt={`Minh họa: ${article.title}`} className="aspect-[16/10] rounded-none border-0" interactive /><div className="p-6"><span className="text-xs font-bold uppercase tracking-wide text-[#72ad42]">{labels[article.category] || article.category}</span><h2 className="mt-3 text-xl font-black leading-tight group-hover:text-[#5b9638]">{article.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-[#4f6b59]">{article.excerpt || article.content.slice(0, 140)}</p><span className="mt-5 inline-flex items-center text-sm font-bold text-[#47714e]">Đọc bài <ArrowRight className="ml-2" size={16} /></span></div></Link>) : <div className="col-span-full rounded-[2rem] border border-dashed border-[#b8d5b4] bg-white px-6 py-14 text-center"><BookOpen className="mx-auto text-[#72ad42]" size={34} /><h2 className="mt-4 text-xl font-black">Chưa có bài viết phù hợp</h2><p className="mt-2 text-sm text-[#4f6b59]">Nội dung sẽ được biên tập viên cập nhật. Dữ liệu minh họa chưa được thêm.</p></div>}</section></main>
}

export function ArticleDetail({ article, userId }: { article: Article; userId: string | null }) {
  const [status, setStatus] = useState<'idle'|'done'>('idle')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  async function completeRead() {
    if (!userId || status === 'done' || !answer) return
    setError('')
    const response = await fetch('/api/articles/read', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ articleId: article.id, answer }) })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setError(result?.error || 'Không thể ghi nhận câu trả lời. Vui lòng thử lại.')
      return
    }
    if (result.reason === 'wrong_answer') {
      setFeedback('Chưa đúng, hãy đọc lại bài và thử lại.')
      return
    }
    setStatus('done')
    setFeedback(result.awarded ? `Chính xác! Bạn nhận +${result.points} điểm.` : result.reason === 'no_quiz' ? 'Bài viết này chưa có câu hỏi nên không cộng điểm.' : 'Bài đọc đã được ghi nhận.')
  }
  return <main className="min-h-[60vh] bg-[#f8fbf5] text-[#173b2b]"><div className="px-5 pt-6"><div className="mx-auto flex max-w-3xl justify-between"><Link href="/guong-sang" className="font-black">← Gương sáng campus</Link><button onClick={() => navigator.share?.({ title: article.title, url: window.location.href })} className="rounded-full border border-[#cde6bd] p-2" aria-label="Chia sẻ bài viết"><Share2 size={18} /></button></div></div><article className="mx-auto max-w-3xl px-5 py-12"><span className="rounded-full bg-[#e6f4d4] px-3 py-1 text-xs font-bold text-[#47714e]">{labels[article.category] || article.category}</span><h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">{article.title}</h1><div className="mt-5 flex flex-wrap gap-4 text-sm text-[#4f6b59]"><span><CalendarDays className="mr-1 inline" size={16} />{new Date(article.created_at).toLocaleDateString('vi-VN')}</span><span>Tác giả: {article.author_name || article.author?.display_name || 'Ban biên tập'}</span></div><ContentImage src={article.cover_url} alt={`Minh họa: ${article.title}`} className="mt-10 aspect-[16/10] w-full" eager fullView /><div className="prose prose-lg mt-10 max-w-none text-[#294b37] leading-8">{article.content.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>{article.source && <p className="mt-8 text-sm text-[#4f6b59]">Nguồn: {article.source_url ? <a className="font-bold underline" href={article.source_url}>{article.source}</a> : article.source}</p>}{article.illustration_label && <p className="mt-3 text-xs font-bold text-[#4f6b59]">{article.illustration_label}</p>}<div className="mt-10 rounded-[2rem] bg-[#173b2b] p-6 text-white"><h2 className="text-xl font-black">Đọc xong rồi, bắt đầu nhé?</h2><p className="mt-2 text-sm text-[#d2e4d5]">Hãy chọn một hành động xanh liên quan đến bài viết này.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link href="/thu-thach" className="rounded-full bg-[#b8e45c] px-5 py-3 text-center text-sm font-bold text-[#173b2b]">Nhận thử thách liên quan</Link><Link href="/thu-thach/hom-nay" className="rounded-full border border-[#739878] px-5 py-3 text-center text-sm font-bold">Cam kết ngay</Link></div>{article.quiz && <div className="mt-7 rounded-2xl bg-white/10 p-4"><p className="text-sm font-bold">{article.quiz.question}</p><div className="mt-3 grid gap-2">{article.quiz.options.map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type="radio" name="article-answer" value={option} checked={answer === option} onChange={() => setAnswer(option)} />{option}</label>)}</div><button onClick={completeRead} disabled={!userId || !answer || status === 'done'} className="mt-4 rounded-full bg-[#b8e45c] px-4 py-2 text-sm font-bold text-[#173b2b] disabled:opacity-50">Trả lời và nhận điểm</button>{feedback && <p className="mt-3 text-sm font-bold text-[#dff1c9]">{feedback}</p>}</div>}{!article.quiz && <p className="mt-5 text-sm text-[#d2e4d5]">Bài viết này chưa có câu hỏi. Dữ liệu minh họa chưa được thêm.</p>}</div></article></main>
}

export type { Article }
