'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, Leaf, LogIn, RotateCcw, Save, Share2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Factor = { category: string; value: number; unit: string; name: string; source: string | null; source_year: number | null }
type HistoryPoint = { created_at: string; total_kg: number }
type CarbonCalculatorProps = { factors: Factor[]; userId: string | null; history: HistoryPoint[] }

type Answers = { transport: string; distance: string; meat: string; takeaway: string; ac: string; devices: string; plastic: string; drinks: string; clothes: string }
const initialAnswers: Answers = { transport: 'xe máy', distance: '8', meat: '3', takeaway: '2', ac: '4', devices: '6', plastic: '3', drinks: '3', clothes: '1' }
const steps = [{ title: 'Đi lại', fields: ['transport', 'distance'] }, { title: 'Ăn uống', fields: ['meat', 'takeaway'] }, { title: 'Dùng điện', fields: ['ac', 'devices'] }, { title: 'Mua sắm', fields: ['plastic', 'drinks', 'clothes'] }]
const labels: Record<string, string> = { transport: 'Phương tiện chính', distance: 'Số km mỗi ngày', meat: 'Số bữa có thịt mỗi tuần', takeaway: 'Đồ ăn mang đi mỗi tuần', ac: 'Số giờ dùng điều hòa mỗi ngày', devices: 'Số giờ dùng thiết bị mỗi ngày', plastic: 'Đồ nhựa dùng một lần mỗi tuần', drinks: 'Trà sữa / cà phê mang đi mỗi tuần', clothes: 'Số món quần áo mua mỗi tháng' }

function getFactor(factors: Factor[], category: string, preferredName = '') {
  const matching = factors.filter((item) => item.category.toLowerCase().includes(category))
  const preferred = matching.find((item) => item.name.toLowerCase().includes(preferredName.toLowerCase()))
  return preferred ?? matching[0] ?? null
}

