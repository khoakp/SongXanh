import { test as base, expect, type Browser, type Page } from '@playwright/test'

type RolePageFixtures = {
  userPage: Page
  editorPage: Page
  adminPage: Page
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function login(page: Page, email: string, password: string, next: string) {
  await page.goto('/auth/login?next=' + encodeURIComponent(next))
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: /Đăng nhập/ }).click()
  await page.waitForURL((url) => url.pathname === next)
}

async function userIdByEmail(email: string) {
  if (!supabaseUrl || !serviceKey) throw new Error('Missing server-only Supabase cleanup configuration')
  const response = await fetch(supabaseUrl + '/auth/v1/admin/users?per_page=1000', {
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !Array.isArray(payload?.users)) throw new Error('Unable to resolve E2E test user for cleanup')
  return payload.users.find((item: { email?: string }) => item.email === email)?.id as string | undefined
}

async function cleanupCarbon(email: string, startedAt: string) {
  if (!supabaseUrl || !serviceKey) throw new Error('Missing server-only Supabase cleanup configuration')
  const userId = await userIdByEmail(email)
  if (!userId) throw new Error('Unable to resolve E2E test user for cleanup')
  const query = 'user_id=eq.' + encodeURIComponent(userId) + '&created_at=gte.' + encodeURIComponent(startedAt)
  const response = await fetch(supabaseUrl + '/rest/v1/carbon_results?' + query, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey },
  })
  if (!response.ok) throw new Error('E2E carbon cleanup failed')
}

async function createRolePage(browser: Browser, email: string, password: string, next: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await login(page, email, password, next)
  return { context, page }
}

export const test = base.extend<RolePageFixtures>({
  userPage: async ({ browser }, use) => {
    const startedAt = new Date().toISOString()
    const { context, page } = await createRolePage(browser, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!, '/profile')
    try {
      await use(page)
    } finally {
      await cleanupCarbon(process.env.TEST_USER_EMAIL!, startedAt)
      await context.close()
    }
  },
  editorPage: async ({ browser }, use) => {
    const { context, page } = await createRolePage(browser, process.env.TEST_EDITOR_EMAIL!, process.env.TEST_EDITOR_PASSWORD!, '/quan-tri')
    try {
      await use(page)
    } finally {
      await context.close()
    }
  },
  adminPage: async ({ browser }, use) => {
    const { context, page } = await createRolePage(browser, process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!, '/quan-tri')
    try {
      await use(page)
    } finally {
      await context.close()
    }
  },
})

export { expect }
