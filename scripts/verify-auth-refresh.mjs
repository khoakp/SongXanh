import fs from 'node:fs'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

const base = 'https://song-xanh.vercel.app'
const credentials = {}
for (const line of fs.readFileSync('.env.test.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*(TEST_USER_EMAIL|TEST_USER_PASSWORD)\s*=\s*(.*)$/)
  if (match) credentials[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
}
assert.ok(credentials.TEST_USER_EMAIL && credentials.TEST_USER_PASSWORD, 'Authorized user credentials are configured')
const report = { site: base, status: 'STARTING', real_expiry_verified: false }
const save = () => fs.writeFileSync('auth-refresh-verification.json', JSON.stringify(report, null, 2) + '\n')
const browser = await chromium.launch()
const context = await browser.newContext()
let progressTimer
async function expiryMetadata() {
  // Read only SDK-managed cookie metadata in memory. Never write cookie/token
  // values to reports, custom storage, logs or another browser context.
  const cookies = (await context.cookies(base)).filter(c => /^sb-.*-auth-token(?:\.\d+)?$/.test(c.name))
  const value = decodeURIComponent(cookies.sort((a, b) => Number(a.name.match(/\.(\d+)$/)?.[1] || 0) - Number(b.name.match(/\.(\d+)$/)?.[1] || 0)).map(c => c.value).join(''))
  assert.ok(value.startsWith('base64-'), 'Session uses SDK base64url cookie encoding')
  const expires = Number(JSON.parse(Buffer.from(value.slice(7), 'base64url').toString('utf8')).expires_at)
  assert.ok(Number.isFinite(expires) && expires > 0, 'SDK session expiry metadata is valid')
  return expires
}
try {
  let page = await context.newPage()
  await page.goto(base + '/auth/login')
  await page.locator('input[name=email]').fill(credentials.TEST_USER_EMAIL)
  await page.locator('input[name=password]').fill(credentials.TEST_USER_PASSWORD)
  await page.locator('form button').first().click()
  await page.waitForURL(url => url.pathname === '/profile')
  await page.getByRole('heading', { name: 'Hồ sơ của bạn', exact: true }).waitFor()
  const initialExpiry = await expiryMetadata()
  assert.ok(initialExpiry > Date.now() / 1000, 'Initial session is valid')
  report.status = 'WAITING_FOR_NATURAL_EXPIRY'
  report.initial_expires_at_utc = new Date(initialExpiry * 1000).toISOString()
  report.check_at_utc = new Date(initialExpiry * 1000 + 5000).toISOString()
  // Close every app page to stop browser SDK proactive refresh. The existing
  // browser context keeps its normal SDK cookies; no session is copied.
  await page.close()
  save()
  console.log(JSON.stringify(report))
  progressTimer = setInterval(() => console.log(JSON.stringify({ status: report.status, check_at_utc: report.check_at_utc })), 60000)
  await new Promise(resolve => setTimeout(resolve, Math.max(0, initialExpiry * 1000 + 5000 - Date.now())))
  clearInterval(progressTimer)
  page = await context.newPage()
  const response = await page.goto(base + '/profile')
  await page.getByRole('heading', { name: 'Hồ sơ của bạn', exact: true }).waitFor()
  assert.ok((await page.locator('main').innerText()).includes(credentials.TEST_USER_EMAIL), 'Original identity remains authenticated after expiry')
  const refreshedExpiry = await expiryMetadata()
  assert.ok(refreshedExpiry > initialExpiry, 'SDK session expiry advanced through normal refresh')
  const headers = await response.allHeaders()
  assert.ok(/sb-.*-auth-token/.test(headers['set-cookie'] || ''), 'Server emitted refreshed SDK cookies before client initialization')
  assert.ok((headers['cache-control'] || '').includes('no-store'), 'Refreshed session response is not cacheable')
  report.refreshed_expires_at_utc = new Date(refreshedExpiry * 1000).toISOString()
  report.server_set_cookie_present = true
  report.cache_control = headers['cache-control']
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/')
  assert.equal((await context.cookies(base)).filter(c => /^sb-.*-auth-token(?:\.\d+)?$/.test(c.name)).length, 0, 'Test logout clears session cookies')
  report.logout_cookie_cleanup = true
  report.real_expiry_verified = true
  report.status = 'PASS'
} catch (error) {
  report.status = 'FAILED'
  report.failure_kind = error.name
  process.exitCode = 1
} finally {
  clearInterval(progressTimer)
  // Cleanup only this authorized test browser's app session, including on
  // failure. No global signout, password, account or content mutation.
  await context.request.post(base + '/auth/sign-out').catch(() => {})
  save()
  console.log(JSON.stringify(report))
  await browser.close()
}