export function CarbonCalculator({ factors, userId, history }: CarbonCalculatorProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers)
  const [result, setResult] = useState<{ groups: number[]; total: number; sources: Factor[] } | null>(null)
  const [saved, setSaved] = useState(false)
  const [historyItems, setHistoryItems] = useState(history)
  const [message, setMessage] = useState('')
  const available = factors.length > 0
  const missingData = factors.length < 4

  const calculation = useMemo(() => {
    const transportFactor = getFactor(factors, 'transport', answers.transport)
    const foodFactor = getFactor(factors, 'food', 'thịt') ?? getFactor(factors, 'ăn', 'thịt')
    const energyFactor = getFactor(factors, 'energy') ?? getFactor(factors, 'điện')
    const shoppingFactor = getFactor(factors, 'shopping') ?? getFactor(factors, 'mua')
    if (!transportFactor || !foodFactor || !energyFactor || !shoppingFactor) return null
    const groups = [
      Number(answers.distance) * transportFactor.value,
      (Number(answers.meat) + Number(answers.takeaway)) * foodFactor.value / 7,
      (Number(answers.ac) + Number(answers.devices)) * energyFactor.value / 24,
      (Number(answers.plastic) + Number(answers.drinks)) * shoppingFactor.value / 7 + Number(answers.clothes) * shoppingFactor.value / 30,
    ]
    const total = groups.reduce((sum, value) => sum + value, 0)
    return { groups, total, sources: [transportFactor, foodFactor, energyFactor, shoppingFactor] }
  }, [answers, factors])

  function update(key: keyof Answers, value: string) { setAnswers((current) => ({ ...current, [key]: value })) }
  function next() { setStep((current) => Math.min(steps.length - 1, current + 1)) }
  function calculate() { if (!calculation) { setMessage('Chưa có đủ hệ số phát thải trong cơ sở dữ liệu để tính.'); return } setResult(calculation); setMessage('') }
  async function saveResult() {
    if (!userId || !result) return
    const supabase = createClient()
    const { error } = await supabase.rpc('save_carbon_result_secure', {
      p_transport: result.groups[0],
      p_food: result.groups[1],
      p_energy: result.groups[2],
      p_shopping: result.groups[3],
      p_total: result.total,
    })
    const locked = error?.message.includes('account_locked')
    setMessage(locked ? 'Tài khoản đang bị khóa.' : error ? 'Chưa lưu được kết quả. Vui lòng thử lại.' : 'Đã lưu kết quả vào hồ sơ của bạn.')
    if (!error) {
      setSaved(true)
      setHistoryItems((items) => [{ created_at: new Date().toISOString(), total_kg: result.total }, ...items.filter((item) => item.created_at !== 'pending')].slice(0, 12))
    }
  }
  async function share() { if (!result) return; if (navigator.share) await navigator.share({ title: 'Dấu chân carbon của tôi', text: `${result.total.toFixed(2)} kg CO₂/ngày — Sống Xanh Campus` }); else { await navigator.clipboard.writeText(`${result.total.toFixed(2)} kg CO₂/ngày — Sống Xanh Campus`); setMessage('Đã sao chép kết quả để chia sẻ.') } }

  if (result) return <><ResultView result={result} history={historyItems} userId={userId} saved={saved} message={message} onSave={saveResult} onShare={share} onMessage={setMessage} onReset={() => { setResult(null); setStep(0); setSaved(false) }} /><CarbonHistory history={historyItems} /></>

  return <main className="min-h-[60vh] bg-[#f8fbf5] px-5 py-6 text-[#173b2b] sm:py-10"><div className="mx-auto max-w-3xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#47714e]"><ArrowLeft data-icon="inline-start" /> Trang chủ</Link><div className="mt-8"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e8f5d7] px-3 py-1.5 text-xs font-bold text-[#47714e]"><Leaf data-icon="inline-start" /> Ước tính cá nhân</div><h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">Dấu chân carbon của bạn</h1><p className="mt-4 max-w-xl text-base leading-7 text-[#4f6e5a]">Hoàn thành trong 1–2 phút. Kết quả chỉ là ước tính để giúp bạn bắt đầu thay đổi.</p></div><div className="mt-8 flex gap-2" aria-label="Tiến độ">{steps.map((item, index) => <div key={item.title} className="flex-1"><div className={`h-2 rounded-full ${index <= step ? 'bg-[#72ad42]' : 'bg-[#dcebdc]'}`} /><span className={`mt-2 block text-xs font-bold ${index === step ? 'text-[#173b2b]' : 'text-[#688272]'}`}>{index + 1}. {item.title}</span></div>)}</div>{!available && <div className="mt-7 rounded-2xl border border-[#ead9a9] bg-[#fff9e7] p-4 text-sm leading-6 text-[#765d28]">Chưa có dữ liệu hệ số phát thải trong cơ sở dữ liệu. Biểu mẫu vẫn sẵn sàng, kết quả sẽ khả dụng khi dữ liệu được cập nhật.</div>}{missingData && available && <div className="mt-7 rounded-2xl border border-[#ead9a9] bg-[#fff9e7] p-4 text-sm leading-6 text-[#765d28]">Dữ liệu minh họa chưa đủ 4 nhóm để tính kết quả. Vui lòng bổ sung hệ số trong bảng emission_factors.</div>}<section className="mt-7 rounded-[2rem] border border-[#deebd9] bg-white p-5 shadow-[0_15px_35px_#3c684d0b] sm:p-8"><h2 className="text-2xl font-black">{steps[step].title}</h2><div className="mt-6 flex flex-col gap-5">{steps[step].fields.map((field) => <label key={field} className="flex flex-col gap-2 text-sm font-bold" htmlFor={field}>{labels[field]}{field === 'transport' ? <select id={field} value={answers[field as keyof Answers]} onChange={(event) => update(field as keyof Answers, event.target.value)} className="rounded-2xl border border-[#cfe3c8] bg-[#fbfdf9] px-4 py-3.5 text-base font-semibold outline-none focus:border-[#72ad42]"><option>xe máy</option><option>xe buýt</option><option>xe đạp / đi bộ</option><option>ô tô</option></select> : <input id={field} type="number" min="0" inputMode="decimal" value={answers[field as keyof Answers]} onChange={(event) => update(field as keyof Answers, event.target.value)} className="rounded-2xl border border-[#cfe3c8] bg-[#fbfdf9] px-4 py-3.5 text-base font-semibold outline-none focus:border-[#72ad42]" />}</label>)}</div><div className="mt-8 flex justify-between gap-3">{step > 0 ? <button onClick={() => setStep((current) => current - 1)} className="rounded-full border border-[#cfe3c8] px-5 py-3 text-sm font-bold text-[#47714e]">Quay lại</button> : <span />}{step < steps.length - 1 ? <button onClick={next} className="rounded-full bg-[#173b2b] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_0_#0d241a]">Tiếp theo <ArrowRight className="ml-2 inline" data-icon="inline-end" /></button> : <button disabled={!calculation} onClick={calculate} className="rounded-full bg-[#72ad42] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_0_#538531] disabled:cursor-not-allowed disabled:opacity-50">Tính dấu chân carbon <Check className="ml-2 inline" data-icon="inline-end" /></button>}</div>{message && <p className="mt-4 text-sm font-semibold text-[#8b5e27]" role="status">{message}</p>}</section></div></main>
}

