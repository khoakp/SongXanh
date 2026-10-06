import { test, expect, type Page } from '@playwright/test'
import { authNext, authDestination, authCallbackUrl } from '../lib/auth-redirect'

type Account = 'USER' | 'EDITOR' | 'ADMIN'
const credential = (account: Account, part: 'EMAIL' | 'PASSWORD') => process.env['TEST_' + account + '_' + part]!
const authCookies = async (page: Page) => (await page.context().cookies()).filter(c => /^sb-.*-auth-token(?:\.\d+)?$/.test(c.name))
async function login(page: Page, account: Account, path = '/auth/login', expected = '/profile') {
  await page.goto(path)
  await page.locator('input[name=email]').fill(credential(account, 'EMAIL'))
  await page.locator('input[name=password]').fill(credential(account, 'PASSWORD'))
  await page.locator('form button').first().click()
  await page.waitForURL(url => url.pathname === expected)
}
async function identity(page: Page, account: Account) {
  await expect(page.getByRole('heading', { name: 'Hồ sơ của bạn', exact: true })).toBeVisible()
  expect((await page.locator('main').innerText()).includes(credential(account, 'EMAIL')), 'Expected account identity (redacted)').toBe(true)
  expect((await authCookies(page)).length > 0, 'Supabase session cookies exist; values not inspected').toBe(true)
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => /auth-token|access_token|refresh_token/.test(key))), 'No application token persistence in localStorage').toBe(false)
}
async function logout(page: Page) {
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/')
  expect((await authCookies(page)).length, 'Logout removes Supabase session cookies').toBe(0)
  await page.goto('/profile')
  await expect(page.locator('input[name=email]')).toBeVisible()
}
test('safe redirect policy covers root, external URLs, encoded separators and admin roles', () => {
  for (const unsafe of [null, '/', '//evil.example', 'https://evil.example', '/\\evil.example', '/%5cevil.example', '/%2fevil.example', '/%0devil.example', '/auth/callback', '/auth/login', '/%']) expect(authNext(unsafe)).toBe('/profile')
  expect(authNext('/thu-thach?topic=food')).toBe('/thu-thach?topic=food')
  expect(authDestination('/quan-tri', 'user')).toBe('/profile')
  expect(authDestination('/quan-tri', 'admin')).toBe('/quan-tri')
  expect(authDestination('/quan-tri', 'editor')).toBe('/quan-tri')
  expect(authCallbackUrl('https://old-project.vercel.app', '/')).toBe('https://song-xanh.vercel.app/auth/callback?next=%2Fprofile')
  expect(authCallbackUrl('http://localhost:3000', '/thu-thach')).toBe('http://localhost:3000/auth/callback?next=%2Fthu-thach')
})
test('existing user logs in, reloads, logs out, logs in again and reloads', async ({ page }) => {
  const errors: string[] = []
  const authFailures: string[] = []
  page.on('pageerror', () => errors.push('uncaught JS error'))
  page.on('response', response => {
    const path = new URL(response.url()).pathname
    if (!path.startsWith('/auth/v1/') && path !== '/auth/sign-out') return
    // Browser SDK cleanup may encounter an already-revoked server session.
    if (path === '/auth/v1/logout' && [401, 403].includes(response.status())) return
    if (response.status() >= 400) authFailures.push(response.status() + ' ' + path)
  })
  page.on('requestfailed', request => {
    const path = new URL(request.url()).pathname
    if ((path.startsWith('/auth/v1/') || path === '/auth/sign-out') && request.failure()?.errorText !== 'net::ERR_ABORTED') authFailures.push('network failure ' + path)
  })
  page.on('console', message => {
    // Keep diagnostics generic: console text can contain credential URLs.
    if (message.type() === 'error') errors.push('browser console error')
  })
  for (let attempt = 0; attempt < 2; attempt++) {
    await login(page, 'USER')
    await identity(page, 'USER')
    await page.reload()
    await identity(page, 'USER')
    await logout(page)
  }
  expect(errors).toEqual([])
  expect(authFailures).toEqual([])
})
test('switching authorized password accounts clears previous profile and role', async ({ page }) => {
  await login(page, 'ADMIN')
  await identity(page, 'ADMIN')
  await expect(page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Quản trị', exact: true })).toBeVisible()
  await logout(page)
  await login(page, 'USER')
  await identity(page, 'USER')
  expect((await page.locator('main').innerText()).includes(credential('ADMIN', 'EMAIL')), 'Previous identity absent (redacted)').toBe(false)
  await expect(page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Quản trị', exact: true })).toHaveCount(0)
  await page.reload()
  await identity(page, 'USER')
  await logout(page)
})
test('password login destinations and unauthorized admin destination follow the shared policy', async ({ page }) => {
  for (const [next, expected] of [['/', '/profile'], ['/profile', '/profile'], ['/thu-thach', '/thu-thach'], ['/quan-tri', '/profile'], ['//evil.example', '/profile'], ['https://evil.example', '/profile']]) {
    await login(page, 'USER', '/auth/login?next=' + encodeURIComponent(next), expected)
    await page.reload()
    await page.waitForURL(url => url.pathname === expected)
    await logout(page)
  }
})
test('admin protected redirect persists through reload and navigation history', async ({ page }) => {
  await page.goto('/quan-tri')
  await expect(page.locator('input[name=email]')).toBeVisible()
  await login(page, 'ADMIN', '/auth/login?next=/quan-tri', '/quan-tri')
  await expect(page.getByText('Vai trò hiện tại: Admin', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Vai trò hiện tại: Admin', { exact: true })).toBeVisible()
  await page.goto('/profile')
  await identity(page, 'ADMIN')
  await page.goBack()
  await expect(page.getByText('Vai trò hiện tại: Admin', { exact: true })).toBeVisible()
  await page.goForward()
  await identity(page, 'ADMIN')
  await logout(page)
})
test('code-free stale callbacks preserve an active session and sanitized destination', async ({ page }) => {
  await login(page, 'USER')
  await page.goto('/auth/callback?error=access_denied&next=%2Fthu-thach')
  await page.waitForURL(url => url.pathname === '/thu-thach')
  await page.goto('/profile')
  await identity(page, 'USER')
  await page.goto('/auth/callback?next=//evil.example')
  await page.waitForURL(url => url.pathname === '/profile')
  await identity(page, 'USER')
  await page.reload()
  await identity(page, 'USER')
  await logout(page)
  await page.goto('/auth/callback?next=%2Fthu-thach')
  expect(new URL(page.url()).pathname).toBe('/auth/login')
  expect(new URL(page.url()).searchParams.get('next')).toBe('/thu-thach')
})
test('Google initiation preserves safe next and generates a fresh SDK PKCE flow', async ({ page }) => {
  const flows: { callback: URL; challenge: string | null }[] = []
  await page.route('**/auth/v1/authorize?**', async route => {
    const u = new URL(route.request().url())
    expect(u.searchParams.get('provider')).toBe('google')
    expect(u.searchParams.get('prompt')).toBe('select_account')
    const callback = new URL(u.searchParams.get('redirect_to')!)
    flows.push({ callback, challenge: u.searchParams.get('code_challenge') })
    // Initiation contract only; no fabricated provider callback or auth session.
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>OAuth request intercepted before provider authorization</p>' })
  })
  for (const next of ['/', '/thu-thach', '/quan-tri', '//evil.example']) {
    await page.goto('/auth/login?next=' + encodeURIComponent(next))
    await page.getByRole('button', { name: 'Tiếp tục với Google', exact: true }).click()
    await expect.poll(() => flows.length).toBe(['/', '/thu-thach', '/quan-tri', '//evil.example'].indexOf(next) + 1)
    const last = flows.at(-1)!
    const origin = new URL(test.info().project.use.baseURL as string).origin
    expect(last.callback.origin).toBe(origin)
    expect(last.callback.pathname).toBe('/auth/callback')
    expect(last.callback.searchParams.get('next')).toBe(authNext(next))
    expect(Boolean(last.callback.searchParams.get('sb_flow_id'))).toBe(true)
    expect(Boolean(last.challenge)).toBe(true)
  }
  expect(new Set(flows.map(f => f.challenge)).size).toBe(flows.length)
})

test('synthetic stale callback URLs cannot remove a fresh SDK PKCE verifier', async ({ page }) => {
  await page.route('**/auth/v1/authorize?**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Provider request intercepted</p>' }))
  await page.goto('/auth/login')
  await page.getByRole('button', { name: 'Tiếp tục với Google', exact: true }).click()
  await expect(page.getByText('Provider request intercepted', { exact: true })).toBeVisible()
  const pending = async () => JSON.stringify((await page.context().cookies()).filter(c => c.name.includes('-code-verifier')).sort((a, b) => a.name.localeCompare(b.name)).map(c => [c.name, c.value]))
  const before = await pending()
  expect(before !== '[]', 'Fresh verifier is managed by the SDK').toBe(true)
  // Invented placeholders only; no real authorization code or OAuth state is reused.
  for (const query of ['code=synthetic-not-an-authorization-code', 'code=synthetic-not-an-authorization-code&sb_flow_id=invalid', 'code=synthetic-not-an-authorization-code&sb_flow_id=00000000000000000000000000000000']) {
    await page.goto('/auth/callback?' + query)
    expect(new URL(page.url()).pathname).toBe('/auth/login')
    expect((await pending()) === before, 'Pending verifier unchanged; secret values not logged').toBe(true)
  }
})
