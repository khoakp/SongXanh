import fs from 'node:fs'
import path from 'node:path'
import { createServerClient } from '@supabase/ssr'

const root = process.cwd()
const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
const localDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName)
  if (!fs.existsSync(filePath)) return
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const value = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
    if (!process.env[match[1]]) process.env[match[1]] = value
  }
}

// Configuration is loaded without ever printing its values. Test credentials are read only from .env.test.local.
loadEnvFile('.env')
loadEnvFile('.env.test.local')

const required = [
  'TEST_USER_EMAIL', 'TEST_USER_PASSWORD',
  'TEST_EDITOR_EMAIL', 'TEST_EDITOR_PASSWORD',
  'TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD',
]
const missing = required.filter((key) => !process.env[key])
if (missing.length) {
  console.log(`BLOCKED missing environment variables: ${missing.join(',')}`)
  process.exit(2)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !publicKey) {
  console.log('BLOCKED missing Supabase runtime configuration')
  process.exit(2)
}

let passed = 0
let failed = 0
let blocked = 0
const cleanup = []

function pass(name, detail = '') { passed += 1; console.log(`PASS ${name}${detail ? ` (${detail})` : ''}`) }
function fail(name, detail = '') { failed += 1; console.log(`FAIL ${name}${detail ? ` (${detail})` : ''}`) }
function block(name, detail = '') { blocked += 1; console.log(`BLOCKED ${name}${detail ? ` (${detail})` : ''}`) }
function statusOf(response) { return response?.status ?? 0 }
function jsonOf(response) { return response.json().catch(() => null) }
function safeCode(payload) { return payload && typeof payload.code === 'string' ? payload.code : '' }
function safeFailure(payload) {
  const code = typeof payload?.code === 'string' ? payload.code : ''
  const rawMessage = typeof payload?.message === 'string' ? payload.message : typeof payload?.error === 'string' ? payload.error : ''
  const message = rawMessage.replace(/[^a-zA-Z0-9_ .:-]/g, '').slice(0, 120)
  return [code, message].filter(Boolean).join(':') || 'unknown_error'
}

async function appRequest(cookieHeader, route, options = {}) {
  const headers = new Headers(options.headers || {})
  if (cookieHeader) headers.set('cookie', cookieHeader)
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json')
  return fetch(`${baseUrl}${route}`, { ...options, headers, redirect: 'manual' })
}

async function restRequest(token, route, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('apikey', publicKey)
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json')
  return fetch(`${supabaseUrl}/rest/v1/${route}`, { ...options, headers })
}

async function serviceRequest(route, options = {}) {
  if (!serviceKey) return null
  const headers = new Headers(options.headers || {})
  headers.set('apikey', serviceKey)
  headers.set('Authorization', `Bearer ${serviceKey}`)
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json')
  return fetch(`${supabaseUrl}/rest/v1/${route}`, { ...options, headers })
}

async function rpc(token, name, body = undefined) {
  const options = { method: 'POST' }
  if (body !== undefined) options.body = JSON.stringify(body)
  return restRequest(token, `rpc/${name}`, options)
}

async function login(email, password) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: publicKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.access_token || !payload?.refresh_token) return { authFailureStatus: response.status, authFailureCode: payload?.error_code || payload?.code || 'unknown' }
  return payload
}

async function cookiesForSession(session) {
  const jar = new Map()
  const client = createServerClient(supabaseUrl, publicKey, {
    cookieEncoding: 'base64url',
    cookies: {
      getAll() { return [...jar].map(([name, value]) => ({ name, value })) },
      setAll(items) { for (const item of items) { if (item.value) jar.set(item.name, item.value); else jar.delete(item.name) } },
    },
  })
  await client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
}

async function rows(token, table, query) {
  const response = await restRequest(token, `${table}?${query}`)
  return { response, data: await jsonOf(response) }
}

async function firstRow(token, table, query) {
  const result = await rows(token, table, query)
  return Array.isArray(result.data) ? result.data[0] || null : null
}

async function serviceFirstRow(table, query) {
  const response = await serviceRequest(`${table}?${query}`)
  if (!response) return null
  const data = await jsonOf(response)
  return Array.isArray(data) ? data[0] || null : null
}

