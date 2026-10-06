import { test, expect, type Page } from '@playwright/test'

const publicRoutes = ['/', '/gioi-thieu', '/lien-he', '/quyen-rieng-tu', '/thu-thach', '/thu-thach/hom-nay', '/tro-choi', '/guong-sang', '/chien-dich', '/cam-ket', '/carbon', '/xep-hang', '/profile', '/quan-tri', '/auth/login', '/auth/sign-up', '/auth/forgot-password', '/auth/update-password', '/guong-sang/khong-khi-sach-hieu-nguon-o-nhiem']
async function settled(page: Page) {
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  await expect(page.getByText('Đang tải nội dung xanh...', { exact: true })).toBeHidden()
}
async function shell(page: Page) {
  await expect(page.locator('header')).toHaveCount(1)
  await expect(page.locator('footer')).toHaveCount(1)
  await expect(page.locator('main')).toHaveCount(1)
  expect(await page.locator('[data-site-footer]').evaluate(footer => !!(document.querySelector('#page-content')!.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow').toBe(true)
  await expect(page.locator('[data-site-footer]')).toContainText('Dự án sinh viên')
  expect(await page.locator('[data-site-footer] section').last().locator('a,button,[tabindex]').count()).toBe(0)
}

for (const width of [375, 768, 1024, 1440]) {
  test(`shared shell, footer and sticky navigation at ${width}px`, async ({ page }) => {
    test.setTimeout(180000)
    await page.setViewportSize({ width, height: 900 })
    const routes = [...publicRoutes]
    for (const route of routes) {
      await page.goto(route)
      await settled(page)
      if (route === '/chien-dich') {
        const detail = await page.locator('main a[href^="/chien-dich/"]').first().getAttribute('href')
        if (detail) routes.push(detail)
      }
      await shell(page)
      expect(await page.locator('[data-site-header]').evaluate(header => getComputedStyle(header).position)).toBe('sticky')
      await page.evaluate(() => scrollTo(0, 600))
      const box = await page.locator('[data-site-header]').boundingBox()
      expect(box!.y).toBeGreaterThanOrEqual(-1)
      expect(box!.y).toBeLessThanOrEqual(1)
    }
    await page.goto('/')
    await settled(page)
    if (width < 1280) {
      const toggle = page.locator('button[aria-controls="site-mobile-menu"]')
      await toggle.focus()
      await page.keyboard.press('Enter')
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await expect(page.getByRole('navigation', { name: 'Điều hướng điện thoại' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(toggle).toBeFocused()
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(await toggle.evaluate(button => getComputedStyle(button).outlineStyle)).not.toBe('none')
      await toggle.click()
      await page.getByRole('navigation', { name: 'Điều hướng điện thoại' }).getByRole('link', { name: 'Thử thách', exact: true }).click()
      await settled(page)
      await expect(page.getByRole('navigation', { name: 'Điều hướng điện thoại' })).toBeHidden()
    }
    await page.goto('/')
    await settled(page)
    await page.screenshot({ path: `layout-home-${width}.png` })
    await page.locator('[data-site-footer]').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `layout-footer-${width}.png` })
  })
}

test('feature links and guest action redirects preserve the browser document', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await settled(page)
  let documents = 0
  page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++ })
  await page.evaluate(() => { (window as unknown as { layoutMarker: string }).layoutMarker = 'original-document' })
  for (const [title, route] of [['Thử thách', '/thu-thach'], ['Trò chơi', '/tro-choi'], ['Gương sáng', '/guong-sang'], ['Chiến dịch', '/chien-dich'], ['Xếp hạng', '/xep-hang']]) {
    await page.getByRole('navigation', { name: 'Điều hướng chính', exact: true }).getByRole('link', { name: title, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(route + '$'))
    await settled(page)
    expect(await page.evaluate(() => (window as unknown as { layoutMarker: string }).layoutMarker)).toBe('original-document')
  }
  await page.locator('[data-site-header]').getByRole('link', { name: 'Thử thách', exact: true }).click()
  await settled(page)
  await page.getByRole('button', { name: 'Nhận thử thách', exact: true }).first().click()
  await expect(page).toHaveURL(/\/auth\/login\?next=\/thu-thach$/)
  await settled(page)
  expect(documents).toBe(0)
  await page.locator('[data-site-header]').getByRole('link', { name: 'Cam kết', exact: true }).click()
  await settled(page)
  await page.getByRole('button', { name: 'Cam kết ngay', exact: true }).click()
  await expect(page).toHaveURL(/\/auth\/login\?next=\/cam-ket$/)
  expect(documents).toBe(0)
})

test('real homepage poster is fully contained and loads successfully', async ({ page }) => {
  await page.goto('/')
  await settled(page)
  const image = page.locator('main [data-image-frame] img').first()
  await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  expect(await image.evaluate(img => getComputedStyle(img).objectFit)).toBe('contain')
  await expect(image).toHaveAttribute('alt', /Poster Sống Xanh/)
  expect(await page.locator('main [data-image-frame]').first().evaluate(frame => getComputedStyle(frame).overflow)).toBe('hidden')
})

test('shared header reflects login, role switches and logout on home and protected pages', async ({ page }) => {
  test.setTimeout(120000)
  for (const role of ['ADMIN', 'USER', 'EDITOR']) {
    await page.goto('/auth/login')
    await page.locator('input[name=email]').fill(process.env[`TEST_${role}_EMAIL`]!)
    await page.locator('input[name=password]').fill(process.env[`TEST_${role}_PASSWORD`]!)
    await page.locator('form button').first().click()
    await page.waitForURL(url => url.pathname === '/profile')
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const route of ['/', '/profile', ...(role === 'USER' ? [] : ['/quan-tri'])]) {
        await page.goto(route)
        await settled(page)
        await shell(page)
        if (width < 1280) await page.locator('button[aria-controls="site-mobile-menu"]').click()
        const nav = page.getByRole('navigation', { name: width < 1280 ? 'Điều hướng điện thoại' : 'Điều hướng chính', exact: true })
        await expect(nav.getByRole('link', { name: 'Hồ sơ', exact: true })).toBeVisible()
        if (role === 'USER') await expect(nav.getByRole('link', { name: 'Quản trị', exact: true })).toHaveCount(0)
        else await expect(nav.getByRole('link', { name: 'Quản trị', exact: true })).toBeVisible()
        if (width < 1280) await page.keyboard.press('Escape')
      }
    }
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
    await page.waitForURL(url => url.pathname === '/')
    await settled(page)
    const nav = page.getByRole('navigation', { name: 'Điều hướng chính', exact: true })
    await expect(nav.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Quản trị', exact: true })).toHaveCount(0)
  }
})

test('actual article cards and details handle image shapes, absent covers and load errors', async ({ page }) => {
  test.setTimeout(60000)
  await page.route('**/layout-image/*.svg', route => {
    const variant = new URL(route.request().url()).pathname.split('/').at(-1)!.split('.')[0]
    if (variant === 'broken') return route.abort()
    const [width, height] = variant === 'portrait' ? [300, 600] : variant === 'landscape' ? [600, 300] : [400, 400]
    return route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#dff1c9"/><rect x="2" y="2" width="${width-4}" height="${height-4}" fill="none" stroke="#173b2b" stroke-width="4"/><text x="10" y="24" font-size="18">TOP EDGE</text><text x="10" y="${height-12}" font-size="18">BOTTOM EDGE</text></svg>` })
  })
  await page.goto('/layout-verification')
  await expect(page.locator('main').first().getByRole('heading', { name: 'Gương sáng campus', exact: true })).toBeVisible()
  for (const variant of ['portrait', 'landscape', 'square', 'broken', 'missing']) {
    const card = page.locator(`a[href="/guong-sang/layout-fixture-${variant}"]`)
    const detail = page.locator(`[data-fixture-detail="${variant}"]`)
    for (const container of [card, detail]) {
      const frame = container.locator('[data-image-frame]')
      await frame.scrollIntoViewIfNeeded()
      if (['broken', 'missing'].includes(variant)) await expect(frame.locator('[data-image-fallback]')).toBeVisible()
      else {
        const image = frame.locator('img')
        await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
        expect(await image.evaluate(img => getComputedStyle(img).objectFit)).toBe('contain')
        await expect(image).not.toHaveAttribute('alt', '')
        const imageBox = await image.boundingBox()
        const frameBox = await frame.boundingBox()
        expect(imageBox!.height).toBeLessThanOrEqual(frameBox!.height)
        expect(imageBox!.width).toBeLessThanOrEqual(frameBox!.width)
        expect(imageBox!.y).toBeGreaterThanOrEqual(frameBox!.y)
        expect(imageBox!.y + imageBox!.height).toBeLessThanOrEqual(frameBox!.y + frameBox!.height)
      }
      const box = await frame.boundingBox()
      expect(box!.height).toBeGreaterThan(50)
      expect(Math.abs(box!.width / box!.height - 1.6)).toBeLessThan(.05)
    }
    if (['broken', 'missing'].includes(variant)) await expect(detail.getByRole('link', { name: 'Xem ảnh đầy đủ' })).toHaveCount(0)
    else await expect(detail.getByRole('link', { name: 'Xem ảnh đầy đủ' })).toHaveAttribute('href', `/layout-image/${variant}.svg`)
    await page.locator('[data-site-header]').hover()
    await card.scrollIntoViewIfNeeded()
    const before = await card.boundingBox()
    const shadow = await card.evaluate(element => getComputedStyle(element).boxShadow)
    await card.hover()
    await expect.poll(() => card.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe(shadow)
    expect((await card.boundingBox())!.width).toBe(before!.width)
    if (!['broken', 'missing'].includes(variant)) expect(await card.locator('img').evaluate(img => getComputedStyle(img).transform)).toBe('none')
  }
  const decoration = page.locator('[data-decorative-fixture]')
  await decoration.scrollIntoViewIfNeeded()
  await decoration.hover()
  await expect.poll(() => decoration.locator('img').evaluate(img => getComputedStyle(img).scale)).toContain('1.03')
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.locator('main').first().scrollIntoViewIfNeeded()
    await page.screenshot({ path: `layout-images-${width}.png` })
    await page.locator('[data-fixture-detail="portrait"] [data-image-frame]').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `layout-portrait-detail-${width}.png` })
  }
})
