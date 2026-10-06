import fs from 'node:fs'
import {chromium} from '@playwright/test'
const base=process.env.BASE_URL||'http://localhost:3000'
let browser
let page
const report={site:base,full_lifecycle_verified:false}
try{
 browser=await chromium.launch({headless:!process.argv.includes('--headed')})
 const ctx=await browser.newContext()
 page=await ctx.newPage()
 const request=page.waitForRequest(r=>new URL(r.url()).pathname==='/auth/v1/authorize')
 await page.goto(base+'/auth/login?next=/profile')
 await page.getByRole('button',{name:'Tiếp tục với Google',exact:true}).click()
 const authorize=new URL((await request).url())
 const callback=new URL(authorize.searchParams.get('redirect_to'))
 report.effective_callback={origin:callback.origin,path:callback.pathname,next:callback.searchParams.get('next'),sdk_flow_id_present:!!callback.searchParams.get('sb_flow_id')}
 await page.waitForURL(u=>u.hostname==='accounts.google.com',{timeout:15000})
 report.provider_reached=true
 report.email_input_count=await page.locator('input[type=email]').count()
 report.next_button_count=await page.getByRole('button',{name:'Next',exact:true}).count()
 report.input_fields=await page.locator('input').evaluateAll(inputs=>inputs.map(i=>({type:i.type,name:i.name,id:i.id})))
 if(process.env.GOOGLE_TEST_EMAIL){
  await page.locator('#identifierId').fill(process.env.GOOGLE_TEST_EMAIL)
  await page.getByRole('button',{name:'Next',exact:true}).click()
  await page.waitForTimeout(2500)
 }
 const text=await page.locator('body').innerText()
 report.google_security_block=/browser or app may not be secure|couldn.t sign you in|automated queries|unusual traffic/i.test(text)
 report.status=report.google_security_block?'GOOGLE_OAUTH_BROWSER_VERIFICATION_BLOCKED':'GOOGLE_OAUTH_BROWSER_VERIFICATION_PENDING_INTERACTIVE_SIGNIN'
 report.password_entry_required=await page.locator('input[type=password]:visible').count()>0
 console.log(JSON.stringify(report,null,2))
}catch(e){
 report.failure_kind=e.name
 const text=await page?.locator('body').innerText({timeout:3000}).catch(()=>'')||''
 report.google_security_block=/browser or app may not be secure|couldn.t sign you in|automated queries|unusual traffic/i.test(text)
 report.provider_error_code=text.match(/redirect_uri_mismatch|invalid_request|access_denied|Error 400|Error 403/)?.[0]||null
 report.provider_heading=(await page?.locator('h1').allTextContents().catch(()=>[])||[]).join(' ').replaceAll(process.env.GOOGLE_TEST_EMAIL||'unused','<redacted>').slice(0,200)
 report.status=report.google_security_block?'GOOGLE_OAUTH_BROWSER_VERIFICATION_BLOCKED':'GOOGLE_OAUTH_BROWSER_VERIFICATION_PENDING'
 console.log(JSON.stringify(report,null,2));process.exitCode=1
}
finally{fs.writeFileSync('auth-google-browser.json',JSON.stringify(report,null,2)+'\n');if(browser)await browser.close()}
