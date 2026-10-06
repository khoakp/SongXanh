# Báo cáo kiểm thử website

Ngày kiểm tra: 2026-10-06

## Phạm vi và inventory

Website có các nhóm page chính: trang chủ, giới thiệu, liên hệ, riêng tư, thử thách, thử thách hôm nay, trò chơi, gương sáng, chiến dịch, cam kết, xếp hạng, carbon, profile, quản trị và các page auth (login, signup, forgot password, update password, callback).

API đã rà soát: profile, commitments, challenges join/complete, articles read, games true-false/waste-sort/student-day, leaderboard, quản trị và sign-out. Database/RPC được gọi từ code gồm các flow xác thực, profile, carbon, leaderboard, challenge, article, game, badge, metrics và audit log.

## Test matrix

| Feature | Expected behavior | Test method | Status |
|---|---|---|---|
| Public pages | Render HTTP 200 | `pnpm test:smoke` | PASS |
| Auth pages | Login/signup/forgot/update render | Smoke HTTP | PASS |
| Dynamic article/campaign pages | Render với slug/id hợp lệ | HTTP với seed slugs/campaign id | PASS |
| Unauthenticated profile | Từ chối API bằng 401 | Smoke HTTP | PASS |
| Unauthenticated commitments/challenges/articles | Từ chối bằng 401 | Smoke HTTP | PASS |
| Unauthenticated games | Từ chối submit bằng 401; GET dữ liệu public | Smoke HTTP | PASS |
| Admin API authorization | User chưa đăng nhập nhận 403 | Smoke HTTP | PASS |
| Invalid true/false payload | Nhận 400 | Smoke HTTP | PASS |
| Sign out endpoint | POST trả 200 | Smoke HTTP | PASS |
| Auth callback without code | Redirect về login với lỗi callback | HTTP smoke | PASS |
| Student-day scenarios | GET trả scenarios và steps | Smoke HTTP | PASS |
| Leaderboard public API | GET trả 200 và JSON | Smoke HTTP | PASS |
| Public API contracts | Waste-sort items, student-day scenarios/steps, leaderboard people có đúng shape | `pnpm test:smoke` | PASS |
| User-facing filters | Bộ lọc thử thách, cam kết, bài viết và kỳ/phạm vi xếp hạng cập nhật được | Playwright E2E | PASS |
| Profile update happy path | Lưu được dữ liệu khi authenticated | User session thật, update + restore | PASS |
| Carbon save/history | Lưu RPC và đọc lại bản ghi lịch sử | Authenticated harness + Playwright production E2E | PASS |
| User/admin/editor navigation | User bị từ chối admin page/API; editor/admin vào đúng dashboard theo role | Authenticated harness | PASS user/editor/admin login + dashboard |
| Register/login/logout happy path | Xác thực thật với Supabase | Authenticated harness | PASS user/editor/admin |
| Password recovery | Recovery request đi qua callback, action link tạo session, update mật khẩu thành công, callback không open-redirect, form validation | Playwright + Supabase Admin-generated recovery action link; email inbox delivery không được quan sát riêng | PASS |
| Admin create/update/audit | Ghi DB và audit log | Authenticated harness | PASS |
| Admin delete API | Chỉ admin được xóa bảng trong allowlist, ghi audit log | Authenticated harness với dữ liệu `E2E_TEST_` | PASS |
| RLS/database migrations | Chạy đủ 6 SQL trên PostgreSQL sạch 2 lần, idempotent | PostgreSQL 18 local cluster tạm, `psql -v ON_ERROR_STOP=1`, không dùng production DB | PASS |
| Live Supabase schema check | Các bảng/RPC mới phải tồn tại | Read-only REST ngày 2026-10-06: `public.badges` và `get_impact_metrics` trả 200, metrics đủ trường | PASS |
| Browser console/network | Không có lỗi runtime app | Playwright production E2E: console errors 0, unexpected request failures 0 | PASS |
| Lint | ESLint chạy hết source không có error | `pnpm lint` | PASS (21 warnings hiện hữu) |

## Lỗi phát hiện và đã sửa

1. `GET /api/games/student-day` trả 500 vì truy vấn phụ thuộc vào `created_at` chỉ để sắp xếp. Đã bỏ phụ thuộc cột này; endpoint hiện trả 200 với scenarios/steps.
2. Smoke test trước đó không tồn tại. Đã thêm `scripts/smoke-test.mjs` và script `pnpm test:smoke`.
3. Authenticated harness initially reported a false logout failure because Next dev rendered the login target with HTTP 200; it now verifies the protected login target content and passes.
4. Authenticated harness now uses the app's Asia/Ho_Chi_Minh date and snapshots/restores user counters and daily game score during E2E data cleanup.
5. Added the admin DELETE route with an explicit table allowlist, clear error handling, audit logging, and an admin-only delete button in the dashboard; the authenticated regression test creates, updates, verifies audit, deletes, and verifies delete audit.
6. Fixed the SQL audit RPC role check so editor content changes can be audited, fixed the ambiguous admin_list_users reference, and added the missing admin/editor RLS policies for content and game scenario management. The matching runtime policies/function were verified in the configured Supabase project.
7. Expanded the authenticated regression suite to verify the commitments_public view and at least four seeded active emission-factor categories.
8. Added the missing admin API allowlist entries for game scenarios, fixed the deployed admin_list_users email return type, and reran the full authenticated CRUD/audit flow successfully.
9. Added Playwright fixtures/tests for user session persistence, carbon save/history, logout/protected route, and editor/admin role UI. Gated Vercel Analytics to Vercel deployments so local production E2E has no analytics 404s.
10. Fixed password recovery to redirect through `/auth/callback?next=/auth/update-password` for the PKCE flow; added regression coverage for the recovery request target, password validation, and callback open-redirect rejection.
11. Added ESLint 9, the Next flat config, and `pnpm lint`; lint now completes with warnings only. The warnings are existing navigation/style and React hook recommendations, not runtime errors.
12. Added implicit recovery-hash session handling in `update-password`; the real Supabase recovery action link now reaches the form, updates the test password, and the test restores the original password in `finally`.
13. Removed the obsolete browser-only block from the HTTP harness; browser interaction is now covered by the Playwright suite and the authenticated harness reports 0 blocked checks.
14. Fixed `/api/leaderboard` response normalization: the deployed RPC could return only `people`, while the page also đọc `groups`, `me`, and `hasMore`; the API now supplies safe defaults and normalizes person fields so the page and filters do not crash.

