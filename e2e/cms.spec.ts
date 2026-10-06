import { test, expect } from './fixtures'

test('published educational article has a working public detail page', async ({ page }) => {
  await page.goto('/guong-sang/song-xanh-moi-ngay')
  await expect(page.getByRole('heading', { level: 1, name: 'Kiến thức sống xanh' })).toBeVisible()
  await expect(page.locator('article')).toContainText('Tiết kiệm điện')
  await page.goto('/guong-sang')
  await expect(page.locator('a[href="/guong-sang/song-xanh-moi-ngay"]')).toBeVisible()
})

test('admin CMS forms preserve quiz answers, required slugs and article provenance without writing data', async ({ adminPage: page }) => {
  const submissions: { table: string; values: Record<string, unknown> }[] = []
  await page.route('**/api/quan-tri', async (route) => {
    if (route.request().method() !== 'POST') return route.abort()
    submissions.push(route.request().postDataJSON())
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, id: '00000000-0000-0000-0000-000000000001' }) })
  })
  const nav = page.locator('main nav')
  await nav.getByRole('button', { name: 'Câu hỏi Đúng/Sai', exact: true }).click()
  await page.getByLabel('Nội dung câu hỏi', { exact: true }).fill('Câu hỏi kiểm tra hợp đồng, không được lưu vào cơ sở dữ liệu')
  await page.getByLabel('Đáp án', { exact: true }).selectOption('Sai')
  await page.getByRole('button', { name: 'Lưu bản ghi', exact: true }).click()
  await expect.poll(() => submissions.length).toBe(1)
  expect(submissions[0].values.correct_answer).toBe('Sai')
  expect(submissions[0].values).not.toHaveProperty('answer')

  for (const [section, table] of [['Thử thách', 'challenges'], ['Chiến dịch', 'campaigns']]) {
    await nav.getByRole('button', { name: section, exact: true }).click()
    await page.getByLabel('Slug', { exact: true }).fill('cms-contract-preview')
    await page.getByRole('button', { name: 'Lưu bản ghi', exact: true }).click()
    await expect.poll(() => submissions.some((item) => item.table === table)).toBe(true)
    expect(submissions.find((item) => item.table === table)?.values.slug).toBe('cms-contract-preview')
  }

  await nav.getByRole('button', { name: 'Bài viết', exact: true }).click()
  await page.getByLabel('Nguồn', { exact: true }).fill('Nguồn kiểm tra')
  await page.getByLabel('Đường dẫn nguồn', { exact: true }).fill('https://www.unep.org/')
  await page.getByLabel('Tác giả', { exact: true }).fill('Ban biên tập SongXanh')
  await page.getByLabel('Chú thích minh họa', { exact: true }).fill('Không sử dụng ảnh bên ngoài')
  await page.getByRole('button', { name: 'Lưu bản ghi', exact: true }).click()
  await expect.poll(() => submissions.some((item) => item.table === 'articles')).toBe(true)
  const article = submissions.find((item) => item.table === 'articles')!
  expect(article.values.source_url).toBe('https://www.unep.org/')
  expect(article.values.author_name).toBe('Ban biên tập SongXanh')
})

test('admin CMS rejects invalid quiz answers and missing slugs before insertion', async ({ adminPage: page }) => {
  for (const body of [
    { table: 'quiz', values: { question: 'Invalid contract probe', correct_answer: 'true' } },
    { table: 'challenges', values: { title: 'Missing slug contract probe' } },
    { table: 'campaigns', values: { name: 'Missing slug contract probe' } },
    { table: 'campaigns', values: { name: 'Invalid date contract probe', slug: 'invalid-date-contract-probe', starts_at: 'not-a-date' } },
    { table: 'campaigns', values: { name: 'Reversed date contract probe', slug: 'reversed-date-contract-probe', starts_at: '2026-10-12T12:00', ends_at: '2026-10-06T12:00' } },
  ]) {
    const response = await page.request.post('/api/quan-tri', { data: body })
    expect(response.status()).toBe(400)
  }
})

test('admin is warned not to resubmit after a saved record audit failure', async ({ adminPage: page }) => {
  let saves = 0
  await page.route('**/api/quan-tri', async (route) => {
    saves += 1
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ saved: true, id: '00000000-0000-0000-0000-000000000001' }) })
  })
  await page.locator('main nav').getByRole('button', { name: 'Bài viết', exact: true }).click()
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Intercepted audit-failure check')
  await page.getByRole('button', { name: 'Lưu bản ghi', exact: true }).click()
  await expect(page.getByText('Bản ghi đã lưu nhưng ghi nhật ký thất bại. Không gửi lại.', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Tiêu đề', { exact: true })).toHaveValue('')
  expect(saves).toBe(1)
})
