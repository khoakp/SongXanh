import { Mail } from 'lucide-react'
import type { ReactNode } from 'react'
import { DownloadableAssets } from '@/components/share-card'

type InfoPageProps = { eyebrow: string; title: string; intro: string; children: ReactNode }
export function InfoPage({ eyebrow, title, intro, children }: InfoPageProps) { return <main className="min-h-[60vh] bg-[#f8fbf5] text-[#173b2b]"><article className="mx-auto max-w-4xl px-5 py-14 sm:py-20"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#47714e]">{eyebrow}</p><h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#31593d]">{intro}</p><div className="mt-10 space-y-8 text-base leading-8 text-[#31593d]">{children}</div></article></main> }
export function InfoSection({ title, children }: { title: string; children: ReactNode }) { return <section><h2 className="text-2xl font-black text-[#173b2b]">{title}</h2><div className="mt-3">{children}</div></section> }
export function ContactLink() { const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'Chưa cấu hình email liên hệ'; return email.includes('@') ? <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173b2b] px-5 py-3 text-sm font-bold text-white"><Mail size={16} /> {email}</a> : <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#c2ddbd] bg-white px-5 py-3 text-sm font-bold text-[#31593d]"><Mail size={16} /> {email}</span> }
export { DownloadableAssets }
