'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Check, Leaf, RotateCcw, Share2, Sprout, X } from 'lucide-react'
import { GameModes } from '@/components/game-modes'

type Question = { id: string; question: string; options: string[] }
type TreeLevel = 0 | 1 | 2 | 3 | 4
const levels = ['Hạt giống', 'Mầm cây', 'Cây non', 'Cây lớn', 'Khu rừng']

export function Tree({ level }: { level: TreeLevel }) {
  const sizes = ['size-20', 'size-24', 'size-28', 'size-32', 'size-36']
  return <div className="relative grid h-48 place-items-end overflow-hidden rounded-[2rem] bg-[#dff1c9] p-6"><div className={`${sizes[level]} relative rounded-[55%_45%_50%_50%] bg-[#6da347] shadow-[inset_-10px_-12px_0_#4e843f]`}><span className="absolute -bottom-5 left-1/2 h-16 w-3 -translate-x-1/2 rounded-full bg-[#765438]" />{level >= 2 && <><span className="absolute left-1/2 top-1/2 h-2 w-20 -translate-x-1/2 rotate-45 rounded-full bg-[#765438]" /><span className="absolute left-1/2 top-1/2 h-2 w-20 -translate-x-1/2 -rotate-45 rounded-full bg-[#765438]" /></>}</div><span className="absolute bottom-3 left-4 text-xs font-bold text-[#47714e]">{levels[level]}</span></div>
}