## Kết quả command

- `pnpm.cmd test:smoke`: 40 PASS, 0 FAIL.
- `pnpm.cmd test:authenticated`: 56 PASS, 0 FAIL, 0 BLOCKED.
- `pnpm.cmd test:e2e`: PASS 6/6 on the built production server; recovery redirect/action-link/password update, callback safety, user carbon save/history, session refresh, logout/protected route, editor/admin role UI, user-facing filters, console errors, and unexpected request failures were verified.
- `pnpm.cmd typecheck`: PASS.
- `pnpm.cmd build`: PASS.
- `pnpm.cmd lint`: PASS — 0 errors, 21 existing warnings.
- SQL idempotency: PASS. On a temporary PostgreSQL 18 cluster, these six files each ran twice with `ON_ERROR_STOP=1`: `schema.sql`, `functions.sql`, `rls.sql`, `2026-10-05-privacy-and-deletion.sql`, `auth-sync.sql`, `seed.sql`. Seed counts remained stable on round two; `get_impact_metrics`, `complete_task_secure`, and `write_admin_audit_log` were present afterward.
- `git diff --check`: PASS.

## Ghi chú môi trường

- Browser connector riêng không khả dụng, nhưng Playwright Chromium đã được cài trong môi trường test và production E2E đã chạy PASS.
- Test credentials có trong `.env.test.local`; cả ba account đều hiện diện, đã xác thực email và role được kiểm tra thực tế là user/editor/admin.
- Docker daemon không khả dụng, nhưng PostgreSQL 18 đã cài trên máy nên đã dùng cluster tạm cô lập trong workspace để hoàn tất kiểm thử SQL; cluster đã được dừng và xóa sau kiểm thử.
- Re-check Supabase ngày 2026-10-06: `public.badges` và RPC `get_impact_metrics` đã tồn tại, metrics trả đủ các trường yêu cầu.
- Dev log cũ có hydration mismatch do thuộc tính `bis_skin_checked` và lỗi `chrome-extension://...`; đây là inject từ extension/browser môi trường. Production Playwright chạy profile sạch và ghi nhận 0 console errors.
- Email delivery vào inbox không được quan sát riêng; recovery action link do Supabase cấp và `updateUser({ password })` đã được kiểm thử thực tế với tài khoản test, sau đó khôi phục mật khẩu ban đầu.

## Exact read-only Supabase evidence

- Static audit also found login links from `/thu-thach`, `/carbon`, and `/` that dropped the current `next` destination; these links now preserve the internal destination.
- Earlier `GET /rest/v1/badges?...` returned `PGRST205`, and earlier `POST /rest/v1/rpc/get_impact_metrics` returned `PGRST202` before the database migration was applied.
- Re-check on 2026-10-06: both endpoints returned 200; the metrics payload contains `participants`, `tasks`, `co2`, and `cups`.
- REST checks were read-only; one reviewed CREATE OR REPLACE FUNCTION for admin_list_users was applied to the matching Supabase project and verified without modifying application rows.

## Authenticated test update (2026-10-06)

- `.env.test.local` exists, contains all six required variable names, and is ignored by Git. Values were loaded into the test process only and were never printed or written to source/report files.
- Added `pnpm test:authenticated` using real Supabase password sessions and server cookies. It does not depend on Playwright.
- Guest authorization checks: PASS. Public RPC contracts (`get_today_challenges`, `get_daily_game_questions`, `get_leaderboard`): PASS. Live `badges` schema: PASS. Live `get_impact_metrics` schema and fields (`participants`, `tasks`, `co2`, `cups`): PASS.
- User account: PASS. Role `user`, login, protected profile, session refresh, profile update + restore, carbon save/persistence/history UI, badges read, challenge join/complete, commitment, article read, waste-sort, student-day, true/false, leaderboard, metrics, logout, and user-to-admin denial all passed.
- Editor account: PASS login, role, dashboard, permitted content update with audit, denial of admin-only update/RPC, and logout.
- Admin account: PASS login, role, dashboard, user listing, metrics, create, update, audit log, and logout. The deployed admin_list_users function was verified after the email text cast migration.
- The harness created only temporary `E2E_TEST_` data where writes succeeded, restored profile/counter snapshots, and cleaned test rows. No auth account was created or modified by the test harness.
- Admin DELETE: PASS. Route chỉ cho admin, kiểm tra allowlist bảng, xóa theo `id`, ghi audit log và được kiểm thử bằng dữ liệu tạm `E2E_TEST_`; test đã xác nhận bản ghi bị xóa và audit delete tồn tại.
- Playwright E2E: PASS 6/6. Screenshots, video, and traces were disabled; no credential values were written to artifacts.

## Reproduce

```powershell
pnpm.cmd dev
pnpm.cmd test:smoke
pnpm.cmd test:authenticated
pnpm.cmd test:e2e
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd build
```
