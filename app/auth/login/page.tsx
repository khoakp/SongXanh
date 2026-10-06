import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { authDestination } from '@/lib/auth-redirect'
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string | string[] }> }) { const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: account } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    redirect(authDestination(typeof params.next === 'string' ? params.next : null, String(account?.role || user.app_metadata?.role || '')))
  }
  return <main className="grid min-h-[60vh] place-items-center bg-[#f8fbf5] px-5 py-10 font-sans text-[#173b2b]"><section className="w-full max-w-md rounded-[2rem] bg-[#e8f5d7] p-6 shadow-lg sm:p-9"><Link href="/" className="text-sm font-bold text-[#47714e]">← Sống Xanh Campus</Link><h1 className="mt-8 text-4xl font-black">Chào mừng trở lại</h1><p className="mt-3 mb-7 text-[#52705a]">Đăng nhập để tiếp tục hành trình xanh.</p>{params.error === 'callback' && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">Đăng nhập Google không thành công. Vui lòng thử lại.</p>}<AuthForm mode="login" /><p className="mt-6 text-center text-sm">Chưa có tài khoản? <Link className="font-bold underline" href="/auth/sign-up">Tham gia ngay</Link></p></section></main> }
