import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from '@playwright/test'

function loadEnvFile(fileName: string, override = false) {
  const filePath = path.join(process.cwd(), fileName)
  if (!fs.existsSync(filePath)) return
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const value = match[2].trim().replace(/^['"]|['"]$/g, '')
    if (override || !process.env[match[1]]) process.env[match[1]] = value
  }
}

loadEnvFile('.env')
loadEnvFile('.env.test.local', true)

const required = [
  'TEST_USER_EMAIL', 'TEST_USER_PASSWORD',
  'TEST_EDITOR_EMAIL', 'TEST_EDITOR_PASSWORD',
  'TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD',
]
const missing = required.filter((key) => !process.env[key])
if (missing.length) throw new Error('Missing test environment variables: ' + missing.join(', '))

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
})
