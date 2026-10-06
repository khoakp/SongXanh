'use client'

import Link from 'next/link'
import { Menu, Sprout, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

const links = [
  ['/', 'Trang chủ'], ['/thu-thach', 'Thử thách'], ['/tro-choi', 'Trò chơi'],
  ['/guong-sang', 'Gương sáng'], ['/chien-dich', 'Chiến dịch'],
  ['/cam-ket', 'Cam kết'], ['/xep-hang', 'Xếp hạng'], ['/carbon', 'Carbon'],
] as const
type Account = { id: string; role: string } | null

function NavigationLinks({ pathname, account, close, mobile = false }: { pathname: string; account: Account; close?: () => void; mobile?: boolean }) {
  return <>
    {links.map(([href, label]) => <Link key={href} href={href} onClick={close} aria-current={pathname === href || (href !== '/' && pathname.startsWith(href + '/')) ? 'page' : undefined} className="site-nav-link">{label}</Link>)}
    {['admin', 'editor'].includes(account?.role || '') && <Link href="/quan-tri" onClick={close} className="rounded-full border border-[#bcd5b6] px-4 py-2 text-[#173b2b]">Quản trị</Link>}
    <Link href={account ? '/profile' : `/auth/login?next=${encodeURIComponent(pathname)}`} onClick={close} className="rounded-full bg-[#173b2b] px-4 py-2.5 text-center text-white">{account ? 'Hồ sơ' : 'Đăng nhập'}</Link>
    {!account && mobile && <Link href="/auth/sign-up" onClick={close} className="rounded-full border border-[#bcd5b6] px-4 py-2.5 text-center">Tham gia ngay</Link>}
  </>
}

function MobileMenu({ pathname, account }: { pathname: string; account: Account }) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); button.current?.focus() }
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [open])
  return <div className="xl:hidden">
    <button ref={button} type="button" className="grid size-11 place-items-center rounded-xl hover:bg-[#e8f5d7]" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="site-mobile-menu" aria-label={open ? 'Đóng menu' : 'Mở menu'}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
    {open && <nav id="site-mobile-menu" className="absolute inset-x-0 top-full flex max-h-[calc(100dvh-5rem)] flex-col gap-3 overflow-y-auto border-b border-[#dcebdc] bg-[#f8fbf5] px-5 py-5 text-sm font-semibold shadow-lg" aria-label="Điều hướng điện thoại"><NavigationLinks pathname={pathname} account={account} close={() => setOpen(false)} mobile /></nav>}
  </div>
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [account, setAccount] = useState<Account>(null)
  // Preserve auth-event scheduling and generation guards from the verified
  // session synchronization; a stale request must never restore an old role.
  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    let generation = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    async function loadAccount(version: number) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted || version !== generation) return
      if (!user) { setAccount(null); return }
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
      if (mounted && version === generation) setAccount({ id: user.id, role: String(profile?.role || '') })
    }
    void loadAccount(generation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      const version = ++generation
      if (timer) clearTimeout(timer)
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || !session) setAccount(null)
      timer = setTimeout(() => {
        if (!mounted || version !== generation) return
        if (session) void loadAccount(version)
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') router.refresh()
      }, 0)
    })
    return () => { mounted = false; ++generation; if (timer) clearTimeout(timer); subscription.unsubscribe() }
  }, [router])

  return <header data-site-header className="sticky top-0 z-50 shrink-0 border-b border-[#dcebdc] bg-[#f8fbf5]/95 text-[#173b2b] backdrop-blur">
    <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-3 rounded-xl" aria-label="Sống Xanh Campus - Trang chủ"><span className="grid size-10 place-items-center rounded-2xl bg-[#b8e45c] shadow-[0_4px_0_#77ac4b]"><Sprout size={21} aria-hidden="true" /></span><span className="leading-none"><strong className="block text-lg tracking-tight">Sống Xanh</strong><small className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5d8069]">Campus</small></span></Link>
      <nav className="hidden items-center gap-4 text-sm font-semibold text-[#577464] xl:flex" aria-label="Điều hướng chính"><NavigationLinks pathname={pathname} account={account} /></nav>
      <MobileMenu key={pathname} pathname={pathname} account={account} />
    </div>
  </header>
}