export function GamesPage({ questions, userId, scoreToday, treeLevel }: { questions: Question[]; userId: string | null; scoreToday: number; treeLevel: TreeLevel }) {
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(scoreToday)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string | null; source: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const question = questions[index]
  const todayRemaining = Math.max(0, 30 - scoreToday)
  const canPlay = todayRemaining > 0
  const resultText = useMemo(() => score >= 30 ? 'Bạn đã chạm trần điểm game hôm nay.' : 'Mỗi câu đúng nhận 3 điểm. Hẹn bạn quay lại ngày mai nhé.', [score])

  async function answer(value: string) {
    if (!question || selected || !canPlay) return
    setSelected(value)
    setError(null)
    const response = await fetch('/api/games/true-false', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ questionId: question.id, answer: value }) })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setSelected(null)
      setError(result?.error || 'Không thể ghi nhận câu trả lời. Vui lòng thử lại.')
      return
    }
    setFeedback({ correct: result.correct, explanation: result.explanation, source: result.source })
    if (result.correct) {
      setScore((current) => current + result.points)
    }
  }

  function next() { if (index >= questions.length - 1) setFinished(true); else { setIndex((current) => current + 1); setSelected(null); setFeedback(null); setError(null) } }
  async function shareTree() { const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 600; const context = canvas.getContext('2d'); if (!context) return; context.fillStyle = '#dff1c9'; context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = '#173b2b'; context.font = '700 38px sans-serif'; context.fillText('Cây ảo của tôi', 55, 80); context.font = '700 30px sans-serif'; context.fillText(levels[treeLevel], 55, 125); context.fillStyle = '#6da347'; context.beginPath(); context.arc(450, 310, 110 + treeLevel * 12, 0, Math.PI * 2); context.fill(); context.fillStyle = '#765438'; context.fillRect(438, 390, 24, 120); const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png')); if (!blob) return; const file = new File([blob], 'cay-ao-song-xanh.png', { type: 'image/png' }); if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: 'Cây ảo của tôi', text: `Cây ảo đang ở cấp ${levels[treeLevel]} trên Sống Xanh Campus.`, files: [file] }); else { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = file.name; link.click(); URL.revokeObjectURL(url) } }
  function replay() { setIndex(0); setSelected(null); setFeedback(null); setError(null); setFinished(false) }

  return <main className="min-h-screen bg-[#f8fbf5] px-5 py-8 text-[#173b2b]"><div className="mx-auto max-w-2xl"><a href="/" className="font-black">← Sống Xanh Campus</a><header className="mt-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#72ad42]">Khu vui chơi xanh</p><h1 className="mt-2 text-4xl font-black tracking-tight">Chơi một chút, hiểu thêm nhiều.</h1><p className="mt-3 leading-7 text-[#4f6b59]">Hai trò chơi nhẹ, thiết kế cho thao tác một tay trên điện thoại.</p></header>
    <section className="mt-8 rounded-[2rem] bg-[#173b2b] p-6 text-white"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-[#b8e45c]">Đúng hay sai?</p><h2 className="mt-1 text-2xl font-black">{finished ? 'Kết quả hôm nay' : questions.length ? `Câu ${Math.min(index + 1, questions.length)} / ${questions.length}` : 'Chưa có câu hỏi'}</h2></div><span className="rounded-full bg-white/10 px-3 py-2 text-sm font-bold">{score}/30 điểm</span></div>{finished ? <div className="mt-8"><p className="text-5xl font-black">{score}</p><p className="mt-2 text-[#d2e4d5]">{resultText}</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={replay} className="rounded-full bg-[#b8e45c] px-4 py-3 text-sm font-black text-[#173b2b]"><RotateCcw className="mr-2 inline" size={16}/>Chơi lại</button><a href="/thu-thach" className="rounded-full border border-white/30 px-4 py-3 text-sm font-black">Nhận thử thách liên quan <ArrowRight className="ml-1 inline" size={16}/></a></div></div> : !question ? <p className="mt-8 rounded-2xl bg-white/10 p-4 text-sm">Chưa có câu hỏi đúng/sai đang hoạt động.</p> : <div className="mt-8"><p className="text-xl font-bold leading-8">{question.question}</p>{error && <div role="alert" className="mt-4 rounded-2xl border border-[#f4c7a4] bg-[#fff4ec] p-4 text-sm font-bold text-[#653d2b]">{error} Bạn có thể chọn lại đáp án để thử lại.</div>}<div className="mt-6 grid grid-cols-2 gap-3"><button disabled={!canPlay || Boolean(selected)} onClick={() => answer('Đúng')} className="min-h-14 rounded-2xl bg-[#b8e45c] px-4 text-base font-black text-[#173b2b] disabled:opacity-50"><Check className="mr-2 inline"/>Đúng</button><button disabled={!canPlay || Boolean(selected)} onClick={() => answer('Sai')} className="min-h-14 rounded-2xl bg-[#f4c7a4] px-4 text-base font-black text-[#653d2b] disabled:opacity-50"><X className="mr-2 inline"/>Sai</button></div>{feedback && <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm"><p className="font-black">{feedback.correct ? 'Chính xác, +3 điểm' : 'Chưa đúng'}</p>{feedback.explanation && <p className="mt-2 leading-6 text-[#d2e4d5]">{feedback.explanation}</p>}{feedback.source && <p className="mt-2 text-xs font-bold text-[#b8e45c]">Nguồn: {feedback.source}</p>}<button onClick={next} className="mt-4 rounded-full bg-white px-4 py-2 font-black text-[#173b2b]">Câu tiếp theo <ArrowRight className="ml-1 inline" size={15}/></button></div>}{!userId && <p className="mt-4 text-sm text-[#d2e4d5]">Đăng nhập để lưu điểm và tiến trình.</p>}{userId && !canPlay && <p className="mt-4 text-sm text-[#d2e4d5]">Bạn đã đạt giới hạn 30 điểm game hôm nay.</p>}</div>}</section>
    <GameModes scoreToday={scoreToday} />
    <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-[0_10px_35px_#3c684d12]"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-[#72ad42]">Cây ảo của tôi</p><h2 className="mt-1 text-2xl font-black">Lớn lên cùng thói quen xanh</h2></div><Sprout className="text-[#72ad42]"/></div><div className="mt-5"><Tree level={treeLevel}/></div><p className="mt-4 text-sm leading-6 text-[#4f6b59]">Cây lớn dần khi bạn hoàn thành nhiệm vụ và giữ streak. Bỏ ngày, cây sẽ héo nhẹ. Game này không cộng thêm điểm.</p><div className="mt-4 flex flex-wrap gap-3"><button onClick={shareTree} className="rounded-full border border-[#bcd5b6] px-4 py-3 text-sm font-black text-[#47714e]"><Share2 className="mr-2 inline" size={16}/>Chia sẻ ảnh cây</button><a href="/profile" className="rounded-full bg-[#173b2b] px-4 py-3 text-sm font-black text-white">Xem trong hồ sơ <ArrowRight className="ml-1 inline" size={16}/></a></div></section></div></main>
}

export { levels }
