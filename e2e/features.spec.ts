import { test, expect } from './fixtures'

test('user-facing filters and leaderboard controls update the view', async ({ page }) => {
  await page.goto('/thu-thach')
  await expect(page.getByRole('tablist', { name: 'Lọc theo chủ đề' })).toBeVisible()
  const topicButtons = page.getByRole('tablist', { name: 'Lọc theo chủ đề' }).getByRole('button')
  if (await topicButtons.count() > 1) await topicButtons.nth(1).click()

  await page.goto('/cam-ket')
  await expect(page.locator('select')).toBeVisible()
  const commitmentOptions = page.locator('select option')
  if (await commitmentOptions.count() > 1) await page.locator('select').selectOption({ index: 1 })

  await page.goto('/guong-sang')
  await expect(page.getByLabel('Lọc bài viết')).toBeVisible()
  const articleFilters = page.getByLabel('Lọc bài viết').getByRole('button')
  if (await articleFilters.count() > 1) await articleFilters.nth(1).click()

  await page.goto('/xep-hang')
  await expect(page.getByRole('heading', { name: 'Bảng xếp hạng' })).toBeVisible()
  const monthResponse = page.waitForResponse((response) => response.url().includes('/api/leaderboard') && response.url().includes('period=month') && response.status() === 200)
  await page.getByRole('button', { name: 'Tháng này' }).click()
  await monthResponse
  const facultyResponse = page.waitForResponse((response) => response.url().includes('/api/leaderboard') && response.url().includes('scope=Khoa') && response.status() === 200)
  await page.getByRole('button', { name: 'Khoa' }).click()
  await facultyResponse
  const schoolResponse = page.waitForResponse((response) => response.url().includes('/api/leaderboard') && response.url().includes('school=E2E_TEST_FILTER') && response.status() === 200)
  await page.getByPlaceholder('Lọc theo trường').fill('E2E_TEST_FILTER')
  await schoolResponse
})
