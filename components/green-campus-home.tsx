'use client'

import { useState } from 'react'
import { Tree } from '@/components/games-page'
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  CircleUserRound,
  Flame,
  Leaf,
  Menu,
  Play,
  Recycle,
  Sprout,
  Trophy,
  X,
  Zap,
} from 'lucide-react'

const impactStats = [
  { key: 'participants', label: 'sinh viên tham gia', icon: CircleUserRound },
  { key: 'tasks', label: 'nhiệm vụ đã hoàn thành', icon: Check },
  { key: 'co2', label: 'CO₂ ước tính giảm', icon: Leaf },
  { key: 'cups', label: 'ly nhựa đã tránh dùng', icon: Recycle },
]

type HomeChallenge = { id: string; title: string; detail: string | null; points: string; icon: string; color: string }

type HomeLeader = { rank: number; display_name: string; faculty: string; points: number }
type HomeLeaderboard = { week: HomeLeader[]; month: HomeLeader[] }

type HomeUser = { id: string; email: string; displayName: string }
type HomeMetrics = { participants: number; tasks: number; co2: number; cups: number }
type HomeArticle = { slug: string; title: string; excerpt: string | null; author: string | null; source: string | null }

type HomeCampaign = { id: string; name: string; description: string | null; starts_at: string | null; ends_at: string | null }

