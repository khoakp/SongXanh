import { test, expect } from './fixtures'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function adminUserId(email: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } })
  const payload = await response.json().catch(() => null) as { users?: { id?: string; email?: string }[] } | null
  return payload?.users?.find((user) => user.email === email)?.id
}

test('password recovery uses the callback and validates the new password form', async ({ page }) => {
  await page.goto('/auth/forgot-password')
  const recoveryRequest = page.waitForRequest((request) => request.method() === 'POST' && request.url().includes('/auth/v1/recover'))
  await page.locator('input[type="email"]').fill(`E2E_TEST_${Date.now()}@example.invalid`)
  await page.getByRole('button', { name: 'Gửi hướng dẫn' }).click()
  const request = await recoveryRequest
  const payload = JSON.parse(request.postData() || '{}') as { redirect_to?: string }
  const redirectTo = payload.redirect_to || new URL(request.url()).searchParams.get('redirect_to') || ''
  expect(redirectTo).toContain('/auth/callback?next=%2Fauth%2Fupdate-password')
  await expect(page.getByText('Nếu email tồn tại, hướng dẫn khôi phục đã được gửi.')).toBeVisible()

  await page.goto('/auth/update-password')
  const newPassword = page.locator('input').nth(0)
  await newPassword.fill('short')
  await page.locator('input').nth(1).fill('short')
  expect(await newPassword.evaluate((input) => !(input as HTMLInputElement).checkValidity())).toBe(true)
  await page.locator('input').nth(0).fill('valid-password')
  await page.locator('input').nth(1).fill('different-password')
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click()
  await expect(page.getByText('Mật khẩu nhập lại không khớp.', { exact: true })).toBeVisible()
})

test('password recovery action link can update and restore the test password', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL!
  const originalPassword = process.env.TEST_USER_PASSWORD!
  const newPassword = `E2E_TEST_RECOVERY_${Date.now()}_x!`
  const userId = await adminUserId(email)
  expect(userId).toBeTruthy()
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'recovery', email, redirect_to: 'http://localhost:3001/auth/update-password' }),
  })
  const payload = await response.json().catch(() => null) as { action_link?: string } | null
  expect(response.ok && payload?.action_link).toBeTruthy()
  try {
    try { await page.goto(payload!.action_link!, { waitUntil: 'domcontentloaded' }) } catch { throw new Error('Recovery action link navigation failed') }
    await page.waitForTimeout(1000)
    const current = new URL(page.url())
    if (current.pathname !== '/auth/update-password') throw new Error('Recovery action link did not reach update-password')
    await page.locator('input').nth(0).fill(newPassword)
    await page.locator('input').nth(1).fill(newPassword)
    await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click()
    await page.waitForURL((url) => url.pathname === '/profile')
  } finally {
    const restore = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ password: originalPassword }),
    })
    if (!restore.ok) throw new Error('Test password restore failed')
  }
})

test('callback rejects an external next target', async ({ page }) => {
  await page.goto('/auth/callback?next=https%3A%2F%2Fevil.example')
  await expect(page).toHaveURL(/\/auth\/login\?error=callback$/)
})
