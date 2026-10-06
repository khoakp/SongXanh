import { test, expect } from './fixtures'

test('user session persists, carbon result saves to history, and logout works', async ({ userPage }) => {
  let consoleErrors = 0
  let requestFailures = 0
  const requestFailureDetails: string[] = []
  const httpErrors: string[] = []
  const consoleErrorMessages: string[] = []
  userPage.on('console', (message) => {
    if (message.type() !== 'error') return
    consoleErrors += 1
    let text = message.text()
    for (const key of ['TEST_USER_EMAIL', 'TEST_USER_PASSWORD', 'TEST_EDITOR_EMAIL', 'TEST_EDITOR_PASSWORD', 'TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD']) {
      const secret = process.env[key]
      if (secret) text = text.split(secret).join('<redacted>')
    }
    consoleErrorMessages.push(text.slice(0, 240))
  })
  userPage.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText || 'failed'
    let path = ''
    try { path = new URL(request.url()).pathname } catch {}
    if (failure === 'net::ERR_ABORTED' && (path === '/profile' || path === '/')) return
    requestFailures += 1
    requestFailureDetails.push(path + ' ' + failure)
  })
  userPage.on('response', (response) => {
    if (response.status() >= 400) {
      try { httpErrors.push(response.status() + ' ' + new URL(response.url()).pathname) } catch { httpErrors.push(String(response.status())) }
    }
  })
  await expect(userPage.getByText('Hồ sơ của bạn')).toBeVisible()
  await userPage.reload()
  await expect(userPage.getByText('Hồ sơ của bạn')).toBeVisible()

  await userPage.goto('/carbon')
  await expect(userPage.getByRole('heading', { name: /Dấu chân carbon/ })).toBeVisible()
  for (let step = 0; step < 4; step += 1) {
    await userPage.locator('input[type="number"]').first().fill('1')
    if (step < 3) await userPage.getByRole('button', { name: /Tiếp theo/ }).click()
    else await userPage.getByRole('button', { name: /Tính dấu chân carbon/ }).click()
  }
  await expect(userPage.getByText('Kết quả ước tính')).toBeVisible()
  await userPage.getByRole('button', { name: /Lưu vào hồ sơ/ }).click()
  await expect(userPage.getByRole('button', { name: /Đã lưu/ })).toBeVisible()
  await expect(userPage.getByText('Lịch sử dấu chân carbon')).toBeVisible()

  await userPage.goto('/profile')
  const signOutResponse = userPage.waitForResponse((response) => response.url().includes('/auth/sign-out') && response.request().method() === 'POST')
  await userPage.getByRole('button', { name: 'Đăng xuất' }).click()
  const response = await signOutResponse
  expect(response.status()).toBe(200)
  await userPage.goto('/profile')
  await expect(userPage.locator('input[name="email"]')).toBeVisible()
  expect(consoleErrors, consoleErrorMessages.slice(0, 3).join(' | ') + ' [' + httpErrors.slice(0, 6).join(', ') + ']').toBe(0)
  expect(requestFailures, requestFailureDetails.slice(0, 4).join(' | ')).toBe(0)
})

test('editor and admin see the correct administration role', async ({ editorPage, adminPage }) => {
  await expect(editorPage.getByText('Quản trị Sống Xanh')).toBeVisible()
  await expect(editorPage.getByText(/Vai trò hiện tại: Editor/)).toBeVisible()
  await expect(adminPage.getByText('Quản trị Sống Xanh')).toBeVisible()
  await expect(adminPage.getByText(/Vai trò hiện tại: Admin/)).toBeVisible()
})
