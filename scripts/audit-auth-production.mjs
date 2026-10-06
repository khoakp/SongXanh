import fs from 'node:fs'
import {chromium} from '@playwright/test'
const env={}
for(const line of fs.readFileSync('.env.test.local','utf8').split(/\r?\n/)){const m=line.match(/^\s*(TEST_(?:USER|EDITOR|ADMIN)_(?:EMAIL|PASSWORD))\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].trim().replace(/^(['"])(.*)\1$/,'$2')}
const base='https://song-xanh.vercel.app'
const report={site:base,phase:'before_fix',checks:[],oauth:{}}
let browser
function assert(v,label){if(!v)throw new Error(label)}
try{
 browser=await chromium.launch({headless:true})
 const ctx=await browser.newContext()
 const p=await ctx.newPage()
 await p.goto(base+'/auth/login?next=/')
 await p.locator('input[name=email]').fill(env.TEST_USER_EMAIL)
 await p.locator('input[name=password]').fill(env.TEST_USER_PASSWORD)
 await p.locator('form button').first().click()
 await p.waitForURL(u=>u.pathname!=='/auth/login',{timeout:15000})
 report.checks.push({check:'existing user next=/ destination',path:new URL(p.url()).pathname,pass:new URL(p.url()).pathname==='/profile'})
 await p.goto(base+'/profile')
 await p.getByRole('heading',{name:'Hồ sơ của bạn',exact:true}).waitFor()
 assert((await p.locator('main').innerText()).includes(env.TEST_USER_EMAIL),'Existing user identity mismatch')
 report.checks.push({check:'existing user profile identity',pass:true})
 await p.reload();await p.getByRole('heading',{name:'Hồ sơ của bạn',exact:true}).waitFor()
 assert((await p.locator('main').innerText()).includes(env.TEST_USER_EMAIL),'Existing user reload identity mismatch')
 report.checks.push({check:'existing user reload',pass:true})
 const before=(await ctx.cookies(base)).filter(c=>/^sb-.*-auth-token(?:\.\d+)?$/.test(c.name)).length
 await p.getByRole('button',{name:'Đăng xuất',exact:true}).click()
 await p.waitForURL(u=>u.pathname==='/')
 const after=(await ctx.cookies(base)).filter(c=>/^sb-.*-auth-token(?:\.\d+)?$/.test(c.name)).length
 report.checks.push({check:'logout auth cookies removed',before_count:before,after_count:after,pass:before>0&&after===0})
 await p.goto(base+'/auth/login?next=/')
 await p.locator('input[name=email]').fill(env.TEST_USER_EMAIL)
 await p.locator('input[name=password]').fill(env.TEST_USER_PASSWORD)
 await p.locator('form button').first().click()
 await p.waitForURL(u=>u.pathname!=='/auth/login',{timeout:15000})
 report.checks.push({check:'same user relogin next=/ destination',path:new URL(p.url()).pathname,pass:new URL(p.url()).pathname==='/profile'})
 await p.goto(base+'/profile');await p.getByRole('heading',{name:'Hồ sơ của bạn',exact:true}).waitFor()
 assert((await p.locator('main').innerText()).includes(env.TEST_USER_EMAIL),'Relogin identity mismatch')
 await p.getByRole('button',{name:'Đăng xuất',exact:true}).click();await p.waitForURL(u=>u.pathname==='/')
 await p.goto(base+'/auth/login?next=/quan-tri')
 const authorize=p.waitForRequest(r=>new URL(r.url()).pathname==='/auth/v1/authorize')
 await p.getByRole('button',{name:'Tiếp tục với Google',exact:true}).click()
 const r=await authorize
 const authUrl=new URL(r.url())
 const redirect=new URL(authUrl.searchParams.get('redirect_to'))
 report.oauth={provider:authUrl.searchParams.get('provider'),effective_callback_origin:redirect.origin,effective_callback_path:redirect.pathname,next:redirect.searchParams.get('next'),canonical:redirect.origin===base&&redirect.pathname==='/auth/callback',pkce_present:!!authUrl.searchParams.get('code_challenge')}
 await p.waitForURL(u=>u.hostname==='accounts.google.com',{timeout:15000})
 report.oauth.google_provider_reached=true
 report.oauth.provider_page_summary=(await p.locator('body').innerText()).slice(0,350)
}catch(e){report.error=String(e.message).split('\n')[0].replaceAll(env.TEST_USER_EMAIL,'<redacted>').replaceAll(env.TEST_USER_PASSWORD,'<redacted>').replace(/(https?:\/\/[^\s?]+)\?[^\s]+/g,'$1?<redacted>');process.exitCode=1}
finally{fs.writeFileSync('auth-production-baseline.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(browser)await browser.close()}
