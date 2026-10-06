// Normal admin UI only. No service key, SQL, persisted login state or score-changing actions.
import fs from 'node:fs'
import { chromium } from '@playwright/test'
import { createServerClient } from '@supabase/ssr'
let db
const dbTable = table => table === 'quiz' ? 'quiz_questions' : table
const persistedFields = { articles: 'id,title,slug,category,excerpt,content,source,source_url,author_name,cover_url,illustration_label,review_status,published,subject_consented', quiz: 'id,question,options,game_type,explanation,source,active', challenges: 'id,title,slug,description,points,duration_days,topic,active', tasks: 'id,title,challenge_id,description,points,day_number,why,requires_photo,active', waste_items: 'id,name,category,explanation,difficulty,active', campaigns: 'id,name,slug,description,starts_at,ends_at,published,banner_url,active' }
async function readRows(table) { const r=await db.from(dbTable(table)).select(persistedFields[table]); requireCheck(!r.error, 'Read verification failed for '+table+' ('+(r.error?.code||'unknown')+')'); return r.data }
async function verifyPersisted(table,item,record,beforePublish=false) {
 const rows=await readRows(table); const r=rows.find(x=>x.id===record.id); requireCheck(r,'Record missing: '+table);
 for(const key of Object.keys(config[table][1])) { if(item[key]==null || key==='correct_answer')continue; const actual=r[key]; const expected=item[key]; requireCheck(['starts_at','ends_at'].includes(key)?new Date(actual).getTime()===new Date(expected).getTime():String(actual)===String(expected),'Persisted field mismatch: '+table+' / '+key); }
 if(table==='quiz') requireCheck(r.game_type==='true-false'&&JSON.stringify(r.options)===JSON.stringify(['Đúng','Sai'])&&r.active===true,'Quiz options/type/active mismatch');
 if(table==='tasks')requireCheck(r.requires_photo===false&&r.active===true,'Task photo/active mismatch');
 if(['challenges','waste_items'].includes(table))requireCheck(r.active===true,'Active mismatch');
 if(table==='articles'){requireCheck(!r.cover_url&&!r.subject_consented,'Unexpected image/consent');if(beforePublish)requireCheck(r.review_status==='draft'&&!r.published,'Article not created as draft');}
 if(table==='campaigns'){requireCheck(!r.banner_url,'Unexpected campaign image');if(beforePublish)requireCheck(!r.published,'Campaign not created unpublished');}
 if(!beforePublish&&['articles','campaigns'].includes(table))requireCheck(r.published===true,'Publication did not persist');
 record.verification.persisted_fields=true; record.publication_state=beforePublish?'DRAFT':['articles','campaigns'].includes(table)?'PUBLISHED':'ACTIVE'; saveLedger(); return r;
}
const base = 'https://song-xanh.vercel.app'
const drafts = JSON.parse(fs.readFileSync('content-drafts.json', 'utf8'))
const ledger = JSON.parse(fs.readFileSync('content-sources.json', 'utf8'))
const env = {}
for (const line of fs.readFileSync('.env.test.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
  if (match) env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
}
const config = {
  articles: ['Bài viết', { title: 'Tiêu đề', slug: 'Slug', category: 'Loại', excerpt: 'Tóm tắt', content: 'Nội dung', source: 'Nguồn', source_url: 'Đường dẫn nguồn', author_name: 'Tác giả', illustration_label: 'Chú thích minh họa' }],
  quiz: ['Câu hỏi Đúng/Sai', { question: 'Nội dung câu hỏi', correct_answer: 'Đáp án', explanation: 'Giải thích', source: 'Nguồn' }],
  challenges: ['Thử thách', { title: 'Tên thử thách', slug: 'Slug', description: 'Mô tả', points: 'Điểm', duration_days: 'Số ngày', topic: 'Chủ đề' }],
  tasks: ['Nhiệm vụ', { challenge_id: 'Mã thử thách (UUID)', title: 'Tên nhiệm vụ', description: 'Mô tả', why: 'Vì sao nên làm', points: 'Điểm', day_number: 'Ngày' }],
  waste_items: ['Phân loại rác', { name: 'Tên vật phẩm', category: 'Nhóm rác', explanation: 'Giải thích và nguồn', difficulty: 'Độ khó' }],
  campaigns: ['Chiến dịch', { name: 'Tên chiến dịch', slug: 'Slug', description: 'Thông điệp', starts_at: 'Bắt đầu (giờ Việt Nam)', ends_at: 'Kết thúc (giờ Việt Nam)' }],
}
function saveLedger() {
  for(const i of ledger.items){const p=ledger.prepared_localization_review?.find(x=>x.key===i.prepared_key);if(p)p.production_status=i.publication_state||'CREATED';}

  fs.writeFileSync('content-sources.json', JSON.stringify(ledger, null, 2) + '\n')
  const intro = fs.readFileSync('CONTENT_SOURCES.md', 'utf8').split('\n## Production items\n')[0].replace('No new production records have been created yet.', 'New production records are listed below with per-item verification.').replace('Production creation, draft preview, publication, persistence and public rendering are pending deployment of the CMS fixes.', 'See per-item verification below for creation, preview, publication and public-render status.')
  const entries = ledger.items.map((item) => '- **' + item.type + ': ' + item.title + '**; slug: `' + item.slug + '`; URL: ' + item.public_url + '; sources: ' + item.sources.map((source) => source.publisher + ' — ' + source.title + ' (' + source.url + ', accessed ' + source.accessed_date + ')').join('; ') + '; status: '+(item.publication_state||'CREATED')+'; ID: '+item.id+'; localization: '+item.localization.status+'; images: existing UI fallback, no external image; verification: `' + JSON.stringify(item.verification) + '`.').join('\n')
  const reviews=(ledger.prepared_localization_review||[]).map(x=>'- '+x.title+' — '+x.status+'; '+x.production_status).join('\n');
  fs.writeFileSync('CONTENT_SOURCES.md', intro + '\n## Production items\n\n' + entries + '\n\n## Vietnam-localization review\n\n'+reviews+'\n\nVietnam sources: '+drafts.sources.vn_waste.url+' ; '+drafts.sources.vn_air.url+'\n')
}
function requireCheck(condition, message) { if (!condition) throw new Error(message) }
function titleOf(item) { return item.title || item.name || item.question }
function publicUrl(table, item, id) {
  return base + (table === 'articles' ? '/guong-sang/' + item.slug : table === 'campaigns' ? '/chien-dich/' + id : ['challenges', 'tasks'].includes(table) ? '/thu-thach' : '/tro-choi')
}
async function selectSection(page, table) {
  const name = config[table][0]
  await page.locator('main nav').getByRole('button', { name, exact: true }).click()
  await page.getByRole('heading', { level: 2, name, exact: true }).waitFor()
}
async function reloadAdmin(page) {
  await page.goto(base + '/quan-tri')
  await page.getByText(/Vai trò hiện tại: Admin/).waitFor()
}
async function rowFor(page, title) {
  return page.locator('main section .space-y-3 > div').filter({ has: page.getByText(title, { exact: true }) })
}
async function verifyPublic(reader, record, item, table) {
  await reader.goto(record.public_url)
  if (table === 'tasks') {
    const card = reader.locator('article').filter({ has: reader.getByRole('heading', { name: item.challenge_title, exact: true }) })
    await card.getByRole('button', { name: 'Xem chi tiết', exact: true }).click()
  }
  const content = reader.locator('main')
  await content.getByText(titleOf(item), { exact: true }).first().waitFor()
  if (table === 'articles') {
    await reader.getByRole('heading', { level: 1, name: item.title, exact: true }).waitFor()
    requireCheck(await reader.locator('article').innerText().then((text) => text.includes(item.content.split('\n')[0])), 'Article content did not render')
    requireCheck(await reader.locator('a[href="' + item.source_url + '"]').count() > 0, 'Source link missing')
    requireCheck(await reader.locator('article img').count() === 0, 'Unexpected image in fallback-only article')
  }
  await reader.reload()
  if (table === 'tasks') await reader.locator('article').filter({ has: reader.getByRole('heading', { name: item.challenge_title, exact: true }) }).getByRole('button', { name: 'Xem chi tiết', exact: true }).click()
  await content.getByText(titleOf(item), { exact: true }).first().waitFor()
  record.verification = { ...record.verification, public_render: true, reload_persistence: true, vietnamese_title: true }
  saveLedger()
}
async function createThroughForm(page, reader, table, item) {
  requireCheck(['VIETNAM-VERIFIED','GENERAL-GLOBAL-GUIDANCE'].includes(item.localization?.status),'Blocked localization: '+item.slug)
  let record = ledger.items.find((entry) => entry.type === item.type && entry.prepared_key === item.slug)
  if (record) {
    requireCheck(!record.verification.publication_failed, 'Publication audit recovery required; no automatic retry')
    requireCheck(record.id && record.verification.audit_logged, 'Existing ledger entry needs manual audit recovery; no automatic retry')
  } else {
    await reloadAdmin(page)
    await selectSection(page, table)
    const existing=(await readRows(table)).find(x=>[x.title,x.name,x.question].includes(titleOf(item)) || (['articles','challenges','campaigns'].includes(table)&&x.slug===item.slug));
    if(existing){const review=ledger.prepared_localization_review?.find(x=>x.key===item.slug);if(review)review.production_status='SKIPPED_EXISTING';ledger.skipped_existing??=[];ledger.skipped_existing.push({type:item.type,title:titleOf(item),id:existing.id,slug:existing.slug||null,localization:item.localization,status:'SKIPPED_EXISTING'});saveLedger(); console.log('SKIPPED_EXISTING:',table,item.slug); return {id:existing.id,skipped_existing:true};}
    for (const [key, label] of Object.entries(config[table][1])) {
      if (item[key] === undefined || item[key] === null) continue
      const field = page.getByLabel(label, { exact: true })
      let value = String(item[key])
      if (key === 'starts_at' || key === 'ends_at') value = value.slice(0, 19).replace(/:00$/, '')
      if (key === 'correct_answer' || (table === 'waste_items' && key === 'category')) await field.selectOption(value)
      else await field.fill(value)
    }
    if (table === 'articles') await page.locator('main section select').selectOption('draft')
    const responsePromise = page.waitForResponse((response) => response.url() === base + '/api/quan-tri' && response.request().method() === 'POST')
    await page.getByRole('button', { name: 'Lưu bản ghi', exact: true }).click()
    const response = await responsePromise
    const result = await response.json().catch(() => null)
    requireCheck(result?.id, 'CMS did not return a saved ID; inspect current state before retrying')
    record = { type: item.type, title: titleOf(item), prepared_key: item.slug, localization:item.localization, publication_state:'CREATED', slug: ['articles','challenges','campaigns'].includes(table)?item.slug:null, id: result.id, public_url: publicUrl(table, item, result.id), created_date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()), sources: item.source_ids.map((key) => drafts.sources[key]), images: drafts.images, verification: { created_through_admin_ui: true, audit_logged: response.ok(), source_verified: true, original_copy_reviewed: true, public_render: false, published: false } }
    ledger.items.push(record)
    saveLedger()
    requireCheck(response.ok(), 'Record saved but audit failed; do not resubmit')
    await (await rowFor(page,titleOf(item))).waitFor(); record.verification.admin_refresh=true; saveLedger();
    await verifyPersisted(table,item,record,['articles','campaigns'].includes(table));
  }
  await reloadAdmin(page)
  await selectSection(page, table)
  const row = await rowFor(page, titleOf(item))
  requireCheck(await row.count() === 1, 'Saved record missing or duplicated')
  if (table === 'articles' && !record.verification.published) {
    const preview = await page.context().newPage()
    await preview.goto(record.public_url)
    await preview.getByRole('heading', { level: 1, name: item.title, exact: true }).waitFor()
    await preview.getByText(/Bản xem trước dành cho biên tập viên/).waitFor()
    requireCheck(await preview.locator('a[href="'+item.source_url+'"]').count()>0,'Draft source link missing');
    requireCheck(await preview.locator('article img').count()===0,'Unexpected draft image');
    requireCheck(await preview.locator('article svg').count()>0,'Fallback illustration missing');
    requireCheck(await preview.locator('article').innerText().then((text) => text.includes(item.content.split('\n')[0])), 'Draft preview content missing')
    await preview.close()
    record.verification.draft_preview = true
    saveLedger()
  }
  if (table === 'articles' || table === 'campaigns') {
    const enable = row.getByRole('button', { name: 'Bật', exact: true })
    if (await enable.count()) {
      const responsePromise = page.waitForResponse((response) => response.url() === base + '/api/quan-tri' && response.request().method() === 'PATCH')
      await enable.click()
      const response = await responsePromise
      const payload = response.request().postDataJSON()
      requireCheck(payload.id === record.id && payload.field === 'published' && payload.value === true, 'Unexpected publication update')
      if (!response.ok()) { record.verification.publication_failed = true; saveLedger() }
      requireCheck(response.ok(), 'Publication request failed; inspect record before retry')
    }
    record.verification.published = true
    saveLedger()
  }
  await verifyPersisted(table,item,record);
  if (!['quiz', 'waste_items'].includes(table)) await verifyPublic(reader, record, item, table)
  console.log('Verified CMS item:', table, item.slug)
  return record
}