async function testGuestBoundaries() {
  const checks = [
    ['guest profile API', '/api/profile', 'DELETE', 401],
    ['guest commitments API', '/api/commitments', 'POST', 401],
    ['guest admin API', '/api/quan-tri', 'POST', 403],
  ]
  for (const [name, route, method, expected] of checks) {
    const response = await appRequest('', route, { method, body: '{}' })
    statusOf(response) === expected ? pass(name, String(expected)) : fail(name, String(statusOf(response)))
  }
}

async function testUser() {
  const session = await login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD)
  if (session?.authFailureStatus) { fail('user login', `auth-status-${session.authFailureStatus}-${session.authFailureCode}`); return }
  pass('user login')
  const cookie = await cookiesForSession(session)
  const userId = session.user?.id
  const profile = await firstRow(session.access_token, 'users', `select=id,role,display_name,school,faculty,class_name,hide_from_leaderboard&id=eq.${userId}`)
  if (!profile) { fail('user profile/session loading'); return }
  profile.role === 'user' ? pass('user role', 'user') : fail('user role', 'unexpected')
  const accountSnapshot = serviceKey ? await serviceFirstRow('users', `select=total_points,streak_days,tree_level,tree_last_active&id=eq.${userId}`) : null
  const scoreSnapshot = serviceKey ? await serviceFirstRow('game_daily_scores', `select=score&user_id=eq.${userId}&played_on=eq.${localDate()}`) : null
  if (serviceKey && accountSnapshot) cleanup.push(async () => serviceRequest(`users?id=eq.${userId}`, { method: 'PATCH', body: JSON.stringify(accountSnapshot) }))
  if (serviceKey) cleanup.push(async () => scoreSnapshot
    ? serviceRequest(`game_daily_scores?user_id=eq.${userId}&played_on=eq.${localDate()}`, { method: 'PATCH', body: JSON.stringify({ score: scoreSnapshot.score }) })
    : serviceRequest(`game_daily_scores?user_id=eq.${userId}&played_on=eq.${localDate()}`, { method: 'DELETE' }))
  const profilePage = await appRequest(cookie, '/profile')
  statusOf(profilePage) === 200 ? pass('user protected profile') : fail('user protected profile', String(statusOf(profilePage)))
  const carbonPage = await appRequest(cookie, '/carbon')
  statusOf(carbonPage) === 200 ? pass('user carbon page') : fail('user carbon page', String(statusOf(carbonPage)))
  const userAdminPost = await appRequest(cookie, '/api/quan-tri', { method: 'POST', body: '{}' })
  statusOf(userAdminPost) === 403 ? pass('user denied admin POST') : fail('user denied admin POST', String(statusOf(userAdminPost)))
  const userAdminPatch = await appRequest(cookie, '/api/quan-tri', { method: 'PATCH', body: '{}' })
  statusOf(userAdminPatch) === 403 ? pass('user denied admin PATCH') : fail('user denied admin PATCH', String(statusOf(userAdminPatch)))
  const userAdminPage = await appRequest(cookie, '/quan-tri')
  const userAdminPageBody = await userAdminPage.text()
  userAdminPageBody.includes('/auth/login?next=%2Fquan-tri') ? pass('user denied admin page') : fail('user denied admin page', String(statusOf(userAdminPage)))
  const refreshPage = await appRequest(cookie, '/profile')
  statusOf(refreshPage) === 200 ? pass('user session persistence after refresh') : fail('user session persistence after refresh', String(statusOf(refreshPage)))

  const carbonSave = await rpc(session.access_token, 'save_carbon_result_secure', { p_transport: 1, p_food: 2, p_energy: 3, p_shopping: 4, p_total: 10 })
  const carbonPayload = statusOf(carbonSave) === 200 ? await jsonOf(carbonSave) : null
  if (statusOf(carbonSave) === 200 && carbonPayload?.id) {
    pass('user carbon save RPC')
    cleanup.push(async () => serviceRequest(`carbon_results?id=eq.${carbonPayload.id}`, { method: 'DELETE' }))
    const savedCarbon = await firstRow(session.access_token, 'carbon_results', `select=id,total_kg&user_id=eq.${userId}&id=eq.${carbonPayload.id}`)
    if (savedCarbon?.id === carbonPayload.id) {
      pass('user carbon persistence/history data')
      const profileHistoryPage = await appRequest(cookie, '/profile')
      const profileHistoryBody = await profileHistoryPage.text()
      profileHistoryBody.includes('10.00') ? pass('user carbon profile activity history') : fail('user carbon profile activity history', 'saved row not rendered')
    } else fail('user carbon persistence/history data', 'saved row not readable')
  } else if (statusOf(carbonSave) === 404) block('user carbon save RPC', 'missing database migration')
  else fail('user carbon save RPC', String(statusOf(carbonSave)))
  const badgesRead = await rows(session.access_token, 'user_badges', `select=user_id,badge_id,awarded_at&user_id=eq.${userId}`)
  if (statusOf(badgesRead.response) === 200) pass('user badges read')
  else if (statusOf(badgesRead.response) === 404) block('user badges read', 'missing database migration')
  else fail('user badges read', String(statusOf(badgesRead.response)))

  const original = { display_name: profile.display_name, school: profile.school, faculty: profile.faculty, class_name: profile.class_name, hide_from_leaderboard: profile.hide_from_leaderboard }
  const temporaryName = `E2E_TEST_PROFILE_${Date.now()}`
  let profileChanged = false
  try {
    const update = await appRequest(cookie, '/api/profile', { method: 'PATCH', body: JSON.stringify({ ...original, display_name: temporaryName }) })
    if (statusOf(update) === 200) { profileChanged = true; pass('user profile update') } else fail('user profile update', String(statusOf(update)))
  } finally {
    if (profileChanged) {
      const restore = await appRequest(cookie, '/api/profile', { method: 'PATCH', body: JSON.stringify(original) })
      statusOf(restore) === 200 ? pass('user profile cleanup') : fail('user profile cleanup', String(statusOf(restore)))
    }
  }

  const challenge = await firstRow(session.access_token, 'challenges', 'select=id,title&active=eq.true&limit=1')
  const task = challenge ? await firstRow(session.access_token, 'tasks', `select=id,challenge_id,title,active&challenge_id=eq.${challenge.id}&active=eq.true&limit=1`) : null
  if (challenge) {
    const existingJoin = await firstRow(session.access_token, 'user_challenges', `select=challenge_id&user_id=eq.${userId}&challenge_id=eq.${challenge.id}`)
    if (!existingJoin) {
      const join = await appRequest(cookie, '/api/challenges/join', { method: 'POST', body: JSON.stringify({ challengeId: challenge.id }) })
      if (statusOf(join) === 200) {
        pass('user challenge join')
        if (serviceKey) cleanup.push(async () => serviceRequest(`user_challenges?user_id=eq.${userId}&challenge_id=eq.${challenge.id}`, { method: 'DELETE' }))
      } else fail('user challenge join', String(statusOf(join)))
    } else pass('user challenge join', 'already joined')
  } else block('user challenge join', 'no seeded challenge')
  if (task) {
    const existingTask = await firstRow(session.access_token, 'user_tasks', `select=task_id,status&user_id=eq.${userId}&task_id=eq.${task.id}`)
    if (!existingTask) {
      const complete = await appRequest(cookie, '/api/challenges/complete', { method: 'POST', body: JSON.stringify({ taskId: task.id }) })
      if (statusOf(complete) === 200) {
        pass('user challenge complete')
        if (serviceKey) cleanup.push(async () => serviceRequest(`user_tasks?user_id=eq.${userId}&task_id=eq.${task.id}`, { method: 'DELETE' }))
      } else if (statusOf(complete) === 400 || statusOf(complete) === 500) {
        const payload = await jsonOf(complete)
        safeCode(payload) === 'PGRST205' ? block('user challenge complete', 'missing database migration') : fail('user challenge complete', String(statusOf(complete)))
      } else fail('user challenge complete', String(statusOf(complete)))
    } else pass('user challenge complete', 'already completed/joined')
  } else block('user challenge complete', 'no seeded task')

  const title = `E2E_TEST_COMMITMENT_${Date.now()}`
  const commitment = await appRequest(cookie, '/api/commitments', { method: 'POST', body: JSON.stringify({ title, displayName: false }) })
  if (statusOf(commitment) === 200) {
    pass('user commitment create')
    if (serviceKey) cleanup.push(async () => serviceRequest(`commitments?user_id=eq.${userId}&title=eq.${encodeURIComponent(title)}`, { method: 'DELETE' }))
  } else fail('user commitment create', String(statusOf(commitment)))

  const article = await firstRow(session.access_token, 'articles', 'select=id&published=eq.true&limit=1')
  if (article) {
    const priorRead = await firstRow(session.access_token, 'article_reads', `select=article_id&user_id=eq.${userId}&article_id=eq.${article.id}`)
    if (!priorRead) {
      const read = await appRequest(cookie, '/api/articles/read', { method: 'POST', body: JSON.stringify({ articleId: article.id }) })
      if (statusOf(read) === 200) {
        pass('user article read')
        if (serviceKey) cleanup.push(async () => serviceRequest(`article_reads?user_id=eq.${userId}&article_id=eq.${article.id}`, { method: 'DELETE' }))
      } else fail('user article read', String(statusOf(read)))
    } else pass('user article read', 'already read')
  } else block('user article read', 'no published article')

  const waste = await firstRow(session.access_token, 'waste_items', 'select=id,category&active=eq.true&limit=1')
  if (waste) {
    const before = await firstRow(session.access_token, 'game_waste_answers', `select=item_id&user_id=eq.${userId}&item_id=eq.${waste.id}&played_on=eq.${localDate()}`)
    if (!before) {
      const result = await appRequest(cookie, '/api/games/waste-sort', { method: 'POST', body: JSON.stringify({ itemId: waste.id, category: waste.category }) })
      if (statusOf(result) === 200) {
        pass('user waste-sort game')
        if (serviceKey) cleanup.push(async () => serviceRequest(`game_waste_answers?user_id=eq.${userId}&item_id=eq.${waste.id}`, { method: 'DELETE' }))
      } else fail('user waste-sort game', String(statusOf(result)))
    } else pass('user waste-sort game', 'already answered')
  } else block('user waste-sort game', 'no seeded item')

  const publicGame = await appRequest('', '/api/games/student-day')
  if (statusOf(publicGame) === 200) pass('user student-day game data')
  else fail('user student-day game data', String(statusOf(publicGame)))
  const questionsResponse = await rpc(session.access_token, 'get_daily_game_questions')
  const questionsPayload = statusOf(questionsResponse) === 200 ? await jsonOf(questionsResponse) : null
  const question = Array.isArray(questionsPayload) ? questionsPayload[0] : null
  if (question?.id) {
    const today = localDate()
    const existingAnswer = await serviceFirstRow('game_quiz_answers', `select=question_id&user_id=eq.${userId}&question_id=eq.${question.id}&played_on=eq.${today}`)
    if (!existingAnswer) {
      const beforeScore = await serviceFirstRow('game_daily_scores', `select=score&user_id=eq.${userId}&played_on=eq.${today}`)
      const answer = await appRequest(cookie, '/api/games/true-false', { method: 'POST', body: JSON.stringify({ questionId: question.id, answer: Array.isArray(question.options) ? question.options[0] : 'Đúng' }) })
      if (statusOf(answer) === 200) {
        pass('user true-false game')
        if (serviceKey) {
          cleanup.push(async () => serviceRequest(`game_quiz_answers?user_id=eq.${userId}&question_id=eq.${question.id}&played_on=eq.${today}`, { method: 'DELETE' }))
          cleanup.push(async () => beforeScore
            ? serviceRequest(`game_daily_scores?user_id=eq.${userId}&played_on=eq.${today}`, { method: 'PATCH', body: JSON.stringify({ score: beforeScore.score }) })
            : serviceRequest(`game_daily_scores?user_id=eq.${userId}&played_on=eq.${today}`, { method: 'DELETE' }))
        }
      } else fail('user true-false game', String(statusOf(answer)))
    } else pass('user true-false game', 'already answered')
  } else block('user true-false game', 'no seeded question')
  const leaderboard = await appRequest(cookie, '/api/leaderboard')
  statusOf(leaderboard) === 200 ? pass('user leaderboard') : fail('user leaderboard', String(statusOf(leaderboard)))

  const metrics = await rpc(session.access_token, 'get_impact_metrics')
  if (statusOf(metrics) === 200) pass('user impact metrics RPC')
  else if (statusOf(metrics) === 404) block('user impact metrics RPC', 'missing database migration')
  else fail('user impact metrics RPC', String(statusOf(metrics)))

  const signOut = await appRequest(cookie, '/auth/sign-out', { method: 'POST' })
  statusOf(signOut) === 200 ? pass('user logout') : fail('user logout', String(statusOf(signOut)))
  const protectedAfterLogout = await appRequest('', '/profile')
  const location = protectedAfterLogout.headers.get('location') || ''
  const protectedBody = await protectedAfterLogout.text()
  const renderedLogin = statusOf(protectedAfterLogout) === 200 && protectedBody.includes('/auth/login?next=%2Fprofile') && !protectedBody.includes('Hồ sơ của bạn')
  if (([301, 302, 303, 307, 308].includes(statusOf(protectedAfterLogout)) && location.includes('/auth/login')) || renderedLogin) pass('protected route after logout')
  else fail('protected route after logout', String(statusOf(protectedAfterLogout)))
}

