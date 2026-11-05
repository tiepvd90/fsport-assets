import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = 'D:\\WEBSITE\\Code\\26\\fsport-frontend'
const BACKEND = 'D:\\WEBSITE\\Code\\26\\fsport-backend'
const AUDIT = 'D:\\WEBSITE\\Feed audit'
const SHORTLIST = path.join(AUDIT, 'F-SPORT-Feed-AI-Content-Keep-Shortlist.md')
const MANUAL_REPORT = path.join(AUDIT, 'FSPORT-manual-square-covers-to-regenerate.json')
const COVER_DIRS = [
  path.join(ROOT, 'assets', 'feed', 'covers', 'shortlist-2026-10'),
  path.join(ROOT, 'assets', 'feed', 'covers', 'manual-2026-10'),
]
const STATE_PATH = path.join(ROOT, 'assets', 'feed', 'covers', 'sync-state.json')
const SUPABASE_URL = 'https://xcigbbcpwfzluqazadez.supabase.co'
const UPLOAD_URL = `${SUPABASE_URL}/functions/v1/r2-upload`
const applyChanges = process.argv.includes('--apply')

function envValue(text, name) {
  const match = text.match(new RegExp(`^${name}=(.*)$`, 'm'))
  return match ? match[1].trim() : ''
}

