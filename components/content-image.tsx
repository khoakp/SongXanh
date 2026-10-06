'use client'

import { useState } from 'react'
import { Leaf } from 'lucide-react'

type Props = { src?: string | null; alt: string; className?: string; decorative?: boolean; fit?: 'contain' | 'cover'; interactive?: boolean; eager?: boolean; fullView?: boolean }

// Informational images retain all edges. Only deliberately decorative photos
// may opt into cover/zoom; contain images never zoom past the visible frame.
export function ContentImage({ src, ...props }: Props) {
  return <ImageFrame key={src || 'fallback'} src={src} {...props} />
}
function ImageFrame({ src, alt, className = 'aspect-[16/10]', decorative = false, fit = 'contain', interactive = false, eager = false, fullView = false }: Props) {
  const [failed, setFailed] = useState(false)
  return <><div data-image-frame data-image-fit={fit} className={`relative grid place-items-center overflow-hidden rounded-[1.75rem] border border-[#d7e7cc] bg-[#e8f5d7] ${className}`}>
    {src && !failed ? <img ref={image => { if (image?.complete && image.naturalWidth === 0) setFailed(true) }} src={src} alt={decorative ? '' : alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} className={`absolute inset-0 h-full w-full transition-transform duration-300 motion-reduce:transition-none ${fit === 'contain' ? 'object-contain p-3' : 'object-cover'} ${interactive && fit === 'cover' ? 'motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03]' : ''}`} /> : <div data-image-fallback className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 p-5 text-[#60913f]" role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : `Minh họa Sống Xanh: ${alt}`} aria-hidden={decorative || undefined}><Leaf size={48} aria-hidden="true" /><span className="text-xs font-bold">Sống Xanh Campus</span></div>}
  </div>{fullView && src && !failed && /^(https?:\/\/|\/(?!\/))/.test(src) && <a href={src} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-lg text-sm font-bold text-[#47714e] underline underline-offset-4">Xem ảnh đầy đủ</a>}</>
}
