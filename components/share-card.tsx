'use client'

import { Download, Share2 } from 'lucide-react'

export function ShareCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  async function share() {
    const canvas = document.createElement('canvas')
    canvas.width = 1200; canvas.height = 630
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.fillStyle = '#173b2b'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#b8e45c'; ctx.font = '700 30px sans-serif'; ctx.fillText('SỐNG XANH CAMPUS', 70, 78)
    ctx.fillStyle = '#ffffff'; ctx.font = '700 58px sans-serif'; ctx.fillText(title, 70, 220)
    ctx.fillStyle = '#dff1c9'; ctx.font = '700 76px sans-serif'; ctx.fillText(value, 70, 335)
    ctx.font = '400 28px sans-serif'; ctx.fillText(subtitle, 70, 395)
    ctx.fillStyle = '#b8e45c'; ctx.font = '700 28px sans-serif'; ctx.fillText('#SongXanhCampus', 70, 545)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return
    const file = new File([blob], 'song-xanh-campus.png', { type: 'image/png' })
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title, text: `${value} · ${subtitle}`, files: [file] })
    else { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = file.name; link.click(); URL.revokeObjectURL(url) }
  }
  return <button onClick={share} className="inline-flex items-center gap-2 rounded-full bg-[#173b2b] px-5 py-3 text-sm font-bold text-white"><Share2 size={16} /> Chia sẻ thẻ</button>
}

export function DownloadableAssets() {
  function download(kind: string, label: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="100%" height="100%" rx="48" fill="#173b2b"/><text x="70" y="150" fill="#b8e45c" font-family="Arial" font-size="36" font-weight="700">SỐNG XANH CAMPUS</text><text x="70" y="300" fill="white" font-family="Arial" font-size="64" font-weight="700">${label}</text><text x="70" y="520" fill="#dff1c9" font-family="Arial" font-size="30">#SongXanhCampus</text></svg>`
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); const a = document.createElement('a'); a.href = url; a.download = `song-xanh-${kind}.svg`; a.click(); URL.revokeObjectURL(url)
  }
  return <div className="grid gap-3 sm:grid-cols-3">{[['poster','Poster Sống Xanh'],['sticker','Sticker Sống Xanh'],['avatar','Khung ảnh Tôi sống xanh']].map(([kind, label]) => <button key={kind} onClick={() => download(kind, label)} className="rounded-2xl border border-[#cde6bd] bg-white px-4 py-4 text-left text-sm font-bold text-[#31593d]">Tải {label}</button>)}</div>
}
