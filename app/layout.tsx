import { Analytics } from '@vercel/analytics/next'
import { Be_Vietnam_Pro } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SharedNavigation } from '@/components/shared-navigation'

const beVietnamPro = Be_Vietnam_Pro({ weight: ['400', '600', '700', '800'], subsets: ['vietnamese', 'latin'], display: 'swap', variable: '--font-be-vietnam-pro' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Sống Xanh Campus | Cùng nhau xanh hơn',
  description: 'Nền tảng giúp sinh viên đo lường tác động, tham gia thử thách và lan tỏa lối sống xanh trong campus.',
  openGraph: { title: 'Sống Xanh Campus | Cùng nhau xanh hơn', description: 'Cùng campus xây dựng những thói quen xanh mỗi ngày.', images: [{ url: '/og-song-xanh.png', width: 1200, height: 630, alt: 'Sống Xanh Campus' }], locale: 'vi_VN', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Sống Xanh Campus | Cùng nhau xanh hơn', description: 'Cùng campus xây dựng những thói quen xanh mỗi ngày.', images: ['/og-song-xanh.png'] },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${beVietnamPro.variable} antialiased`}>
        <SharedNavigation />
        {children}
        {process.env.VERCEL === '1' && <Analytics />}
      </body>
    </html>
  )
}
