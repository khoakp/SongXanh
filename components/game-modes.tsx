'use client'

import Link from 'next/link'

import { useEffect, useState } from 'react'

const categories = [
  ['organic', 'Hữu cơ'],
  ['recyclable', 'Tái chế'],
  ['general', 'Vô cơ'],
  ['hazardous', 'Nguy hại'],
] as const

type WasteItem = { id: string; name: string; difficulty: number }
type Scenario = { id: string; title: string; description: string | null }
type ScenarioStep = { id: string; scenarioId: string; stepOrder: number; prompt: string; options: { id: string; label: string }[] }

export function GameModes({ scoreToday }: { scoreToday: number }) {
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([])
  const [wasteIndex, setWasteIndex] = useState(0)
  const [wasteFeedback, setWasteFeedback] = useState<{ correct: boolean; explanation: string; correctCategory: string } | null>(null)
  const [wasteError, setWasteError] = useState('')
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [scenarioSteps, setScenarioSteps] = useState<ScenarioStep[]>([])
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [scenarioChoices, setScenarioChoices] = useState<string[]>([])
  const [scenarioResult, setScenarioResult] = useState<{ planet: number; points: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadModes() {
      const [wasteResponse, scenarioResponse] = await Promise.all([
        fetch('/api/games/waste-sort'),
        fetch('/api/games/student-day'),
      ])
      const waste = await wasteResponse.json().catch(() => null)
      const studentDay = await scenarioResponse.json().catch(() => null)
      setWasteItems(waste?.items ?? [])
      setScenario(studentDay?.scenarios?.[0] ?? null)
      setScenarioSteps(studentDay?.steps?.filter((step: ScenarioStep) => step.scenarioId === studentDay?.scenarios?.[0]?.id) ?? [])
      setLoading(false)
    }

    loadModes()
  }, [])

  async function sortWaste(category: string) {
    const item = wasteItems[wasteIndex]
    if (!item || wasteFeedback || scoreToday >= 30) return
    setWasteError('')
    const response = await fetch('/api/games/waste-sort', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, category }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setWasteError(result?.error || 'Không thể ghi nhận lượt chơi.')
      return
    }
    setWasteFeedback(result)
  }

  function nextWaste() {
    setWasteIndex((current) => current + 1)
    setWasteFeedback(null)
    setWasteError('')
  }

  async function chooseScenario(optionId: string) {
    if (!scenario || scenarioResult) return
    const nextChoices = [...scenarioChoices, optionId]
    setScenarioChoices(nextChoices)
    if (scenarioIndex < scenarioSteps.length - 1) {
      setScenarioIndex((current) => current + 1)
      return
    }
    const response = await fetch('/api/games/student-day', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scenarioId: scenario.id, choices: nextChoices }),
    })
    const result = await response.json().catch(() => null)
    if (response.ok) setScenarioResult(result)
  }

  if (loading) return <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-[#31593d]">Đang tải trò chơi…</p>

  const item = wasteItems[wasteIndex]
  const step = scenarioSteps[scenarioIndex]

  return <div className="mt-6 grid gap-6 lg:grid-cols-2">
    <section className="rounded-[2rem] bg-white p-6 shadow-[0_10px_35px_#3c684d12]">
      <p className="text-sm font-black uppercase tracking-[0.15em] text-[#47714e]">Trò chơi 1</p>
      <h2 className="mt-2 text-2xl font-black text-[#173b2b]">Phân loại rác</h2>
      <p className="mt-2 text-sm leading-6 text-[#31593d]">Chọn đúng thùng cho từng loại rác. Độ khó tăng dần theo danh sách nội dung.</p>
      {item ? <><div className="mt-6 rounded-3xl bg-[#eff8e9] p-8 text-center"><p className="text-3xl font-black text-[#173b2b]">{item.name}</p><p className="mt-2 text-sm text-[#31593d]">Mức {item.difficulty}</p></div><div className="mt-4 grid grid-cols-2 gap-2">{categories.map(([value, label]) => <button key={value} onClick={() => sortWaste(value)} disabled={Boolean(wasteFeedback) || scoreToday >= 30} className="min-h-12 rounded-2xl border border-[#c7dfc1] px-3 text-sm font-black text-[#31593d] disabled:opacity-50">{label}</button>)}</div>{wasteError && <p role="alert" className="mt-3 text-sm font-bold text-[#9b4b2f]">{wasteError}</p>}{wasteFeedback && <div className="mt-4 rounded-2xl bg-[#f4fbf0] p-4 text-sm text-[#31593d]"><p className="font-black">{wasteFeedback.correct ? 'Chính xác.' : 'Chưa đúng.'}</p><p className="mt-1">{wasteFeedback.explanation}</p>{!wasteFeedback.correct && <p className="mt-1 font-bold">Thùng đúng: {categories.find(([value]) => value === wasteFeedback.correctCategory)?.[1]}</p>}<button onClick={nextWaste} className="mt-3 rounded-full bg-[#173b2b] px-4 py-2 font-bold text-white">Tiếp theo</button></div>}</> : <p className="mt-6 rounded-2xl bg-[#eff8e9] p-5 text-sm text-[#31593d]">Chưa có nội dung phân loại rác.</p>}
    </section>
    <section className="rounded-[2rem] bg-[#173b2b] p-6 text-white">
      <p className="text-sm font-black uppercase tracking-[0.15em] text-[#b8e45c]">Trò chơi 2</p>
      <h2 className="mt-2 text-2xl font-black">Một ngày của sinh viên</h2>
      {scenario && step ? <>{scenario.description && <p className="mt-2 text-sm leading-6 text-[#d2e4d5]">{scenario.description}</p>}<div className="mt-6 rounded-3xl bg-white/10 p-5"><p className="text-lg font-bold leading-7">{scenarioResult ? 'Tổng kết hành trình' : step.prompt}</p>{scenarioResult ? <><p className="mt-4 text-4xl font-black text-[#b8e45c]">{scenarioResult.planet}</p><p className="mt-2 text-sm text-[#d2e4d5]">điểm Hành tinh, cộng {scenarioResult.points} điểm game.</p><Link href="/thu-thach" className="mt-5 inline-flex rounded-full bg-[#b8e45c] px-4 py-3 text-sm font-black text-[#173b2b]">Nhận thử thách liên quan</Link></> : <div className="mt-5 grid gap-3">{step.options.map((option) => <button key={option.id} onClick={() => chooseScenario(option.id)} className="rounded-2xl border border-white/20 p-4 text-left text-sm font-bold hover:bg-white/10">{option.label}</button>)}</div>}</div></> : <p className="mt-6 rounded-2xl bg-white/10 p-5 text-sm text-[#d2e4d5]">Chưa có kịch bản đang hoạt động.</p>}
    </section>
  </div>
}
