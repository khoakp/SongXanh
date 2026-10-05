'use client'

import type { ChangeEvent, Dispatch, SetStateAction } from 'react'

type FormState = Record<string, string | boolean>
const fields: Record<string, { key: string; label: string; type?: string }[]> = {
  articles: [
    { key: 'title', label: 'Tiêu đề' },
    { key: 'slug', label: 'Slug' },
    { key: 'category', label: 'Loại' },
    { key: 'excerpt', label: 'Tóm tắt' },
    { key: 'content', label: 'Nội dung', type: 'textarea' },
    { key: 'source', label: 'Nguồn' },
    { key: 'source_url', label: 'Đường dẫn nguồn' },
    { key: 'author_name', label: 'Tác giả' },
  ],
  quiz: [
    { key: 'question', label: 'Nội dung câu hỏi' },
    { key: 'answer', label: 'Đáp án true/false' },
    { key: 'explanation', label: 'Giải thích', type: 'textarea' },
    { key: 'source', label: 'Nguồn' },
  ],
  campaigns: [
    { key: 'name', label: 'Tên chiến dịch' },
    { key: 'description', label: 'Thông điệp', type: 'textarea' },
    { key: 'starts_at', label: 'Bắt đầu', type: 'datetime-local' },
    { key: 'ends_at', label: 'Kết thúc', type: 'datetime-local' },
    { key: 'banner_url', label: 'URL banner' },
  ],
  challenges: [
    { key: 'title', label: 'Tên thử thách' },
    { key: 'description', label: 'Mô tả', type: 'textarea' },
    { key: 'points', label: 'Điểm', type: 'number' },
    { key: 'duration_days', label: 'Số ngày', type: 'number' },
    { key: 'topic', label: 'Chủ đề' },
  ],
  factors: [
    { key: 'name', label: 'Tên hệ số' },
    { key: 'value', label: 'Giá trị', type: 'number' },
    { key: 'unit', label: 'Đơn vị' },
    { key: 'source', label: 'Nguồn' },
    { key: 'source_year', label: 'Năm', type: 'number' },
  ],
}

export function AdminForm({ active, editable, form, setForm, onSave }: { active: string; editable: boolean; form: FormState; setForm: Dispatch<SetStateAction<FormState>>; onSave: () => void }) {
  if (!editable || !fields[active]) return null
  const config = fields[active]
  return <div className="mt-6 rounded-2xl border border-[#dcebdc] bg-[#f8fbf5] p-4">
    <h3 className="font-black">Soạn bản ghi mới</h3>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {config.map((field) => {
        const common = { value: String(form[field.key] ?? ''), onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [field.key]: event.target.value })), className: 'rounded-xl border border-[#cfe1c9] bg-white px-3 py-2 text-sm outline-none' }
        return field.type === 'textarea' ? <textarea key={field.key} {...common} rows={4} placeholder={field.label} /> : <input key={field.key} {...common} type={field.type ?? 'text'} placeholder={field.label} />
      })}
    </div>
    <div className="mt-4 flex flex-wrap gap-3">
      {active === 'articles' && <select value={String(form.review_status ?? 'draft')} onChange={(event) => setForm((current) => ({ ...current, review_status: event.target.value }))} className="rounded-xl border border-[#cfe1c9] bg-white px-3 py-2 text-sm"><option value="draft">Nháp</option><option value="pending">Chờ duyệt</option><option value="published">Đã đăng</option></select>}
      <button onClick={onSave} className="rounded-full bg-[#173b2b] px-5 py-2 text-sm font-bold text-white">Lưu bản ghi</button>
    </div>
  </div>
}
