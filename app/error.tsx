'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[v0] Application error:', error)
  }, [error])

  return <main className="grid min-h-screen place-items-center bg-[#f8fbf5] px-5 text-center text-[#173b2b]"><div><h1 className="text-3xl font-black">Không thể tải dữ liệu</h1><p className="mt-3 max-w-md text-base text-[#31593d]">Kết nối có thể đang gián đoạn. Vui lòng thử lại hoặc quay về trang chủ.</p><button onClick={reset} className="mt-6 min-h-11 rounded-full bg-[#173b2b] px-5 py-3 text-sm font-bold text-white">Thử lại</button></div></main>
}
