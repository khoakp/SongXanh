export const productionAuthOrigin = 'https://song-xanh.vercel.app'

export function authNext(requested: string | null | undefined): string {
  if (typeof requested !== 'string' || !requested || !requested.startsWith('/') || requested.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(requested)) return '/profile'
  try {
    const decoded = decodeURIComponent(requested)
    if (decoded.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(decoded)) return '/profile'
    const target = new URL(requested, productionAuthOrigin)
    if (target.origin !== productionAuthOrigin || target.pathname === '/' || ['/auth/login', '/auth/callback', '/auth/sign-out'].includes(target.pathname)) return '/profile'
    return target.pathname + target.search + target.hash
  } catch { return '/profile' }
}
export function authDestination(requested: string | null | undefined, role: string): string {
  const next = authNext(requested)
  const path = new URL(next, productionAuthOrigin).pathname
  return (path === '/quan-tri' || path.startsWith('/quan-tri/')) && !['admin', 'editor'].includes(role) ? '/profile' : next
}
export function authOrigin(currentOrigin: string): string {
  const current = new URL(currentOrigin)
  return ['localhost', '127.0.0.1', '[::1]'].includes(current.hostname) ? current.origin : productionAuthOrigin
}
export function authCallbackUrl(currentOrigin: string, requested: string | null | undefined): string {
  const callback = new URL('/auth/callback', authOrigin(currentOrigin))
  callback.searchParams.set('next', authNext(requested))
  return callback.toString()
}