export function GreenCampusHome({ user, metrics, featuredArticle, fact, streakDays = null, treeLevel = 0, heroImageUrl = null, commitmentCount = 0, currentCampaign = null, featuredChallenges = [], leaderboardByPeriod }: { user: HomeUser | null; metrics: HomeMetrics; featuredArticle: HomeArticle | null; fact: { content: string; source: string | null } | null; streakDays?: number | null; treeLevel?: number; heroImageUrl?: string | null; commitmentCount?: number; currentCampaign?: HomeCampaign | null; featuredChallenges?: HomeChallenge[]; leaderboardByPeriod: HomeLeaderboard }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week')
  const [joined, setJoined] = useState<string[]>([])
  const leaderboard = leaderboardByPeriod[activeTab]
  const challenges = featuredChallenges

  async function joinChallenge(challengeId: string) {
    if (!user) {
      window.location.href = '/auth/login?next=/'
      return
    }
    const response = await fetch('/api/challenges/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId }),
    })
    if (response.ok) {
      setJoined((current) => current.includes(challengeId) ? current : [...current, challengeId])
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fbf5] text-[#173b2b]">
      <header className="relative z-20 border-b border-[#dcebdc] bg-[#f8fbf5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="Sống Xanh Campus - Trang chủ">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#b8e45c] text-[#173b2b] shadow-[0_5px_0_#77ac4b]"><Sprout aria-hidden="true" /></span>
            <span className="leading-none"><strong className="block text-lg tracking-tight">Sống Xanh</strong><small className="text-xs font-bold uppercase tracking-[0.25em] text-[#5d8069]">Campus</small></span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#577464] lg:flex" aria-label="Điều hướng chính">
            <a className="text-[#173b2b]" href="#top">Trang chủ</a><a href="#challenges" className="transition hover:text-[#173b2b]">Thử thách</a><a href="/tro-choi" className="transition hover:text-[#173b2b]">Trò chơi</a><a href="#impact" className="transition hover:text-[#173b2b]">Tác động</a><a href="#stories" className="transition hover:text-[#173b2b]">Câu chuyện</a><a href="/chien-dich" className="transition hover:text-[#173b2b]">Chiến dịch</a><a href="#leaderboard" className="transition hover:text-[#173b2b]">Xếp hạng</a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">{user ? <><a href="/profile" className="rounded-full border border-[#cde6bd] bg-white px-4 py-2 text-sm font-bold text-[#3f7550]">{user.displayName}</a><a href="/profile" className="rounded-full bg-[#173b2b] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#0d241a] transition hover:translate-y-0.5">Hồ sơ <ArrowRight className="ml-1 inline" size={16} /></a></> : <><a href="/auth/login" className="rounded-full px-4 py-2 text-sm font-bold text-[#577464]">Đăng nhập</a><a href="/auth/sign-up" className="rounded-full bg-[#173b2b] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#0d241a] transition hover:translate-y-0.5">Tham gia ngay <ArrowRight className="ml-1 inline" size={16} /></a></>}</div>
          <button className="rounded-xl p-2 lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <nav className="flex flex-col gap-4 border-t border-[#dcebdc] px-5 py-5 text-sm font-semibold lg:hidden"><a href="#top" onClick={() => setMenuOpen(false)}>Trang chủ</a><a href="#challenges" onClick={() => setMenuOpen(false)}>Thử thách</a><a href="/tro-choi" onClick={() => setMenuOpen(false)}>Trò chơi</a><a href="#impact" onClick={() => setMenuOpen(false)}>Tác động</a><a href="#stories" onClick={() => setMenuOpen(false)}>Câu chuyện</a><a href="/chien-dich" onClick={() => setMenuOpen(false)}>Chiến dịch</a><a href="/xep-hang" onClick={() => setMenuOpen(false)}>Xếp hạng</a><a href="/auth/sign-up" onClick={() => setMenuOpen(false)} className="rounded-full bg-[#173b2b] px-4 py-3 text-white">Tham gia ngay</a></nav>}
      </header>

      <section id="top" className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div className="relative z-10">{currentCampaign && <a href={`/chien-dich/${currentCampaign.id}`} className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#cde6bd] bg-white px-3 py-1.5 text-xs font-bold text-[#4e7b58]"><span className="size-2 shrink-0 rounded-full bg-[#e4a94b]" /> <span className="truncate">{currentCampaign.name}</span> <ArrowRight size={14} /></a>}<h1 className="max-w-2xl text-5xl font-black leading-[1.04] tracking-[-0.055em] text-[#173b2b] sm:text-6xl lg:text-[76px]">Mỗi lựa chọn nhỏ,<br /><span className="text-[#72ad42]">một tương lai xanh.</span></h1><p className="mt-6 max-w-lg text-lg leading-8 text-[#64806e]">Sống Xanh Campus giúp bạn biến những thói quen hằng ngày thành tác động thật — vui hơn, gần hơn và cùng cả trường.</p><div className="mt-8 flex flex-wrap items-center gap-4"><a href="/carbon" className="rounded-full bg-[#173b2b] px-6 py-3.5 text-sm font-bold text-white shadow-[0_5px_0_#0d241a] transition hover:translate-y-0.5">Tính dấu chân carbon <ArrowRight className="ml-2 inline" size={17} /></a><a href="/thu-thach" className="flex items-center gap-2 px-2 py-3 text-sm font-bold text-[#3f7550]"><span className="grid size-9 place-items-center rounded-full border border-[#b7d9b5] bg-white"><Play size={14} fill="currentColor" /></span> Khám phá thử thách</a></div></div>
        <div className="relative min-h-[390px] lg:min-h-[500px]"><div className="absolute right-0 top-0 h-[88%] w-[88%] overflow-hidden rounded-[3rem] bg-[#dff1c9]"><img src={heroImageUrl || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-r5Zhxt6WufoKgMPW3oQPPp6c1v4dS1.png'} alt="" className="size-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} /></div><div className="absolute bottom-2 left-0 rounded-3xl border border-[#d9e8d0] bg-white p-4 shadow-[0_18px_45px_#51785425] sm:left-4"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#eaf6d9] text-[#6da347]"><Leaf /></span><span><strong className="block text-2xl font-black">{metrics.tasks.toLocaleString('vi-VN')}</strong><small className="text-xs font-medium text-[#4f6b59]">nhiệm vụ hoàn thành</small></span></div></div>{user && streakDays !== null && <div className="absolute right-1 top-[22%] rounded-2xl bg-[#173b2b] px-4 py-3 text-white shadow-xl"><div className="flex items-center gap-2 text-sm font-bold"><Flame className="text-[#ffcd6b]" size={18} fill="currentColor" /> {streakDays} ngày liên tiếp</div></div>}</div>
      </section>

      <section id="impact" className="bg-[#173b2b] px-5 py-10 text-white lg:px-8"><div className="mx-auto max-w-7xl"><div className="mb-7 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b8e45c]">Tác động của chúng ta</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Cả trường đang cùng làm.</h2></div><p className="max-w-xs text-sm leading-6 text-[#d0e4d4]">{metrics.participants || metrics.tasks || metrics.co2 || metrics.cups ? 'Số liệu được tổng hợp từ hoạt động thực tế trong hệ thống.' : 'Chưa có dữ liệu, hãy là người đầu tiên!'}</p></div><div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{impactStats.map(({ key, label, icon: Icon }) => <div key={label} className="border-l border-[#4a7258] pl-4"><Icon className="mb-4 text-[#b8e45c]" size={20} /><strong className="block text-2xl font-black tracking-tight sm:text-3xl">{key === 'co2' ? `${metrics.co2.toLocaleString('vi-VN')} kg` : key === 'cups' ? metrics.cups.toLocaleString('vi-VN') : key === 'tasks' ? metrics.tasks.toLocaleString('vi-VN') : metrics.participants.toLocaleString('vi-VN')}</strong><span className="mt-1 block text-xs text-[#d0e4d4]">{label}</span></div>)}</div><p className="mt-6 text-xs text-[#d0e4d4]">Số liệu là ước tính dựa trên hệ số do ban quản trị cấu hình · <a href="/gioi-thieu#nguon-so-lieu" className="underline underline-offset-2">Xem nguồn số liệu</a></p></div></section>

      <section id="challenges" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#72ad42]">Bắt đầu từ hôm nay</p><h2 className="mt-2 text-4xl font-black tracking-[-0.04em]">Thử thách dành cho bạn</h2></div><a href="/thu-thach" className="text-sm font-bold text-[#4e7b58]">Xem tất cả thử thách <ChevronRight className="inline" size={16} /></a></div><div className="mt-9 grid gap-5 md:grid-cols-3">{challenges.map((challenge) => { const active = joined.includes(challenge.id); return <article key={challenge.id} className="group rounded-[1.75rem] border border-[#e0ebdc] bg-white p-5 shadow-[0_8px_25px_#3c684d0b] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_#3c684d18]"><div className="flex items-start justify-between"><span className={`grid size-14 place-items-center rounded-2xl text-2xl ${challenge.color}`}>{challenge.icon}</span><span className="rounded-full bg-[#f0f7eb] px-3 py-1 text-xs font-bold text-[#609060]">{challenge.points}</span></div><h3 className="mt-7 text-xl font-black">{challenge.title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-[#4f6b59]">{challenge.detail}</p><button onClick={() => joinChallenge(challenge.id)} className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold transition ${active ? 'bg-[#e6f4d4] text-[#4b864b]' : 'bg-[#173b2b] text-white hover:bg-[#2b5a3e]'}`}>{active ? <><Check className="mr-2 inline" size={16} /> Đã nhận thử thách</> : 'Nhận thử thách'}</button></article>})}</div></section>

      <section id="carbon" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><div className="relative overflow-hidden rounded-[2.5rem] bg-[#e8f5d7] px-6 py-10 sm:px-12 lg:flex lg:items-center lg:justify-between lg:py-14"><div className="relative z-10 max-w-xl"><div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white text-[#6aa342]"><BarChart3 /></div><h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">Bạn đang để lại dấu chân nào?</h2><p className="mt-4 text-base leading-7 text-[#66856b]">Mất chưa đến 2 phút để biết tác động của mình và nhận gợi ý phù hợp nhất với bạn.</p><a href="/carbon" className="mt-7 inline-flex rounded-full bg-[#72ad42] px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#538531] transition hover:translate-y-0.5">Tính ngay, hoàn toàn miễn phí <ArrowRight className="ml-2 inline" size={17} /></a></div><div className="pointer-events-none absolute -right-10 -top-20 size-80 rounded-full border-[35px] border-white/50 lg:right-16" /><div className="pointer-events-none absolute -bottom-24 right-24 size-64 rounded-full border-[25px] border-[#c6e6a7]" /></div></section>

      <section id="stories" className="bg-[#fffdf5] px-5 py-20 lg:px-8"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d58d3a]">Gương sáng campus</p><h2 className="mt-2 text-4xl font-black tracking-[-0.04em]">Chuyện xanh quanh ta</h2></div><a href="/gioi-thieu" className="hidden text-sm font-bold text-[#90683d] sm:block">Đọc thêm <ChevronRight className="inline" size={16} /></a></div><div className="mt-9 grid gap-6 lg:grid-cols-[1.3fr_1fr]"><article className="relative min-h-[310px] overflow-hidden rounded-[2rem] bg-[#97be78] p-7 text-white"><div className="absolute inset-0 bg-[linear-gradient(135deg,#365f46aa,transparent_65%),radial-gradient(circle_at_85%_25%,#f7dfa0,transparent_18%)]" /><div className="relative flex h-full flex-col justify-end"><span className="mb-auto w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">GƯƠNG SÁNG SINH VIÊN</span>{featuredArticle ? <><h3 className="max-w-lg text-3xl font-black leading-tight">{featuredArticle.title}</h3><p className="mt-3 text-sm text-white/80">{featuredArticle.author || 'Ban biên tập'}{featuredArticle.source ? ` · ${featuredArticle.source}` : ''}</p><a href={`/guong-sang/${featuredArticle.slug}`} className="mt-5 inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#31593d]">Đọc bài <ArrowRight className="ml-2" size={16} /></a></> : <div className="mt-auto"><h3 className="text-xl font-black">Chưa có gương sáng được công bố</h3><p className="mt-3 text-sm text-white/80">Nội dung sẽ được biên tập viên cập nhật khi nhân vật đã đồng ý.</p></div>}</div></article><div className="flex flex-col justify-between rounded-[2rem] border border-[#eee5d5] bg-[#fffaf0] p-7"><div><BookOpen className="text-[#db9a4b]" /><h3 className="mt-5 text-2xl font-black">Bạn có biết?</h3><p className="mt-3 text-base leading-7 text-[#5f5949]">{fact ? fact.content : 'Hiện chưa có thông tin mới để hiển thị.'}</p></div><a href="#challenges" className="mt-8 text-sm font-bold text-[#b57937]">Nhận thử thách liên quan <ArrowRight className="ml-1 inline" size={16} /></a></div></div></div></section>

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><div className="rounded-[2rem] border border-[#d5e5cb] bg-white p-6 sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#72ad42]">Bức tường cam kết</p><h2 className="mt-2 text-3xl font-black">{commitmentCount.toLocaleString('vi-VN')} cam kết xanh</h2><p className="mt-3 text-[#4f6b59]">Mỗi lời hứa đều góp phần tạo nên campus bền vững hơn.</p></div><a href="/cam-ket" className="inline-flex w-fit rounded-full bg-[#173b2b] px-5 py-3 text-sm font-bold text-white">Cam kết ngay <ArrowRight className="ml-2" size={16}/></a></div></div></section><section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><div className="rounded-[2rem] bg-[#e8f5d7] p-6 sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#72ad42]">Cây ảo của tôi</p><h2 className="mt-2 text-3xl font-black">Lớn lên cùng thói quen xanh.</h2><p className="mt-3 max-w-lg leading-7 text-[#4f6b59]">Hoàn thành nhiệm vụ và giữ streak để cây phát triển. Không cộng thêm điểm.</p></div><div className="w-56"><Tree level={Math.max(0, Math.min(4, treeLevel)) as 0 | 1 | 2 | 3 | 4} /></div></div><a href="/tro-choi" className="mt-5 inline-flex rounded-full bg-[#173b2b] px-5 py-3 text-sm font-bold text-white">Chăm cây của bạn <ArrowRight className="ml-2 inline" size={16}/></a></div></section><section id="leaderboard" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#72ad42]">Thi đua lành mạnh</p><h2 className="mt-2 text-4xl font-black tracking-[-0.04em]">Ai đang dẫn đầu?</h2><p className="mt-4 max-w-sm leading-7 text-[#4f6b59]">Không phải để hơn thua, mà để cùng nhau tiến bộ. Điểm được tính công bằng theo đầu người.</p><a href="/xep-hang" className="mt-7 inline-flex rounded-full border border-[#c2ddbd] bg-white px-5 py-3 text-sm font-bold text-[#47714e]">Xem bảng xếp hạng <ArrowRight className="ml-2 inline" size={16} /></a></div><div className="rounded-[2rem] border border-[#dfebdb] bg-white p-5 shadow-[0_15px_35px_#3c684d0b] sm:p-7"><div className="flex items-center justify-between border-b border-[#edf2ea] pb-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#fff0c9] text-[#c38b2e]"><Trophy size={20} /></span><div><h3 className="font-black">Cá nhân nổi bật</h3><p className="text-xs text-[#4f6b59]">Toàn trường</p></div></div><div className="flex rounded-full bg-[#f2f7ef] p-1 text-xs font-bold"><button onClick={() => setActiveTab('week')} className={`rounded-full px-3 py-1.5 ${activeTab === 'week' ? 'bg-white text-[#47714e] shadow-sm' : 'text-[#4f6b59]'}`}>Tuần này</button><button onClick={() => setActiveTab('month')} className={`rounded-full px-3 py-1.5 ${activeTab === 'month' ? 'bg-white text-[#47714e] shadow-sm' : 'text-[#4f6b59]'}`}>Tháng này</button></div></div><div className="flex flex-col">{leaderboard.map((person, index) => { const rank = person.rank; const name = person.display_name; const faculty = person.faculty; const score = person.points; return <div key={name} className="flex items-center gap-3 border-b border-[#edf2ea] py-4 last:border-0"><span className={`w-5 text-center text-sm font-black ${index === 0 ? 'text-[#d49a35]' : 'text-[#91a498]'}`}>{rank}</span><span className="grid size-10 place-items-center rounded-full bg-[#dcefc7] text-sm font-black text-[#4f8047]">{name.split(' ').map((part) => part[0]).slice(-2).join('')}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{name}</p><p className="text-xs text-[#91a498]">{faculty}</p></div><strong className="text-sm font-black text-[#47714e]">{activeTab === 'month' ? score + 320 : score} <span className="text-xs font-medium text-[#91a498]">điểm</span></strong></div> })}</div></div></div></section>

      <footer className="border-t border-[#dcebdc] bg-[#f1f7eb] px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-[#6f8c76] sm:flex-row sm:items-center"><div className="flex items-center gap-2 font-bold text-[#31593d]"><span className="grid size-8 place-items-center rounded-xl bg-[#b8e45c]"><Sprout size={17} /></span> Sống Xanh Campus</div><p>Lan tỏa thói quen xanh trong từng giảng đường.</p><div className="flex gap-4"><a href="/gioi-thieu">Giới thiệu</a><a href="/quyen-rieng-tu">Riêng tư</a><a href="/lien-he">Liên hệ</a></div></div></footer>
    </main>
  )
}
