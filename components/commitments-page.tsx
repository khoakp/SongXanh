'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Download, Leaf, Share2 } from 'lucide-react'

type Commitment = { id: string; title: string; display_name: boolean; user_name: string | null; class_name: string | null; faculty: string | null; created_at: string }
type Props = { commitments: Commitment[]; total: number; user: { id: string; name: string; className: string | null; faculty: string | null } | null }

const options = ['Không dùng túi nilon trong 1 tháng', 'Mang bình nước cá nhân mỗi ngày', 'Phân loại rác tại nguồn trong 30 ngày', 'Đi bộ hoặc đi xe đạp cho quãng đường ngắn']

export function CommitmentsPage({ commitments, total, user }: Props) {
  const [selected, setSelected] = useState(options[0])
  const [displayName, setDisplayName] = useState(true)
  const [filter, setFilter] = useState('all')
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState('')
  const visible = useMemo(() => filter === 'all' ? commitments : commitments.filter((item) => filter === item.class_name || filter === item.faculty), [commitments, filter])

  async function commit() {
    if (!user) { window.location.href = '/auth/sign-in?next=/cam-ket'; return }
    const response = await fetch('/api/commitments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: selected, displayName }) })
    if (response.ok) { setSaved(true); setMessage('Cam kết đã được ghi nhận.'); window.location.reload() }
    else setMessage('Không thể lưu cam kết lúc này.')
  }

  async function shareCard() {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630
    const context = canvas.getContext('2d'); if (!context) return
    context.fillStyle = '#e8f5d7'; context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#173b2b'; context.font = '700 48px sans-serif'; context.fillText('Sống Xanh Campus', 70, 100)
    context.font = '700 42px sans-serif'; context.fillText(selected, 70, 235)
    context.font = '400 30px sans-serif'; context.fillText(`Cam kết của ${user?.name || 'Ẩn danh'}`, 70, 330)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png')); if (!blob) return
    const file = new File([blob], 'thiep-cam-ket.png', { type: 'image/png' })
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: 'Thiệp cam kết xanh', files: [file] })
    else { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = file.name; link.click(); URL.revokeObjectURL(url) }
  }

  return <main className="min-h-screen bg-[#f7fbf1] pb-20 text-[#173b2b]
"><section className="mx-auto max-w-7xl px-5 pb-10 pt-8 lg:px-8"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#5d963b]">Cam kết xanh</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Một lời hứa nhỏ, một campus tốt hơn.</h1><p className="mt-4 max-w-xl text-base leading-7 text-[#4f6b59]">Chọn điều bạn sẵn sàng làm và cùng nhìn thấy những cam kết đang lớn lên mỗi ngày.</p></div><div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.9fr]"><div className="rounded-[2rem] bg-[#173b2b] p-6 text-white sm:p-8"><Leaf className="text-[#b8e45c]" size={28}/><h2 className="mt-5 text-2xl font-black">Tạo cam kết</h2><div className="mt-5 grid gap-3">{options.map((option) => <button key={option} onClick={() => setSelected(option)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${selected === option ? 'border-[#b8e45c] bg-[#b8e45c] text-[#173b2b]' : 'border-white/20 text-white'}`}>{option}</button>)}</div><label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={displayName} onChange={(event) => setDisplayName(event.target.checked)} /> Hiển thị tên tôi trên tường cam kết</label><button onClick={commit} className="mt-6 w-full rounded-full bg-[#b8e45c] px-5 py-3 text-sm font-black text-[#173b2b]">{saved ? 'Đã cam kết' : 'Cam kết ngay'}</button>{message && <p className="mt-3 text-sm text-[#dff1c9]">{message}</p>}</div><div className="rounded-[2rem] bg-[#dff1c9] p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#5d963b]">Thiệp của bạn</p><div className="mt-5 rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center gap-2 text-sm font-black text-[#5d963b]"><Check size={17}/> Sống Xanh Campus</div><h2 className="mt-8 text-2xl font-black">{selected}</h2><p className="mt-4 text-sm text-[#4f6b59]">Cam kết của {displayName && user ? user.name : 'Ẩn danh'}</p></div><div className="mt-5 flex flex-wrap gap-3"><button onClick={shareCard} className="inline-flex items-center gap-2 rounded-full bg-[#173b2b] px-5 py-3 text-sm font-bold text-white"><Share2 size={16}/> Chia sẻ hoặc tải thiệp</button><a href="/thu-thach" className="inline-flex items-center gap-2 rounded-full border border-[#aac59e] px-5 py-3 text-sm font-bold text-[#31593d]">Nhận thử thách liên quan <Copy size={16}/></a></div></div></div></section><section className="mx-auto max-w-7xl px-5 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#5d963b]">Bức tường cam kết</p><h2 className="mt-2 text-3xl font-black">{total.toLocaleString('vi-VN')} cam kết toàn hệ thống</h2></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-11 rounded-full border border-[#b7ceb2] bg-white px-4 text-sm font-bold"><option value="all">Tất cả lớp / khoa</option>{Array.from(new Set(commitments.flatMap((item) => [item.class_name, item.faculty]).filter(Boolean))).map((value) => <option key={value} value={value!}>{value}</option>)}</select></div>{visible.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visible.map((item) => <article key={item.id} className="rounded-2xl border border-[#d5e5cb] bg-white p-5"><p className="text-sm font-black">{item.display_name ? item.user_name || 'Ẩn danh' : 'Ẩn danh'}</p><p className="mt-3 text-sm leading-6 text-[#4f6b59]">{item.title}</p><p className="mt-4 text-xs text-[#4f6b59]">{item.class_name || item.faculty || 'Chưa cập nhật đơn vị'}</p></article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-[#adc6a5] bg-white p-8 text-center text-sm text-[#4f6b59]">Chưa có cam kết phù hợp bộ lọc.</div>}</section></main>
}