async function testEditor() {
  const session = await login(process.env.TEST_EDITOR_EMAIL, process.env.TEST_EDITOR_PASSWORD)
  if (session?.authFailureStatus) { fail('editor login', `auth-status-${session.authFailureStatus}-${session.authFailureCode}`); return }
  pass('editor login')
  const cookie = await cookiesForSession(session)
  const profile = await firstRow(session.access_token, 'users', `select=id,role&id=eq.${session.user?.id}`)
  profile?.role === 'editor' ? pass('editor role', 'editor') : fail('editor role', 'unexpected')
  const page = await appRequest(cookie, '/quan-tri')
  statusOf(page) === 200 ? pass('editor dashboard') : fail('editor dashboard', String(statusOf(page)))
  const article = await firstRow(session.access_token, 'articles', 'select=id,featured&published=eq.true&limit=1')
  if (article) {
    const update = await appRequest(cookie, '/api/quan-tri', { method: 'PATCH', body: JSON.stringify({ table: 'articles', id: article.id, field: 'featured', value: article.featured }) })
    const updatePayload = statusOf(update) === 200 ? null : await jsonOf(update)
    statusOf(update) === 200 ? pass('editor permitted content update') : fail('editor permitted content update', String(statusOf(update)) + '-' + safeFailure(updatePayload))
  } else block('editor permitted content update', 'no seeded article')
  const adminOnly = await appRequest(cookie, '/api/quan-tri', { method: 'PATCH', body: JSON.stringify({ table: 'factors', id: '00000000-0000-0000-0000-000000000000', field: 'active', value: false }) })
  statusOf(adminOnly) === 403 ? pass('editor denied admin-only update') : fail('editor denied admin-only update', String(statusOf(adminOnly)))
  const adminRpc = await rpc(session.access_token, 'admin_list_users', { p_limit: 1 })
  statusOf(adminRpc) === 200 ? fail('editor denied admin_list_users') : pass('editor denied admin_list_users')
  const logout = await appRequest(cookie, '/auth/sign-out', { method: 'POST' })
  statusOf(logout) === 200 ? pass('editor logout') : fail('editor logout', String(statusOf(logout)))
}

