const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

const pageRoutes = [
  '/', '/gioi-thieu', '/lien-he', '/quyen-rieng-tu', '/thu-thach',
  '/thu-thach/hom-nay', '/tro-choi', '/guong-sang', '/chien-dich',
  '/cam-ket', '/xep-hang', '/carbon', '/auth/login', '/auth/sign-up',
  '/auth/forgot-password', '/auth/update-password', '/profile', '/quan-tri',
]

const checks = [
  ...pageRoutes.map((path) => ({ method: 'GET', path, expected: [200] })),
  { method: 'GET', path: '/api/games/waste-sort', expected: [200] },
  { method: 'GET', path: '/api/games/student-day', expected: [200] },
  { method: 'GET', path: '/api/leaderboard', expected: [200] },
  { method: 'POST', path: '/api/profile', body: {}, expected: [405] },
  { method: 'DELETE', path: '/api/profile', expected: [401] },
  { method: 'POST', path: '/api/commitments', body: {}, expected: [401] },
  { method: 'POST', path: '/api/challenges/join', body: {}, expected: [401] },
  { method: 'POST', path: '/api/challenges/complete', body: {}, expected: [401] },
  { method: 'POST', path: '/api/articles/read', body: {}, expected: [401] },
  { method: 'POST', path: '/api/games/waste-sort', body: {}, expected: [401] },
  { method: 'POST', path: '/api/games/student-day', body: {}, expected: [401] },
  { method: 'POST', path: '/api/quan-tri', body: {}, expected: [403] },
  { method: 'PATCH', path: '/api/quan-tri', body: {}, expected: [403] },
  { method: 'DELETE', path: '/api/quan-tri', body: {}, expected: [403] },
  { method: 'POST', path: '/api/games/true-false', body: {}, expected: [400] },
  { method: 'POST', path: '/auth/sign-out', expected: [200] },
]

let failed = 0
let passed = 0
for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`, {
    method: check.method,
    headers: check.body ? { 'content-type': 'application/json' } : undefined,
    body: check.body ? JSON.stringify(check.body) : undefined,
    redirect: 'manual',
  })
  const ok = check.expected.includes(response.status)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${check.method} ${check.path} -> ${response.status} (expected ${check.expected.join('/')})`)
  if (!ok) failed += 1
  else passed += 1
}

async function contract(name, path, predicate) {
  const response = await fetch(`${baseUrl}${path}`)
  const payload = await response.json().catch(() => null)
  const ok = response.ok && predicate(payload)
  console.log(`${ok ? 'PASS' : 'FAIL'} contract ${name}`)
  if (ok) passed += 1
  else failed += 1
}

await contract('waste-sort items', '/api/games/waste-sort', (payload) => Array.isArray(payload?.items) && payload.items.every((item) => item.id && item.name && item.difficulty))
await contract('student-day scenarios and steps', '/api/games/student-day', (payload) => Array.isArray(payload?.scenarios) && Array.isArray(payload?.steps) && payload.scenarios.length > 0 && payload.steps.every((step) => step.scenarioId && Number.isInteger(step.stepOrder) && Array.isArray(step.options)))
await contract('leaderboard people', '/api/leaderboard', (payload) => Array.isArray(payload?.people))

async function protectedPage(name, path, next) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' })
  const body = await response.text()
  const ok = response.ok && (body.includes(`/auth/login?next=%2F${next}`) || body.includes(`/auth/login?next=/${next}`))
  console.log(`${ok ? 'PASS' : 'FAIL'} contract guest protected page ${name}`)
  if (ok) passed += 1
  else failed += 1
}

await protectedPage('profile', '/profile', 'profile')
await protectedPage('today challenge', '/thu-thach/hom-nay', 'thu-thach/hom-nay')
await protectedPage('admin', '/quan-tri', 'quan-tri')
console.log(`SUMMARY passed=${passed} failed=${failed}`)

if (failed) process.exitCode = 1
