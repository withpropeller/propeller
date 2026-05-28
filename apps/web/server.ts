/**
 * Production server for the Vite-built SPA. Serves static assets from `dist/`,
 * proxies `POST /api/auth/login` so the backend's auth token lands in an
 * HttpOnly cookie, and answers liveness/readiness probes. Anything else under
 * a non-asset path falls back to `index.html` for client-side routing.
 */
import { serve } from 'bun'
import { join, normalize, resolve } from 'node:path'
import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const DIST_DIR = resolve(import.meta.dir, 'dist')
const PORT = Number(process.env.PORT ?? 3000)
const API_BASE_URL =
  process.env.VITE_API_BASE_URL ?? 'https://gateway.hyphenmoney.com'
const ACCESS_TOKEN_COOKIE = 'alw_access_token'
const IS_PROD = process.env.NODE_ENV === 'production'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

function contentTypeFor(path: string): string {
  const dot = path.lastIndexOf('.')
  if (dot < 0) return 'application/octet-stream'
  return MIME[path.slice(dot).toLowerCase()] ?? 'application/octet-stream'
}

function serializeCookie(name: string, value: string, maxAgeSeconds: number): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ]
  if (IS_PROD) parts.push('Secure')
  return parts.join('; ')
}

async function handleLogin(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const upstream = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await upstream.json().catch(() => ({}))
  if (!upstream.ok) {
    return Response.json(data, { status: upstream.status })
  }

  const token =
    (data as { data?: { token?: string }; token?: string }).data?.token ??
    (data as { token?: string }).token
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (token) {
    headers.append('Set-Cookie', serializeCookie(ACCESS_TOKEN_COOKIE, token, 60 * 60 * 24 * 7))
  }
  return new Response(JSON.stringify(data), { status: 200, headers })
}

async function serveStatic(pathname: string): Promise<Response | null> {
  const safe = normalize(pathname).replace(/^\/+/, '')
  if (safe.includes('..')) return new Response('Forbidden', { status: 403 })
  const candidate = join(DIST_DIR, safe)
  if (!candidate.startsWith(DIST_DIR)) return new Response('Forbidden', { status: 403 })
  if (!existsSync(candidate)) return null
  const st = statSync(candidate)
  if (st.isDirectory()) return null
  const file = await readFile(candidate)
  const ct = contentTypeFor(candidate)
  const cacheControl =
    safe.startsWith('assets/') || /\.[a-f0-9]{8,}\./.test(safe)
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate'
  return new Response(file, { headers: { 'Content-Type': ct, 'Cache-Control': cacheControl } })
}

async function spaFallback(): Promise<Response> {
  const indexPath = join(DIST_DIR, 'index.html')
  if (!existsSync(indexPath)) {
    return new Response('index.html not found — did you run `bun run build`?', { status: 500 })
  }
  const html = await readFile(indexPath)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}

const server = serve({
  port: PORT,
  hostname: '0.0.0.0',
  async fetch(req) {
    const url = new URL(req.url)
    const { pathname } = url

    if (pathname === '/api/auth/login') return handleLogin(req)
    if (pathname === '/health' || pathname === '/health/live' || pathname === '/health/ready') {
      return Response.json({ status: 'ok' })
    }

    const asset = await serveStatic(pathname)
    if (asset) return asset

    if (req.method === 'GET' || req.method === 'HEAD') return spaFallback()
    return new Response('Not Found', { status: 404 })
  },
})

console.log(`web: listening on http://${server.hostname}:${server.port}`)