function ResultView({ result, history, userId, saved, message, onSave, onShare, onMessage, onReset }: { result: { groups: number[]; total: number; sources: Factor[] }; history: HistoryPoint[]; userId: string | null; saved: boolean; message: string; onSave: () => void; onShare: () => void; onMessage: (message: string) => void; onReset: () => void }) {
  const labels = ['Đi lại', 'Ăn uống', 'Dùng điện', 'Mua sắm']; const colors = ['#72ad42', '#e5a34d', '#64a5a5', '#8a76b9']; const gradient = result.total ? result.groups.map((value, index) => `${colors[index]} ${result.groups.slice(0, index).reduce((sum, item) => sum + item, 0) / result.total * 100}% ${(result.groups.slice(0, index + 1).reduce((sum, item) => sum + item, 0) / result.total) * 100}%`).join(', ') : '#dcebdc 0 100%'
  return <main className="min-h-[60vh] bg-[#f8fbf5] px-5 py-6 text-[#173b2b] sm:py-10"><div className="mx-auto max-w-3xl"><button onClick={onReset} className="inline-flex items-center gap-2 text-sm font-bold text-[#47714e]"><ArrowLeft data-icon="inline-start" /> Tính lại</button><div className="mt-8 rounded-[2rem] bg-[#173b2b] p-6 text-white sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b8e45c]">Kết quả ước tính</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">{result.total.toFixed(2)} kg CO₂</h1><p className="mt-2 text-base text-[#d1e4d4]">mỗi ngày · khoảng {(result.total * 365).toFixed(0)} kg CO₂ mỗi năm</p><div className="mt-8 flex items-center gap-8"><div className="size-36 shrink-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }}><div className="m-5 grid size-26 place-items-center rounded-full bg-[#173b2b] text-center text-xs font-bold text-[#d1e4d4]">4 nhóm<br />tác động</div></div><div className="flex flex-col gap-3">{labels.map((label, index) => <div key={label} className="flex items-center gap-2 text-sm"><span className="size-3 rounded-full" style={{ backgroundColor: colors[index] }} />{label}: {result.groups[index].toFixed(2)} kg</div>)}</div></div></div><div className="mt-6 rounded-[2rem] border border-[#deebd9] bg-white p-6"><p className="text-sm leading-6 text-[#4f6e5a]">Đây là số ước tính dựa trên thông tin bạn nhập và các hệ số hiện có trong hệ thống, không phải phép đo trực tiếp.</p><p className="mt-3 text-xs leading-5 text-[#688272]">Nguồn hệ số: {result.sources.map((source) => `${source.name} — ${source.source ?? 'Chưa cấu hình nguồn'}${source.source_year ? ` (${source.source_year})` : ''}`).join('; ')}.</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={onShare} className="rounded-full bg-[#173b2b] px-5 py-3 text-sm font-bold text-white"><Share2 className="mr-2 inline" data-icon="inline-start" /> Chia sẻ</button><button onClick={() => { onMessage('Thẻ kết quả sẵn sàng để tải xuống hoặc chia sẻ từ trình duyệt.'); window.print() }} className="rounded-full border border-[#cfe3c8] px-5 py-3 text-sm font-bold text-[#47714e]"><Download className="mr-2 inline" data-icon="inline-start" /> Tạo thẻ / tải về</button>{userId ? <button onClick={onSave} disabled={saved} className="rounded-full border border-[#cfe3c8] px-5 py-3 text-sm font-bold text-[#47714e] disabled:opacity-60"><Save className="mr-2 inline" data-icon="inline-start" /> {saved ? 'Đã lưu' : 'Lưu vào hồ sơ'}</button> : <Link href="/auth/login?next=/carbon" className="inline-flex items-center rounded-full border border-[#cfe3c8] px-5 py-3 text-sm font-bold text-[#47714e]"><LogIn className="mr-2 inline" data-icon="inline-start" /> Đăng nhập để lưu</Link>}</div>{message && <p className="mt-4 text-sm font-semibold text-[#47714e]" role="status">{message}</p>}</div><div className="mt-6 grid gap-4 sm:grid-cols-3">{['Bắt đầu từ nhóm có tỷ trọng cao nhất', 'Thử thay đổi một thói quen trong 7 ngày', 'Xem lại kết quả sau khi cập nhật dữ liệu'].map((tip) => <div key={tip} className="rounded-2xl bg-[#e8f5d7] p-4 text-sm font-bold leading-6 text-[#31593d]">{tip}</div>)}</div><button onClick={onReset} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#47714e]"><RotateCcw data-icon="inline-start" /> Làm lại bài tính</button></div></main>
}

function CarbonHistory({ history }: { history: HistoryPoint[] }) {
  if (!history.length) return null
  return <section className="mx-auto mt-6 max-w-3xl rounded-[2rem] border border-[#deebd9] bg-white p-6 text-[#173b2b]"><h2 className="text-xl font-black">Lịch sử dấu chân carbon</h2><div className="mt-4 grid gap-2">{history.map((item) => <p key={`${item.created_at}-${item.total_kg}`} className="flex justify-between text-sm text-[#52705a]"><span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span><strong>{Number(item.total_kg).toFixed(2)} kg CO₂</strong></p>)}</div></section>
}
