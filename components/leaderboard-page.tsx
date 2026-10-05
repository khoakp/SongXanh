'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

export type Person = { id: string; display_name: string; faculty: string; school: string; class_name: string; points: number; rank: number }
type Group = { name: string; members: number; total: number; average: number }
type Result = { people: Person[]; groups: Group[]; me: { rank?: number; points?: number; group_name?: string }; hasMore: boolean }
const periods = [{ key: 'week', label: 'Tuần này' }, { key: 'month', label: 'Tháng này' }, { key: 'all', label: 'Toàn thời gian' }] as const
const scopes = ['Trường', 'Khoa', 'Lớp'] as const

export function LeaderboardPage({ currentUserId }: { currentUserId: string | null }) {
  const [period, setPeriod] = useState<(typeof periods)[number]['key']>('week')
  const [scope, setScope] = useState<(typeof scopes)[number]>('Trường')
  const [page, setPage] = useState(1)
  const [school, setSchool] = useState('')
  const [faculty, setFaculty] = useState('')
  const [cohort, setCohort] = useState('')
  const [result, setResult] = useState<Result>({ people: [], groups: [], me: {}, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ period, scope, page: String(page), pageSize: '50' })
    if (school) params.set('school', school)
    if (faculty) params.set('faculty', faculty)
    if (cohort) params.set('cohort', cohort)
    fetch(`/api/leaderboard?${params}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Không thể tải bảng xếp hạng.')
        if (!cancelled) setResult(data)
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [period, scope, page, school, faculty, cohort])

  function changePeriod(next: (typeof periods)[number]['key']) {
    setPeriod(next)
    setPage(1)
  }

  function changeScope(next: (typeof scopes)[number]) {
    setScope(next)
    setPage(1)
  }

  return <main className="min-h-screen bg-[#f8fbf5] px-4 py-5 text-[#173b2b] sm:px-6 sm:py-8"><div className="mx-auto max-w-4xl"><a href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#4e7b58]"><ArrowLeft /> Trang chủ</a><header className="mt-7"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#72ad42]">Thi đua lành mạnh</p><h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Bảng xếp hạng</h1><p className="mt-3 max-w-xl text-base leading-7 text-[#4d6b58]">Điểm được ghi nhận từ những hành động xanh thật trong hệ thống.</p></header><section className="mt-7 rounded-[1.75rem] border border-[#dcebdc] bg-white p-3 shadow-sm"><div className="grid grid-cols-3 gap-1 rounded-2xl bg-[#f0f7eb] p-1">{periods.map((item) => <button key={item.key} onClick={() => changePeriod(item.key)} className={`min-h-11 rounded-xl px-2 text-xs font-bold sm:text-sm ${period === item.key ? 'bg-white text-[#47714e] shadow-sm' : 'text-[#587360]'}`}>{item.label}</button>)}</div><div className="mt-3 grid grid-cols-3 gap-2">{scopes.map((item) => <button key={item} onClick={() => changeScope(item)} className={`min-h-11 rounded-xl border px-2 text-xs font-bold sm:text-sm ${scope === item ? 'border-[#72ad42] bg-[#eaf6d9] text-[#396b43]' : 'border-[#dcebdc] text-[#587360]'}`}>{item}</button>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-3"><input value={school} onChange={(event) => { setSchool(event.target.value); setPage(1) }} placeholder="Lọc theo trường" className="rounded-xl border border-[#dcebdc] px-3 py-2 text-sm" /><input value={faculty} onChange={(event) => { setFaculty(event.target.value); setPage(1) }} placeholder="Lọc theo khoa" className="rounded-xl border border-[#dcebdc] px-3 py-2 text-sm" /><input value={cohort} onChange={(event) => { setCohort(event.target.value); setPage(1) }} placeholder="Lọc theo khóa" className="rounded-xl border border-[#dcebdc] px-3 py-2 text-sm" /></div></section>{currentUserId && <div className="mt-5 rounded-2xl bg-[#173b2b] px-4 py-4 text-white"><p className="text-xs font-bold text-[#b8e45c]">Vị trí của bạn</p><div className="mt-1 flex items-center justify-between gap-3"><strong>#{result.me.rank ?? '—'} · {result.me.group_name || 'Chưa thuộc nhóm'}</strong><span className="shrink-0 font-black">{result.me.points ?? 0} điểm</span></div></div>}{error && <p role="alert" className="mt-5 rounded-2xl bg-[#fff0e8] p-4 text-sm font-bold text-[#8a432b]">{error}</p>}<section className="mt-5 overflow-hidden rounded-[1.75rem] border border-[#dcebdc] bg-white shadow-sm"><div className="border-b border-[#edf2ea] px-5 py-4"><h2 className="font-black">{scope === 'Trường' || scope === 'Khoa' || scope === 'Lớp' ? `Xếp hạng ${scope.toLowerCase()}` : 'Xếp hạng'}</h2></div>{result.groups.length ? <div className="divide-y divide-[#edf2ea]">{result.groups.map((group, index) => <div key={group.name} className="flex items-center justify-between gap-4 px-5 py-4"><div><strong>{index + 1}. {group.name || 'Chưa cập nhật'}</strong><p className="text-xs text-[#6d8874]">{group.members} thành viên có điểm</p></div><strong>{group.average.toLocaleString('vi-VN')} điểm/người</strong></div>)}</div> : <p className="px-5 py-8 text-sm leading-6 text-[#6d8874]">Chưa có nhóm đủ điều kiện. Nhóm cần ít nhất 5 thành viên có điểm trong kỳ.</p>}</section><section className="mt-5 overflow-hidden rounded-[1.75rem] border border-[#dcebdc] bg-white shadow-sm"><div className="border-b border-[#edf2ea] px-5 py-4"><h2 className="font-black">Xếp hạng cá nhân</h2></div>{loading ? <p className="px-5 py-8 text-sm text-[#6d8874]">Đang tải...</p> : result.people.length ? <div className="divide-y divide-[#edf2ea]">{result.people.map((person) => <div key={person.id} className={`flex items-center justify-between gap-4 px-5 py-4 ${person.id === currentUserId ? 'bg-[#f0f7eb]' : ''}`}><div><strong>#{person.rank} · {person.display_name}</strong><p className="text-xs text-[#6d8874]">{person.school || person.faculty || person.class_name || 'Chưa cập nhật'}</p></div><strong>{person.points.toLocaleString('vi-VN')} điểm</strong></div>)}</div> : <p className="px-5 py-8 text-sm leading-6 text-[#6d8874]">Chưa có người dùng có điểm trong kỳ này.</p>}<div className="flex items-center justify-between border-t border-[#edf2ea] px-5 py-3"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="inline-flex items-center gap-1 text-sm font-bold disabled:opacity-40"><ChevronLeft size={16} /> Trước</button><span className="text-sm text-[#6d8874]">Trang {page}</span><button disabled={!result.hasMore} onClick={() => setPage((value) => value + 1)} className="inline-flex items-center gap-1 text-sm font-bold disabled:opacity-40">Sau <ChevronRight size={16} /></button></div></section></div></main>
}