async function testAdmin() {
  const session = await login(process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD)
  if (session?.authFailureStatus) { fail('admin login', `auth-status-${session.authFailureStatus}-${session.authFailureCode}`); return }
  pass('admin login')
  const cookie = await cookiesForSession(session)
  const profile = await firstRow(session.access_token, 'users', `select=id,role&id=eq.${session.user?.id}`)
  profile?.role === 'admin' ? pass('admin role', 'admin') : fail('admin role', 'unexpected')
  const page = await appRequest(cookie, '/quan-tri')
  statusOf(page) === 200 ? pass('admin dashboard') : fail('admin dashboard', String(statusOf(page)))
  const users = await rpc(session.access_token, 'admin_list_users', { p_limit: 3 })
  const usersPayload = statusOf(users) === 200 ? null : await jsonOf(users)
  statusOf(users) === 200 ? pass('admin user listing') : fail('admin user listing', String(statusOf(users)) + '-' + safeFailure(usersPayload))
  const metrics = await rpc(session.access_token, 'get_impact_metrics')
  if (statusOf(metrics) === 200) pass('admin metrics')
  else if (statusOf(metrics) === 404) block('admin metrics', 'missing database migration')
  else fail('admin metrics', String(statusOf(metrics)))

  const slug = `E2E_TEST_SCENARIO_${Date.now()}`
  const create = await appRequest(cookie, '/api/quan-tri', { method: 'POST', body: JSON.stringify({ table: 'game_scenarios', values: { slug, title: 'E2E_TEST_SCENARIO', description: 'E2E test data', active: true } }) })
  const created = serviceKey ? await firstRow(serviceKey, 'game_scenarios', `select=id,slug,active&slug=eq.${encodeURIComponent(slug)}`) : null
  if (statusOf(create) === 200 && created) {
    pass('admin create')
    const update = await appRequest(cookie, '/api/quan-tri', { method: 'PATCH', body: JSON.stringify({ table: 'game_scenarios', id: created.id, field: 'active', value: false }) })
    statusOf(update) === 200 ? pass('admin update') : fail('admin update', String(statusOf(update)))
    const audit = await rows(session.access_token, 'admin_audit_logs', `select=id,action,table_name,record_id&record_id=eq.${created.id}`)
    if (statusOf(audit.response) === 200 && Array.isArray(audit.data) && audit.data.length) pass('admin audit log')
    else if (statusOf(audit.response) === 404) block('admin audit log', 'missing database migration')
    else fail('admin audit log', String(statusOf(audit.response)))
    const deleteAttempt = await appRequest(cookie, '/api/quan-tri', { method: 'DELETE', body: JSON.stringify({ table: 'game_scenarios', id: created.id }) })
    const deleted = serviceKey ? await firstRow(serviceKey, 'game_scenarios', `select=id&id=eq.${created.id}`) : null
    const deleteAudit = await rows(session.access_token, 'admin_audit_logs', `select=id,action,table_name,record_id&record_id=eq.${created.id}&action=eq.delete`)
    if (statusOf(deleteAttempt) === 200 && !deleted) pass('admin delete')
    else fail('admin delete', String(statusOf(deleteAttempt)))
    if (statusOf(deleteAudit.response) === 200 && Array.isArray(deleteAudit.data) && deleteAudit.data.length) pass('admin delete audit log')
    else if (statusOf(deleteAudit.response) === 404) block('admin delete audit log', 'missing database migration')
    else fail('admin delete audit log', String(statusOf(deleteAudit.response)))
    cleanup.push(async () => serviceRequest(`admin_audit_logs?record_id=eq.${created.id}`, { method: 'DELETE' }))
    if (deleted) cleanup.push(async () => serviceRequest(`game_scenarios?id=eq.${created.id}`, { method: 'DELETE' }))
  } else if (statusOf(create) === 500 && created) {
    fail('admin create', 'audit failure after write')
    cleanup.push(async () => serviceRequest(`game_scenarios?id=eq.${created.id}`, { method: 'DELETE' }))
  } else if (!serviceKey) block('admin create', 'cleanup service key unavailable')
  else {
    const createPayload = await jsonOf(create)
    fail('admin create', String(statusOf(create)) + '-' + safeFailure(createPayload))
  }
  const logout = await appRequest(cookie, '/auth/sign-out', { method: 'POST' })
  statusOf(logout) === 200 ? pass('admin logout') : fail('admin logout', String(statusOf(logout)))
}

