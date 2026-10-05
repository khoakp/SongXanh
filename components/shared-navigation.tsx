'use client'

import { Menu, Sprout, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const links = [
  ['/','Trang chủ'],
  ['/thu-thach','Thử thách'],
  ['/tro-choi','Trò chơi'],
  ['/guong-sang','Gương sáng'],
  ['/chien-dich','Chiến dịch'],
  ['/cam-ket','Cam kết'],
  ['/xep-hang','Xếp hạng'],
]

export function SharedNavigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (pathname === '/') return null

  function closeMenu() {
    setOpen(false)
  }

  return <>
    <header className="border-b border-[#dcebdc] bg-[#f8fbf5] text-[#173b2b]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <a href="/" className="flex items-center gap-3" onClick={closeMenu} aria-label="Sống Xanh Campus - Trang chủ">
          <span className="grid size-9 place-items-center rounded-xl bg-[#b8e45c] shadow-[0_4px_0_#77ac4b]"><Sprout size={18} /></span>
          <span className="leading-none"><strong className="block text-base">Sống Xanh</strong><small className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5d8069]">Campus</small></span>
        </a>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-[#577464] lg:flex" aria-label="Điều hướng chính">
          {links.map(([href, label]) => <a key={href} href={href} className={pathname === href ? 'text-[#173b2b]' : 'hover:text-[#173b2b]'}>{label}</a>)}
          <a href={pathname === '/profile' ? '/profile' : '/auth/login'} className="rounded-full bg-[#173b2b] px-4 py-2 text-white">{pathname === '/profile' ? 'Hồ sơ' : 'Đăng nhập'}</a>
        </nav>
        <button type="button" className="rounded-xl p-2 lg:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Đóng menu' : 'Mở menu'}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <nav className="flex flex-col gap-4 border-t border-[#dcebdc] px-5 py-5 text-sm font-semibold lg:hidden" aria-label="Điều hướng điện thoại">{links.map(([href, label]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}<a href="/profile" onClick={closeMenu}>Hồ sơ</a><a href="/auth/login" onClick={closeMenu}>Đăng nhập</a></nav>}
    </header>
    <footer className="border-t border-[#dcebdc] bg-[#f1f7eb] px-5 py-8 text-sm text-[#6f8c76] lg:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-center"><strong className="text-[#31593d]">Sống Xanh Campus</strong><span>Lan tỏa thói quen xanh trong từng giảng đường.</span><span className="flex gap-4"><a href="/gioi-thieu">Giới thiệu</a><a href="/quyen-rieng-tu">Riêng tư</a><a href="/lien-he">Liên hệ</a></span></div></footer>
  </>
}
