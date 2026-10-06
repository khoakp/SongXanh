'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = hash.get('access_token')
    const refreshToken = hash.get('refresh_token')
    if (!accessToken || !refreshToken) return
    void supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then((result: { error: Error | null }) => {
      if (result.error) setError('Liên kết khôi phục không hợp lệ hoặc đã hết hạn, vui lòng yêu cầu lại.')
      else window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`)
    })
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
    if (password !== confirmation) return setError('Mật khẩu nhập lại không khớp.')
    setLoading(true)
    const { error: updateError } = await createClient().auth.updateUser({ password })
    setLoading(false)
    if (updateError) return setError('Không thể cập nhật mật khẩu. Liên kết có thể đã hết hạn, vui lòng yêu cầu lại.')
    router.push('/profile')
    router.refresh()
  }

  return <main className="grid min-h-[60vh] place-items-center bg-[#f8fbf5] px-5 text-[#173b2b]"><section className="w-full max-w-md rounded-[2rem] bg-[#e8f5d7] p-7"><h1 className="text-3xl font-black">Đặt mật khẩu mới</h1><p className="mt-3 text-sm text-[#52705a]">Nhập mật khẩu mới cho tài khoản của bạn.</p><form onSubmit={submit} className="mt-6 flex flex-col gap-4"><input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu mới (ít nhất 8 ký tự)" className="rounded-2xl border border-[#cfe3c8] px-4 py-3" /><input type="password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Nhập lại mật khẩu" className="rounded-2xl border border-[#cfe3c8] px-4 py-3" />{error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}<button disabled={loading} className="rounded-full bg-[#173b2b] px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button></form></section></main>
}
