import Link from 'next/link'
import { GraduationCap, MessageCircle, Sprout } from 'lucide-react'

export function SiteFooter() {
  return <footer data-site-footer className="shrink-0 border-t border-[#dcebdc] bg-[#f1f7eb] px-5 py-10 text-[#31593d] lg:px-8">
    <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
      <div><Link href="/" className="inline-flex items-center gap-3 rounded-xl font-black"><span className="grid size-9 place-items-center rounded-xl bg-[#b8e45c]"><Sprout size={20} aria-hidden="true" /></span>Sống Xanh Campus</Link><p className="mt-4 max-w-sm text-sm leading-7">Dự án website được xây dựng với mục đích học tập và nâng cao nhận thức về lối sống xanh trong cộng đồng sinh viên.</p></div>
      <section aria-labelledby="footer-project"><h2 id="footer-project" className="font-black">Dự án</h2><p className="mt-4 flex items-center gap-2 text-sm font-semibold"><GraduationCap size={19} aria-hidden="true" /> Dự án sinh viên</p><p className="mt-3 text-sm leading-7">Không gian học tập và thực hành xây dựng thói quen xanh.</p></section>
      <nav aria-label="Liên kết thông tin"><h2 className="font-black">Liên kết</h2><ul className="mt-4 space-y-3 text-sm"><li><Link href="/gioi-thieu">Giới thiệu</Link></li><li><Link href="/quyen-rieng-tu">Quyền riêng tư</Link></li><li><Link href="/lien-he">Liên hệ</Link></li></ul></nav>
      <section aria-labelledby="footer-channels"><h2 id="footer-channels" className="font-black">Kênh kết nối</h2><ul className="mt-4 space-y-3 text-sm"><li className="flex items-center gap-2"><span aria-hidden="true" className="grid size-5 place-items-center rounded-md border border-[#adc6a5] font-black">f</span>Facebook</li><li className="flex items-center gap-2"><MessageCircle size={18} aria-hidden="true" /> Messenger</li><li className="flex items-center gap-2"><span aria-hidden="true" className="grid size-5 place-items-center rounded-md border border-[#adc6a5] text-xs font-black">Z</span>Zalo</li></ul><p className="mt-3 text-xs leading-6">Đang cập nhật thông tin các kênh.</p></section>
    </div>
    <p className="mx-auto mt-8 max-w-7xl border-t border-[#d5e5cb] pt-5 text-xs leading-6">Sống Xanh Campus · Dự án sinh viên phục vụ học tập.</p>
  </footer>
}