async function checkSchemaUnauthenticated() {
  const commitments = await rows(publicKey, 'commitments_public', 'select=id,title,user_name,class_name,faculty,created_at&limit=1')
  const commitmentShape = Array.isArray(commitments.data) && commitments.data.every((row) => row.id && typeof row.title === 'string' && typeof row.user_name === 'string' && row.created_at)
  if (statusOf(commitments.response) === 200 && commitmentShape) pass('commitments_public view')
  else if (statusOf(commitments.response) === 404) block('commitments_public view', 'missing privacy migration')
  else fail('commitments_public view', String(statusOf(commitments.response)))

  const factors = await rows(publicKey, 'emission_factors', 'select=category,value,unit,name,source,source_year&active=eq.true&limit=20')
  const categories = new Set(Array.isArray(factors.data) ? factors.data.map((row) => row.category).filter(Boolean) : [])
  const factorShape = Array.isArray(factors.data) && factors.data.every((row) => row.name && row.unit && Number.isFinite(Number(row.value)))
  if (statusOf(factors.response) === 200 && factorShape && categories.size >= 4) pass('emission factors seed')
  else if (statusOf(factors.response) === 404) block('emission factors seed', 'missing schema migration')
  else fail('emission factors seed', String(statusOf(factors.response)))

  const badges = await restRequest(publicKey, 'badges?select=slug,name,active&active=eq.true&limit=1')
  if (statusOf(badges) === 200) pass('badges schema')
  else if (statusOf(badges) === 404) block('badges schema', 'missing database migration')
  else fail('badges schema', String(statusOf(badges)))
  const metrics = await rpc(publicKey, 'get_impact_metrics')
  const metricsPayload = statusOf(metrics) === 200 ? await jsonOf(metrics) : null
  const metricKeys = ['participants', 'tasks', 'co2', 'cups']
  if (statusOf(metrics) === 200 && metricKeys.every((key) => Object.prototype.hasOwnProperty.call(metricsPayload || {}, key))) pass('impact metrics schema')
  else if (statusOf(metrics) === 200) fail('impact metrics schema', 'missing fields')
  else if (statusOf(metrics) === 404) block('impact metrics schema', 'missing database migration')
  else fail('impact metrics schema', String(statusOf(metrics)))
}

