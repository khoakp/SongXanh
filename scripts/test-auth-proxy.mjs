import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { NextRequest, NextResponse } from 'next/server.js'

// Exercise the actual proxy with a simulated SDK refresh. No real sessions,
// token values, account writes or network calls are involved.
const source = fs.readFileSync('lib/supabase/proxy.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

for (const refresh of [false, true]) {
  let validationCalls = 0
  const sandboxModule = { exports: {} }
  vm.runInNewContext(compiled, {
    exports: sandboxModule.exports,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'synthetic-public-key' } },
    require(name) {
      if (name === 'next/server') return { NextResponse }
      assert.equal(name, '@supabase/ssr')
      return {
        createServerClient(_url, _key, options) {
          assert.equal(options.cookieEncoding, 'base64url')
          assert.equal(options.cookies.getAll().find(c => c.name === 'synthetic-sdk-cookie')?.value, 'before-refresh')
          return { auth: { async getUser() {
            validationCalls++
            if (refresh) options.cookies.setAll([
              { name: 'synthetic-sdk-cookie', value: 'after-refresh', options: { path: '/', sameSite: 'lax', maxAge: 300 } },
              { name: 'synthetic-retired-chunk', value: '', options: { path: '/', maxAge: 0 } },
            ], { 'Cache-Control': 'private, no-store', Pragma: 'no-cache' })
            return { data: { user: { id: 'synthetic-user' } }, error: null }
          } } }
        },
      }
    },
  })
  const request = new NextRequest('https://song-xanh.vercel.app/profile', {
    headers: { cookie: 'synthetic-sdk-cookie=before-refresh; ordinary-preference=kept' },
  })
  const response = await sandboxModule.exports.updateSession(request)
  assert.equal(validationCalls, 1)
  assert.equal(request.cookies.get('ordinary-preference')?.value, 'kept')
  if (refresh) {
    assert.equal(request.cookies.get('synthetic-sdk-cookie')?.value, 'after-refresh')
    assert.equal(response.cookies.get('synthetic-sdk-cookie')?.value, 'after-refresh')
    assert.equal(response.cookies.get('synthetic-sdk-cookie')?.sameSite, 'lax')
    assert.equal(response.cookies.get('synthetic-retired-chunk')?.maxAge, 0)
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
    assert.equal(response.headers.get('Pragma'), 'no-cache')
    assert.match(response.headers.get('x-middleware-request-cookie'), /synthetic-sdk-cookie=after-refresh/)
  } else {
    assert.equal(request.cookies.get('synthetic-sdk-cookie')?.value, 'before-refresh')
    assert.equal(response.cookies.getAll().length, 0)
  }
}
console.log('PASS: proxy validation, refreshed request/response cookies, retired chunks and SDK cache headers (simulated SDK; no real expiry claim)')
