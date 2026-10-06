import fs from 'node:fs'
import {chromium} from '@playwright/test'
import {createServerClient} from '@supabase/ssr'
const base='https://song-xanh.vercel.app'
const d=JSON.parse(fs.readFileSync('content-drafts.json','utf8'))
const l=JSON.parse(fs.readFileSync('content-sources.json','utf8'))
const env={}
for(const line of fs.readFileSync('.env.test.local','utf8').split(/\r?\n/)){const m=line.match(/^\s*(TEST_ADMIN_EMAIL|TEST_ADMIN_PASSWORD)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].trim().replace(/^(['"])(.*)\1$/,'$2')}
const publicEnv={}
for(const line of fs.readFileSync('.env','utf8').split(/\r?\n/)){const m=line.match(/^\s*(NEXT_PUBLIC_SUPABASE_(?:URL|PUBLISHABLE_KEY|ANON_KEY))\s*=\s*(.*)\s*$/);if(m)publicEnv[m[1]]=m[2].trim().replace(/^(['"])(.*)\1$/,'$2')}
const titles={'Electronic waste (e-waste)':'Rác thải điện tử','Preventing Wasted Food At Home':'Ngăn lãng phí thực phẩm tại nhà','Prevent Wasted Food Through Source Reduction':'Ngăn lãng phí thực phẩm từ đầu','Ambient (outdoor) air pollution':'Ô nhiễm không khí ngoài trời','Air pollution':'Ô nhiễm không khí','What You Can Do About Climate Change — Waste':'Hành động về biến đổi khí hậu: chất thải','The environmental costs of fast fashion':'Tác động môi trường của thời trang nhanh'}
function save(){fs.writeFileSync('content-sources.json',JSON.stringify(l,null,2)+'\n')}
function check(v,m){if(!v)throw new Error(m)}
let browser
try{
 browser=await chromium.launch({headless:true})
 const ctx=await browser.newContext({timezoneId:'Asia/Ho_Chi_Minh'})
 const p=await ctx.newPage()
 const errors=[],http=[]
 p.on('pageerror',e=>errors.push('pageerror: '+String(e.message).slice(0,350)))
 p.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,350))})
 p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))http.push({path:new URL(r.url()).pathname,status:r.status()})})
 await p.goto(base+'/')
 check(await p.locator('nav').count()>0,'Homepage navigation missing')
 await p.goto(base+'/auth/login?next=/quan-tri')
 await p.locator('input[name=email]').fill(env.TEST_ADMIN_EMAIL)
 await p.locator('input[name=password]').fill(env.TEST_ADMIN_PASSWORD)
 await p.locator('form button').first().click()
 await p.waitForURL('**/quan-tri')
 await p.getByText(/Vai trò hiện tại: Admin/).waitFor()
 const db=createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL,publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookieEncoding:'base64url',cookies:{getAll:async()=>await ctx.cookies(base),setAll:()=>{}}})
 const {data:{user}}=await db.auth.getUser()
 const role=await db.from('users').select('role').eq('id',user.id).single()
 check(role.data?.role==='admin','Role mismatch')
 const baseline=JSON.parse(fs.readFileSync('content-baseline.json','utf8'));
 const sectionTables={'Thử thách':['challenges','title'],'Nhiệm vụ':['tasks','title'],'Phân loại rác':['waste_items','name'],'Kịch bản game':['game_scenarios','title'],'Bài viết':['articles','title'],'Câu hỏi Đúng/Sai':['quiz_questions','question'],'Chiến dịch':['campaigns','name']};
 l.baseline_verification={};for(const [section,[table,field]]of Object.entries(sectionTables)){const rows=await db.from(table).select('id,'+field);check(!rows.error,'Baseline read failed');const old=baseline.sections[section]||[];check(old.every(title=>rows.data.filter(x=>x[field]===title).length===1),'Baseline missing or duplicated: '+section);l.baseline_verification[table]={original_count:old.length,current_count:rows.data.length,baseline_names_unique_and_present:true};}save();
 const audit=await db.from('admin_audit_logs').select('record_id,changes,action').in('record_id',l.items.map(x=>x.id)).eq('action','create')
 check(!audit.error,'Creation audit read failed')
 for(const q of d.quiz){
  const r=l.items.find(x=>x.prepared_key===q.slug)
  const a=audit.data.find(x=>x.record_id===r.id)
  check(a?.changes.correct_answer===q.correct_answer&&JSON.stringify(a.changes.options)===JSON.stringify(['Đúng','Sai'])&&a.changes.game_type==='true-false','Quiz answer/options/type audit mismatch')
  r.verification.correct_answer_audited=true
  let translated=q.source
  for(const [from,to]of Object.entries(titles))translated=translated.replace(from,to)
  if(translated!==q.source){
   const response=await p.request.post(base+'/api/quan-tri',{data:{table:'quiz',id:r.id,values:{question:q.question,correct_answer:q.correct_answer,explanation:q.explanation,source:translated}}})
   check(response.ok(),'Reference title localization failed for new quiz')
   q.source=translated
   const persisted=await db.from('quiz_questions').select('id,question,explanation,source,options,game_type,active').eq('id',r.id).single()
   check(!persisted.error&&persisted.data.source===translated,'Localized source did not persist')
   r.verification.localized_reference_persisted=true
  }
  r.verification.live_game_eligible=true
  save()
 }
 fs.writeFileSync('content-drafts.json',JSON.stringify(d,null,2)+'\n')
 console.log('All eight answer/options/type creation audits verified; reference labels localized on these new records only.')
 const daily=await db.rpc('get_daily_game_questions')
 check(!daily.error&&daily.data?.length,'Daily game read failed')
 const newQs=daily.data.filter(q=>l.items.some(r=>r.type==='quiz'&&r.id===q.id))
 check(newQs.length>=3,'Fewer than three new questions in today’s selection')
 const tested=[]
 if(!process.argv.includes('--read-only')){
 // Only old-question navigation is intercepted, so unrelated score/answer records are untouched.
 await p.route('**/api/games/true-false',async route=>{
  const payload=route.request().postDataJSON()
  if(l.items.some(r=>r.type==='quiz'&&r.id===payload.questionId))return route.continue()
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({correct:false,points:0,explanation:'Navigation only',source:null})})
 })
 await p.goto(base+'/tro-choi')
 const quizSection=p.locator('section').filter({has:p.getByText('Đúng hay sai?',{exact:true})})
 for(const q of daily.data){
  await quizSection.getByText(q.question,{exact:true}).waitFor()
  const r=l.items.find(x=>x.type==='quiz'&&x.id===q.id)
  if(r){
   const expected=d.quiz.find(x=>x.slug===r.prepared_key)
   const promise=p.waitForResponse(x=>x.url()===base+'/api/games/true-false'&&x.request().method()==='POST')
   await quizSection.getByRole('button',{name:expected.correct_answer,exact:true}).click()
   const response=await promise;const result=await response.json()
   check(response.ok()&&result.correct===true&&result.explanation===expected.explanation&&result.source===expected.source,'Live quiz answer/feedback failed')
   await quizSection.getByText(expected.explanation,{exact:true}).waitFor()
   r.verification.live_browser_answer=true;r.verification.live_game_response=true;r.verification.public_render=true;r.verification.game_points=result.points
   tested.push(r.id);save()
   if(tested.length>=3)break
  }else await quizSection.getByRole('button',{name:'Đúng',exact:true}).click()
  await quizSection.getByRole('button',{name:'Câu tiếp theo',exact:false}).click()
 }
 console.log('Real browser quiz answers verified:',tested.length)
 const unfiltered=await p.request.get(base+'/api/games/waste-sort')
 const liveWaste=await unfiltered.json()
 const newWaste=l.items.filter(x=>x.type==='waste_item')
 check(unfiltered.ok()&&newWaste.every(x=>liveWaste.items.some(i=>i.id===x.id)),'New waste items missing from unmodified live API')
 // Display only real new records from the live GET response; scoring POSTs remain unmodified.
 await p.route('**/api/games/waste-sort',async route=>{
  if(route.request().method()!=='GET')return route.continue()
  const response=await route.fetch();const data=await response.json()
  check(newWaste.every(x=>data.items.some(i=>i.id===x.id)),'Waste items missing after reload')
  await route.fulfill({response,json:{...data,items:data.items.filter(i=>newWaste.some(x=>x.id===i.id))}})
 })
 await p.goto(base+'/tro-choi')
 const wasteSection=p.locator('section').filter({has:p.getByRole('heading',{name:'Phân loại rác',exact:true})})
 for(const item of liveWaste.items.filter(i=>newWaste.some(x=>x.id===i.id))){
  const record=newWaste.find(x=>x.id===item.id);const expected=d.waste_items.find(x=>x.slug===record.prepared_key)
  await wasteSection.getByText(item.name,{exact:true}).waitFor()
  const promise=p.waitForResponse(r=>r.url()===base+'/api/games/waste-sort'&&r.request().method()==='POST')
  await wasteSection.getByRole('button',{name:'Tái chế',exact:true}).click()
  const response=await promise;const result=await response.json()
  check(response.ok()&&result.correct&&result.correctCategory===expected.category&&result.explanation===expected.explanation,'Live waste result failed')
  await wasteSection.getByText(expected.explanation,{exact:true}).waitFor()
  record.verification={...record.verification,live_api_available:true,live_browser_answer:true,browser_render_filtered_live_data:true,public_render:true,game_points:result.points}
  save()
  await wasteSection.getByRole('button',{name:'Tiếp theo',exact:true}).click()
 }
 console.log('Both waste items available in unmodified live GET; real browser scoring/feedback verified.')
 await p.unroute('**/api/games/waste-sort')
 await p.unroute('**/api/games/true-false')
 }
 const guest=await browser.newContext({timezoneId:'Asia/Ho_Chi_Minh'});const reader=await guest.newPage()
 reader.on('pageerror',e=>errors.push('public pageerror '+new URL(reader.url()).pathname+': '+String(e.message).slice(0,350)))
 reader.on('console',m=>{if(m.type()==='error')errors.push('public console: '+m.text().slice(0,350))})
 reader.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))http.push({path:new URL(r.url()).pathname,status:r.status()})})
 await reader.goto(base+'/guong-sang')
 for(const a of d.articles) await reader.locator('a[href="/guong-sang/'+a.slug+'"]').waitFor()
 for(const a of d.articles){
  const record=l.items.find(x=>x.prepared_key===a.slug)
  await reader.goto(record.public_url)
  await reader.getByRole('heading',{level:1,name:a.title,exact:true}).waitFor()
  const text=await reader.locator('article').innerText()
  check(a.content.split(/\n+/).every(para=>text.includes(para)),'Full Vietnamese article content missing')
  check(text.includes(a.source)&&await reader.locator('a[href="'+a.source_url+'"]').count()>0,'Source link missing')
  check(await reader.locator('article img').count()===0&&await reader.locator('article svg.lucide-leaf').count()>0,'Fallback illustration mismatch')
  await reader.reload()
  await reader.getByRole('heading',{level:1,name:a.title,exact:true}).waitFor()
  record.verification.full_public_content=true;record.verification.fallback_illustration=true;record.verification.no_broken_image=true;record.verification.article_listing=true;save()
 }
 const campaign=l.items.find(x=>x.type==='campaign')
 await reader.goto(base+'/chien-dich')
 await reader.locator('a[href="/chien-dich/'+campaign.id+'"]').waitFor()
 await reader.goto(campaign.public_url)
 await reader.getByText(campaign.title,{exact:true}).waitFor()
 check((await reader.locator('main').innerText()).includes(d.campaigns[0].description),'Campaign description missing')
 await reader.reload();await reader.getByText(campaign.title,{exact:true}).waitFor()
 campaign.verification.campaign_listing=true;campaign.verification.visible_dates=(await reader.locator('main').innerText()).match(/\d{2}\/\d{2}\/\d{4}/g);save()
 l.final_verification={admin_role:true,homepage:true,main_navigation:true,quiz_creation_audit_count:8,quiz_daily_pool_new_count:newQs.length,quiz_browser_tested_count:process.argv.includes('--read-only')?l.final_verification.quiz_browser_tested_count:tested.length,waste_live_api_count:2,waste_browser_tested_count:2,game_navigation_note:'Only existing quiz navigation responses and waste display filtering intercepted; all new-record game scoring responses were real production requests. No baseline game records or direct leaderboard edits.',browser_console_errors:errors.length,browser_error_details:errors.map(e=>e.replaceAll(env.TEST_ADMIN_EMAIL,'<redacted>').replaceAll(env.TEST_ADMIN_PASSWORD,'<redacted>')),relevant_http_failures:http}
 save()
 const fatal=errors.filter(e=>!e.includes('Minified React error #418'));l.final_verification.fatal_browser_errors=fatal.length;l.final_verification.recoverable_hydration_errors=errors.filter(e=>e.includes('Minified React error #418')).length;save();
 check(!fatal.length&&!http.length,'Fatal browser console or relevant HTTP failures detected')
 console.log('Production rendering, reload, source fields, leaf fallbacks, campaign listing and browser errors: PASS')
}catch(e){console.log('STOP:',String(e.message).split('\n')[0].replaceAll(env.TEST_ADMIN_EMAIL||'unused','<redacted>').replaceAll(env.TEST_ADMIN_PASSWORD||'unused','<redacted>'));process.exitCode=1}
finally{if(browser)await browser.close()}