async function checkPublicRpcContracts() {
  const today = await rpc(publicKey, 'get_today_challenges')
  const todayPayload = statusOf(today) === 200 ? await jsonOf(today) : null
  if (statusOf(today) === 200 && Array.isArray(todayPayload)) pass('get_today_challenges RPC')
  else fail('get_today_challenges RPC', String(statusOf(today)))
  const gameQuestions = await rpc(publicKey, 'get_daily_game_questions')
  const gamePayload = statusOf(gameQuestions) === 200 ? await jsonOf(gameQuestions) : null
  if (statusOf(gameQuestions) === 200 && Array.isArray(gamePayload) && gamePayload.every((item) => item.id && item.question && Array.isArray(item.options) && item.game_type)) pass('get_daily_game_questions RPC')
  else fail('get_daily_game_questions RPC', String(statusOf(gameQuestions)))
  const leaderboard = await rpc(publicKey, 'get_leaderboard', { p_period: 'week', p_scope: 'all', p_school: null, p_faculty: null, p_cohort: null, p_page: 1, p_page_size: 3 })
  const leaderboardPayload = statusOf(leaderboard) === 200 ? await jsonOf(leaderboard) : null
  if (statusOf(leaderboard) === 200 && Array.isArray(leaderboardPayload?.people)) pass('get_leaderboard RPC')
  else fail('get_leaderboard RPC', String(statusOf(leaderboard)))
}

