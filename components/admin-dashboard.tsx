'use client'

import Link from 'next/link'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminForm } from '@/components/admin-form'

type Row = Record<string, unknown> & { id?: string }
type Props = { stats: { users: number; tasks: number; carbon: number; reads: number; byDay: { day: string; value: number }[] }; role: string; data: Record<string, Row[]> }
const sections = [['overview', 'Tổng quan'], ['challenges', 'Thử thách'], ['tasks', 'Nhiệm vụ'], ['waste_items', 'Phân loại rác'], ['game_scenarios', 'Kịch bản game'], ['articles', 'Bài viết'], ['quiz', 'Câu hỏi Đúng/Sai'], ['campaigns', 'Chiến dịch'], ['deletion_requests', 'Yêu cầu xóa dữ liệu'], ['users', 'Người dùng'], ['factors', 'Hệ số & huy hiệu']] as const

export function AdminDashboard({ stats, role, data }: Props) {
  const router = useRouter()
  const [active, setActive] = useState<(typeof sections)[number][0]>('overview')
  const [message, setMessage] = useState('')
  const rows = data[active] ?? []
  const [form, setForm] = useState<Record<string, string | boolean>>({})
  const editable = active !== 'overview' && (role === 'admin' || ['articles', 'quiz', 'campaigns', 'deletion_requests'].includes(active))
  const deletionRows = data.deletion_requests ?? []

  function exportCsv() {
    const headers = rows[0] ? Object.keys(rows[0]).map((key) => ({ id: 'Mã', title: 'Tiêu đề', name: 'Tên', description: 'Mô tả', email: role === 'admin' ? 'Email' : 'Email' }[key] ?? key)) : ['Ngày', 'Nhiệm vụ hoàn thành']
    const exportRows = active === 'overview' ? [['Ngày', 'Nhiệm vụ hoàn thành'], ...stats.byDay.map((item) => [item.day, String(item.value)])] : [headers, ...rows.map((row) => Object.values(row).map((value) => String(value ?? '')))]
    const csv = exportRows.map((row) => row.map((cell) => String(cell).replaceAll('"', '""')).map((cell) => `"${cell}"`).join(',')).join('\\n')
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = `song-xanh-${active}.csv`; link.click(); URL.revokeObjectURL(link.href)
  }

  async function saveContent() {
    const response = await fetch('/api/quan-tri', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ table: active, values: form }) })
    const result = await response.json().catch(() => null)
    setMessage(response.ok ? 'Đã lưu và ghi nhật ký.' : result?.saved ? 'Bản ghi đã lưu nhưng ghi nhật ký thất bại. Không gửi lại.' : 'Không thể lưu dữ liệu.')
    if (response.ok || result?.saved) { setForm({}); router.refresh() }
  }

  async function updateStatus(table: string, id: string, field: string, value: boolean) {
    const response = await fetch('/api/quan-tri', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ table, id, field, value }) })
    setMessage(response.ok ? 'Đã cập nhật dữ liệu.' : 'Không thể cập nhật. Vui lòng kiểm tra quyền.')
    if (response.ok) router.refresh()
  }

  async function deleteRow(table: string, id: string) {
    if (!window.confirm('Bạn có chắc muốn xóa bản ghi này không?')) return
    const response = await fetch('/api/quan-tri', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ table, id }) })
    setMessage(response.ok ? 'Đã xóa và ghi nhật ký.' : 'Không thể xóa dữ liệu. Vui lòng kiểm tra quyền.')
    if (response.ok) router.refresh()
  }

  return <main className="min-h-[60vh] bg-[#f5f8ef] px-4 py-6 text-[#173b2b] sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#6da347]">Không gian biên tập</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">Quản trị Sống Xanh</h1><p className="mt-3 text-sm font-semibold text-[#4f6b59]">Vai trò hiện tại: {role === 'admin' ? 'Admin' : 'Editor'}</p></div><button onClick={exportCsv} className="rounded-full bg-[#173b2b] px-5 py-3 text-sm font-bold text-white">Xuất CSV</button></div><div className="mt-8 grid gap-3 sm:grid-cols-4"><Stat label="Người dùng" value={stats.users}/><Stat label="Nhiệm vụ hoàn thành" value={stats.tasks}/><Stat label="CO₂ giảm (kg)" value={stats.carbon.toFixed(1)}/><Stat label="Lượt đọc bài" value={stats.reads}/></div><div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]"><nav className="flex gap-2 overflow-x-auto lg:flex-col">{sections.map(([id, label]) => <button key={id} onClick={() => setActive(id)} className={`shrink-0 rounded-2xl px-4 py-3 text-left text-sm font-bold ${active === id ? 'bg-[#173b2b] text-white' : 'bg-white text-[#4f6b59]'}`}>{label}</button>)}</nav><section className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-black">{sections.find(([id]) => id === active)?.[1]}</h2><p className="mt-1 text-sm text-[#4f6b59]">{rows.length ? `${rows.length} bản ghi từ cơ sở dữ liệu` : 'Chưa có dữ liệu.'}</p></div>{message && <span className="text-xs font-bold text-[#4f7e43]">{message}</span>}</div>{active === 'overview' ? <Overview byDay={stats.byDay}/> : <><AdminForm active={active} editable={editable} form={form} setForm={setForm} onSave={saveContent}/><div className="mt-6 space-y-3">{rows.map((row) => <AdminRow key={String(row.id)} row={row} section={active} role={role} onUpdate={updateStatus} onDelete={deleteRow}/>)}</div></>}</section></div></div></main>
}
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold text-[#4f6b59]">{label}</p><strong className="mt-2 block text-2xl font-black">{value}</strong></div> }
function AdminRow({ row, section, role, onUpdate, onDelete }: { row: Row; section: string; role: string; onUpdate: (table: string, id: string, field: string, value: boolean) => void; onDelete: (table: string, id: string) => void }) { const id = String(row.id); const label = String(row.title ?? row.name ?? row.display_name ?? row.question ?? 'Bản ghi'); const field = section === 'users' ? 'locked' : section === 'factors' ? 'active' : ['articles', 'campaigns'].includes(section) ? 'published' : section === 'deletion_requests' ? 'status' : 'active'; const table = section === 'quiz' ? 'quiz' : section; const value = Boolean(row[field]); const canEdit = section === 'deletion_requests' ? role === 'admin' : role === 'admin' || ['articles', 'quiz', 'campaigns'].includes(section); const canDelete = role === 'admin' && ['challenges', 'tasks', 'articles', 'quiz', 'campaigns', 'factors', 'badges', 'waste_items', 'game_scenarios', 'game_scenario_steps'].includes(section); return <div className="flex flex-col gap-3 rounded-2xl border border-[#e5eedf] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{label}</p>{section === 'articles' && typeof row.slug === 'string' && <Link className="text-sm underline" href={`/guong-sang/${row.slug}`} target="_blank" rel="noreferrer">Xem trước bài viết</Link>}<p className="mt-1 text-xs text-[#4f6b59]">{row.category ? String(row.category) : row.school ? String(row.school) : 'Dữ liệu cơ sở dữ liệu'}</p></div><div className="flex flex-wrap gap-2">{canEdit && <button onClick={() => onUpdate(table, id, field, !value)} className="rounded-full border border-[#aac59e] px-4 py-2 text-xs font-bold text-[#31593d]">{section === 'users' ? (value ? 'Mở khóa' : 'Khóa tài khoản') : (value ? 'Tắt' : 'Bật')}</button>}{canDelete && <button onClick={() => onDelete(table, id)} className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700">Xóa</button>}</div></div> }
function Overview({ byDay }: { byDay: { day: string; value: number }[] }) { const max = Math.max(...byDay.map((item) => item.value), 1); return <div className="mt-8"><p className="text-sm font-bold">Nhiệm vụ hoàn thành theo ngày</p><div className="mt-5 flex h-52 items-end gap-2 overflow-x-auto border-b border-[#dcebdc] pb-2">{byDay.map((item) => <div key={item.day} className="flex min-w-8 flex-col items-center justify-end gap-2"><div className="w-6 rounded-t-lg bg-[#8fc76b]" style={{ height: `${Math.max(8, item.value / max * 160)}px` }} /><span className="text-xs font-semibold text-[#4f6b59]">{item.day.slice(5)}</span></div>)}</div></div> }

// Admin and editor authorization is enforced again in the server route and app page.
// Mutating users, factors, and badges should remain admin-only in the API.