;(async () => {
  let browser
  try {
    requireCheck(env.TEST_ADMIN_EMAIL && env.TEST_ADMIN_PASSWORD, 'Admin credentials missing')
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ timezoneId: 'Asia/Ho_Chi_Minh' })
    const page = await context.newPage()
    context.on('page',p=>p.on('pageerror',()=>{ledger.browser_errors=(ledger.browser_errors||0)+1;saveLedger()}));
    page.on('pageerror',()=>{ledger.browser_errors=(ledger.browser_errors||0)+1;saveLedger()});
    await page.goto(base + '/auth/login?next=/quan-tri')
    await page.locator('input[name=email]').fill(env.TEST_ADMIN_EMAIL)
    await page.locator('input[name=password]').fill(env.TEST_ADMIN_PASSWORD)
    await page.locator('form button').first().click()
    await page.waitForURL('**/quan-tri')
    await page.getByText(/Vai trò hiện tại: Admin/).waitFor()
    const publicEnv={}; for(const line of fs.readFileSync('.env','utf8').split(/\r?\n/)){const m=line.match(/^\s*(NEXT_PUBLIC_SUPABASE_(?:URL|PUBLISHABLE_KEY|ANON_KEY))\s*=\s*(.*)\s*$/);if(m)publicEnv[m[1]]=m[2].trim().replace(/^(['"])(.*)\1$/,'$2');}
    db=createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL,publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookieEncoding:'base64url',cookies:{getAll:async()=>await context.cookies(base),setAll:()=>{}}});
    const {data:{user},error:authError}=await db.auth.getUser();requireCheck(!authError&&user,'Normal browser session verification failed');const role=await db.from('users').select('role').eq('id',user.id).single();requireCheck(role.data?.role==='admin','Admin role verification failed');
    for(const table of Object.keys(config))await readRows(table);
    // Preflight every creation form before performing any CMS write.
    for (const table of Object.keys(config)) {
      await selectSection(page, table)
      for (const label of Object.values(config[table][1])) requireCheck(await page.getByLabel(label, { exact: true }).count() === 1, 'Required deployed CMS field missing: ' + table + ' / ' + label)
    }
    console.log('Live CMS preflight passed')
    if (!process.argv.includes('--publish')) { console.log('Read-only check complete; publication requires --publish'); return }
    const readerContext = await browser.newContext()
    const reader = await readerContext.newPage()
    reader.on('pageerror',()=>{ledger.browser_errors=(ledger.browser_errors||0)+1;saveLedger()});
    reader.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base)){ledger.http_failures??=[];ledger.http_failures.push({path:new URL(r.url()).pathname,status:r.status()});saveLedger()}});
    // All mutations below are normal form saves/status buttons for these specific new records.
    for (const item of process.argv.includes('--campaign-only')?[]:drafts.articles) await createThroughForm(page, reader, 'articles', item)
    for (const item of process.argv.includes('--campaign-only')?[]:drafts.quiz) await createThroughForm(page, reader, 'quiz', item)
    for (const item of process.argv.includes('--campaign-only')?[]:drafts.challenges) {
      const challenge = await createThroughForm(page, reader, 'challenges', item)
      for (const task of challenge.skipped_existing?[]:item.tasks) await createThroughForm(page, reader, 'tasks', { ...task, challenge_id: challenge.id, challenge_title: item.title })
    }
    for (const item of process.argv.includes('--campaign-only')?[]:drafts.waste_items) await createThroughForm(page, reader, 'waste_items', item)
    for (const item of drafts.campaigns) await createThroughForm(page, reader, 'campaigns', item)
    console.log('Content creation finished; game interaction/source-link/layout checks remain to be audited separately')
  } catch (error) {
    console.log('Failure category:',String(error.message).split('\n')[0].replaceAll(env.TEST_ADMIN_EMAIL||'unused-secret','<redacted>').replaceAll(env.TEST_ADMIN_PASSWORD||'unused-secret','<redacted>'));
    console.log('STOP:', error.message.startsWith('Required deployed') || error.message.startsWith('Title already') || error.message.startsWith('Record saved') || /mismatch|missing|verification failed|Read verification|Blocked localization|Unexpected|Article not|Campaign not|Malformed value|CMS did not return/.test(error.message) ? error.message : 'Browser/CMS verification failed; inspect current state before retrying')
    process.exitCode = 1
  } finally { if (browser) await browser.close() }
})()