async function diagnoseTestAccounts() {
  if (!serviceKey) { block('test account records', 'service key unavailable'); return }
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !Array.isArray(payload?.users)) { block('test account records', `auth-admin-status-${response.status}`); return }
  const expected = [
    ['user', process.env.TEST_USER_EMAIL],
    ['editor', process.env.TEST_EDITOR_EMAIL],
    ['admin', process.env.TEST_ADMIN_EMAIL],
  ]
  for (const [role, email] of expected) {
    const account = payload.users.find((item) => item.email === email)
    if (!account) block(`${role} account record`, 'not found')
    else if (!account.email_confirmed_at) block(`${role} account record`, 'email_not_confirmed')
    else pass(`${role} account record`, 'present and confirmed')
  }
}

await testGuestBoundaries()
await checkSchemaUnauthenticated()
await checkPublicRpcContracts()
await diagnoseTestAccounts()
await testUser()
await testEditor()
await testAdmin()

if (!serviceKey && cleanup.length) block('cleanup', 'service key unavailable')
for (const action of cleanup.reverse()) {
  try {
    const response = await action()
    if (response && !response.ok) fail('cleanup', String(response.status))
  } catch { fail('cleanup') }
}

console.log(`SUMMARY passed=${passed} failed=${failed} blocked=${blocked}`)
process.exit(failed ? 1 : 0)
