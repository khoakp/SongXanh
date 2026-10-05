'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(formData: FormData) {
    setLoading(true)
    setError('')
    setMessage('')

    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const supabase = createClient()
    const redirectUrl = `${window.location.origin}/auth/callback`
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: String(formData.get('display_name') || '').trim(),
              school: String(formData.get('school') || '').trim(),
              faculty: String(formData.get('faculty') || '').trim(),
              class_name: String(formData.get('class_name') || '').trim(),
            },
          },
        })

    setLoading(false)
    if (result.error) {
      setError(result.error.message.includes('Invalid') ? 'Email hoặc mật khẩu chưa đúng.' : 'Có lỗi xảy ra. Vui lòng thử lại.')
    } else if (mode === 'signup' && !result.data.session) {
      setMessage('Hãy kiểm tra email để xác nhận tài khoản.')
    } else {
      router.push('/profile')
    }
  }
  async function google() { const supabase = createClient(); await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback` } }) }
  return <form action={submit} className="flex flex-col gap-4">{mode === 'signup' && <><input name="display_name" required placeholder="Tên hiển thị" className="rounded-2xl border border-[#cfe3c8] bg-white px-4 py-3" /><input name="school" required placeholder="Trường" className="rounded-2xl border border-[#cfe3c8] bg-white px-4 py-3" /><input name="faculty" required placeholder="Khoa" className="rounded-2xl border border-[#cfe3c8] bg-white px-4 py-3" /><input name="class_name" required placeholder="Lớp" className="rounded-2xl border border-[#cfe3c8] bg-white px-4 py-3" /></>}<input name="email" type="email" required placeholder="Email" className="rounded-2xl border border-[#cfe3c8] bg-white px-4 py-3" /><input name="password" type="password" required minLength={8} placeholder="Mật khẩu (ít nhất 8 ký tự)" className="rounded-2xl border border-[#cfe3c8] bg-white px-4 py-3" />{error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}{message && <p className="text-sm font-bold text-[#4d813e]">{message}</p>}<button disabled={loading} className="rounded-full bg-[#173b2b] px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button><button type="button" onClick={google} className="rounded-full border border-[#bcd5b6] bg-white px-5 py-3 font-bold text-[#173b2b]">Tiếp tục với Google</button>{mode === 'login' && <a href="/auth/forgot-password" className="text-center text-sm font-bold text-[#47714e]">Quên mật khẩu?</a>}</form>
}
