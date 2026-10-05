import Link from 'next/link'

export const metadata = { title: 'Không tìm thấy trang | Sống Xanh Campus' }

export default function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center bg-[#f8fbf5] px-5 text-center text-[#173b2b]"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#31593d]">404</p><h1 className="mt-3 text-3xl font-black">Trang này chưa tồn tại</h1><p className="mt-3 max-w-md text-base text-[#31593d]">Có thể đường dẫn đã thay đổi hoặc nội dung chưa được đăng.</p><Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#173b2b] px-5 py-3 text-sm font-bold text-white">Về trang chủ</Link></div></main>
}
