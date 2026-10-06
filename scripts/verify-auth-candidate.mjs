import { chromium } from '@playwright/test'
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  let fatal = 0
  page.on('pageerror', () => fatal++)
  const response = await page.goto(process.env.BASE_URL + '/')
  if (new URL(page.url()).hostname !== 'vercel.com') await page.getByRole('navigation', { name: 'Điều hướng chính', exact: true }).waitFor({ state: 'visible' })
  const navigation = await page.getByRole('navigation').all()
  const visibleNavigation = (await Promise.all(navigation.map(item => item.isVisible()))).filter(Boolean).length
  console.log(JSON.stringify({
    status: response.status(),
    final_host: new URL(page.url()).hostname,
    main_navigation_count: navigation.length,
    visible_navigation_count: visibleNavigation,
    page_title: await page.title(),
    fatal_js_errors: fatal,
    vercel_auth_required: new URL(page.url()).hostname === 'vercel.com',
  }))
} finally { await browser.close() }