async function getAdminAccessToken() {
  const ports = [9227, 9223, 9225, 9226, 9337]
  const diagnostics = []
  for (const port of ports) {
    let pages
    try {
      pages = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json())
    } catch {
      continue
    }
    const candidatePages = pages.filter((item) => item.type === 'page' && (
      /^https:\/\/app\.fun-sport\.co\//.test(item.url) ||
      /^http:\/\/127\.0\.0\.1:5173\//.test(item.url)
    ))
    for (const page of candidatePages) {
    if (!page?.webSocketDebuggerUrl) continue
    const socket = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true })
      socket.addEventListener('error', reject, { once: true })
    })
    const id = 1
    const response = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP auth lookup timed out')), 10000)
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data)
        if (message.id !== id) return
        clearTimeout(timer)
        resolve(message)
      })
      socket.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: {
          expression: `(async () => {
            const client = window._erpSupabase || window.supabase
            if (client && client.auth) {
              let { data } = await client.auth.getSession()
              if (!data?.session) {
                const refreshed = await client.auth.refreshSession().catch(() => ({ data: null }))
                data = refreshed && refreshed.data
              }
              if (data && data.session) return { access_token: data.session.access_token, expires_at: data.session.expires_at }
            }
            const findSession = (value, depth = 0) => {
              if (!value || depth > 8) return null
              if (typeof value === 'object' && typeof value.access_token === 'string') {
                return { access_token: value.access_token, expires_at: value.expires_at }
              }
              if (Array.isArray(value)) {
                for (const item of value) {
                  const found = findSession(item, depth + 1)
                  if (found) return found
                }
                return null
              }
              if (typeof value === 'object') {
                for (const item of Object.values(value)) {
                  const found = findSession(item, depth + 1)
                  if (found) return found
                }
              }
              return null
            }
            for (let index = 0; index < window.localStorage.length; index += 1) {
              const key = window.localStorage.key(index)
              const raw = window.localStorage.getItem(key)
              if (!raw) continue
              try {
                const found = findSession(JSON.parse(raw))
                if (found) return found
              } catch {}
            }
            return null
          })()`,
          awaitPromise: true,
          returnByValue: true,
        },
      }))
    })
    socket.close()
    const session = response?.result?.result?.value
    if (session?.access_token) return session.access_token
    diagnostics.push({
      port,
      url: page.url,
      resultType: response?.result?.result?.type || null,
      resultSubtype: response?.result?.result?.subtype || null,
      exception: response?.result?.exceptionDetails?.text || response?.error?.message || null,
    })
    }
  }
  throw new Error(`No authenticated admin session was found in Chrome: ${JSON.stringify(diagnostics)}`)
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body).slice(0, 300)}`)
  }
  return body
}

function nextImages(previous, publicUrl) {
  if (!Array.isArray(previous) || previous.length === 0) {
    return [{ url: publicUrl, caption: '', order: 0 }]
  }
  const [first, ...rest] = previous
  if (typeof first === 'string') return [publicUrl, ...rest]
  return [{ ...(first || {}), url: publicUrl }, ...rest]
}

const markdown = await fs.readFile(SHORTLIST, 'utf8')
const slugs = [...markdown.matchAll(/https:\/\/www\.fun-sport\.co\/feed\/([^\)\s]+)/g)].map((match) => match[1])
const manualReport = JSON.parse(await fs.readFile(MANUAL_REPORT, 'utf8'))
const manualSlugs = manualReport.rows.map((row) => row.slug)
const uniqueSlugs = [...new Set([...slugs, ...manualSlugs])]
if (slugs.length !== 48) throw new Error(`Expected 48 shortlist slugs, found ${slugs.length}`)
if (manualSlugs.length !== 26) throw new Error(`Expected 26 manual square-cover slugs, found ${manualSlugs.length}`)
if (uniqueSlugs.length !== 68) throw new Error(`Expected 68 retained posts, found ${uniqueSlugs.length}`)

async function findCover(slug) {
  for (const directory of COVER_DIRS) {
    const candidate = path.join(directory, `${slug}-cover-1600x900.webp`)
    try {
      const stat = await fs.stat(candidate)
      return { coverPath: candidate, coverBytes: stat.size }
    } catch {}
  }
  throw new Error(`Missing cover for ${slug}`)
}

const envText = await fs.readFile(path.join(BACKEND, '.env'), 'utf8')
const anonKey = envValue(envText, 'VITE_SUPABASE_ANON_KEY')
if (!anonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY')
const token = applyChanges ? (process.env.FSPORT_ADMIN_ACCESS_TOKEN || await getAdminAccessToken()) : anonKey
const authHeaders = { apikey: anonKey, Authorization: `Bearer ${token}` }

const posts = []
for (const slug of uniqueSlugs) {
  const rows = await requestJson(`${SUPABASE_URL}/rest/v1/feed_posts?select=id,slug,title,images&slug=eq.${encodeURIComponent(slug)}`, {
    headers: authHeaders,
  })
  if (rows.length !== 1) throw new Error(`Expected one post for ${slug}, found ${rows.length}`)
  const { coverPath, coverBytes } = await findCover(slug)
  posts.push({ ...rows[0], cover_path: coverPath, cover_bytes: coverBytes })
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupPath = path.join(AUDIT, `FSPORT-feed-cover-backup-${stamp}.json`)
await fs.writeFile(backupPath, JSON.stringify({ created_at: new Date().toISOString(), posts: posts.map(({ cover_path, cover_bytes, ...post }) => post) }, null, 2))

const shapeSummary = posts.reduce((summary, post) => {
  const first = Array.isArray(post.images) ? post.images[0] : null
  const key = Array.isArray(post.images) ? (typeof first === 'string' ? 'array:string' : 'array:object') : String(post.images)
  summary[key] = (summary[key] || 0) + 1
  return summary
}, {})

if (!applyChanges) {
  console.log(JSON.stringify({ mode: 'dry-run', posts: posts.length, shapeSummary, backupPath }, null, 2))
  process.exit(0)
}

let state = { version: 1, uploaded: {}, updated: [] }
try {
  state = JSON.parse(await fs.readFile(STATE_PATH, 'utf8'))
} catch {}

for (let index = 0; index < posts.length; index += 1) {
  const post = posts[index]
  const cached = state.uploaded?.[post.slug]
  if (cached?.publicUrl) {
    const check = await fetch(cached.publicUrl, { method: 'HEAD' }).catch(() => null)
    if (check?.ok) {
      console.log(`UPLOAD ${index + 1}/${posts.length} reuse ${post.slug}`)
      continue
    }
  }
  const bytes = await fs.readFile(post.cover_path)
  const filename = path.basename(post.cover_path)
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'image/webp' }), filename)
  form.append('filename', filename)
  const uploaded = await requestJson(UPLOAD_URL, { method: 'POST', headers: authHeaders, body: form })
  if (!uploaded.success || !uploaded.publicUrl) throw new Error(`Upload failed for ${post.slug}`)
  const check = await fetch(uploaded.publicUrl, { method: 'HEAD' })
  if (!check.ok) throw new Error(`Public image check failed for ${post.slug}: ${check.status}`)
  state.uploaded[post.slug] = { publicUrl: uploaded.publicUrl, objectKey: uploaded.objectKey, bytes: post.cover_bytes }
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2))
  console.log(`UPLOAD ${index + 1}/${posts.length} ok ${post.slug}`)
}

const updated = []
try {
  for (let index = 0; index < posts.length; index += 1) {
    const post = posts[index]
    const publicUrl = state.uploaded[post.slug]?.publicUrl
    if (!publicUrl) throw new Error(`Missing uploaded URL for ${post.slug}`)
    const images = nextImages(post.images, publicUrl)
    const rows = await requestJson(`${SUPABASE_URL}/rest/v1/feed_posts?id=eq.${encodeURIComponent(post.id)}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ images, updated_at: new Date().toISOString() }),
    })
    if (!Array.isArray(rows) || rows.length !== 1) throw new Error(`Update verification failed for ${post.slug}`)
    updated.push(post)
    state.updated = updated.map((item) => item.slug)
    await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2))
    console.log(`UPDATE ${index + 1}/${posts.length} ok ${post.slug}`)
  }
} catch (error) {
  for (const post of updated.reverse()) {
    await requestJson(`${SUPABASE_URL}/rest/v1/feed_posts?id=eq.${encodeURIComponent(post.id)}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ images: post.images, updated_at: new Date().toISOString() }),
    }).catch(() => null)
  }
  throw error
}

let verified = 0
for (const post of posts) {
  const rows = await requestJson(`${SUPABASE_URL}/rest/v1/feed_posts?select=slug,images&slug=eq.${encodeURIComponent(post.slug)}`, { headers: authHeaders })
  const first = rows[0]?.images?.[0]
  const url = typeof first === 'string' ? first : first?.url
  if (url !== state.uploaded[post.slug].publicUrl) throw new Error(`Read-back mismatch for ${post.slug}`)
  verified += 1
}

console.log(JSON.stringify({ mode: 'apply', uploaded: Object.keys(state.uploaded).length, updated: updated.length, verified, backupPath, statePath: STATE_PATH }, null, 2))
