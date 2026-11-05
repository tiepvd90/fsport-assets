import fs from 'node:fs/promises'
import path from 'node:path'

const BACKEND = 'D:\\WEBSITE\\Code\\26\\fsport-backend'
const AUDIT = 'D:\\WEBSITE\\Feed audit'
const SHORTLIST = path.join(AUDIT, 'F-SPORT-Feed-AI-Content-Keep-Shortlist.md')
const SUPABASE_URL = 'https://xcigbbcpwfzluqazadez.supabase.co'
const applyChanges = process.argv.includes('--apply')

function envValue(text, name) {
  const match = text.match(new RegExp(`^${name}=(.*)$`, 'm'))
  return match ? match[1].trim() : ''
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body).slice(0, 400)}`)
  return body
}

const [envText, shortlistText] = await Promise.all([
  fs.readFile(path.join(BACKEND, '.env'), 'utf8'),
  fs.readFile(SHORTLIST, 'utf8'),
])
const anonKey = envValue(envText, 'VITE_SUPABASE_ANON_KEY')
const token = process.env.FSPORT_ADMIN_ACCESS_TOKEN || ''
if (!anonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY')
if (applyChanges && !token) throw new Error('Missing FSPORT_ADMIN_ACCESS_TOKEN')
const authHeaders = { apikey: anonKey, Authorization: `Bearer ${applyChanges ? token : anonKey}` }
const shortlist = new Set([...shortlistText.matchAll(/https:\/\/www\.fun-sport\.co\/feed\/([^\)\s]+)/g)].map(match => match[1]))

const rows = await requestJson(`${SUPABASE_URL}/rest/v1/feed_posts?status=eq.published&select=id,slug,title,status,source_type,generated_by,feed_origin,ai_generated,images,published_at,feed_order_at&limit=2000`, { headers: authHeaders })
const targets = rows.filter(row => !shortlist.has(row.slug) && (
  row.generated_by === 'local_feed_writer_gemini' ||
  row.source_type === 'ai_generated' ||
  (row.ai_generated === true && row.feed_origin === 'manual_batch')
))
if (targets.length !== 801) throw new Error(`Safety check failed: expected 801 generated-AI posts outside shortlist, found ${targets.length}`)

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupPath = path.join(AUDIT, `FSPORT-feed-ai-archive-backup-${stamp}.json`)
await fs.writeFile(backupPath, JSON.stringify({ created_at: new Date().toISOString(), posts: targets }, null, 2))
if (!applyChanges) {
  console.log(JSON.stringify({ mode: 'dry-run', targets: targets.length, backupPath }, null, 2))
  process.exit(0)
}

let completed = 0
const batchSize = 40
for (let start = 0; start < targets.length; start += batchSize) {
  const batch = targets.slice(start, start + batchSize)
  const ids = batch.map(row => row.id).join(',')
  const updated = await requestJson(`${SUPABASE_URL}/rest/v1/feed_posts?id=in.(${ids})`, {
    method: 'PATCH',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ status: 'archived', updated_at: new Date().toISOString() }),
  })
  if (!Array.isArray(updated) || updated.length !== batch.length) {
    throw new Error(`Archive verification failed for batch ${start / batchSize + 1}: expected ${batch.length}, got ${updated?.length}`)
  }
  completed += updated.length
  console.log(`ARCHIVE ${completed}/${targets.length}`)
}

const remaining = await requestJson(`${SUPABASE_URL}/rest/v1/feed_posts?status=eq.published&select=id,slug,source_type,generated_by,feed_origin,ai_generated&limit=2000`, { headers: authHeaders })
const remainingTargets = remaining.filter(row => !shortlist.has(row.slug) && (
  row.generated_by === 'local_feed_writer_gemini' ||
  row.source_type === 'ai_generated' ||
  (row.ai_generated === true && row.feed_origin === 'manual_batch')
))
if (remainingTargets.length !== 0) throw new Error(`Read-back found ${remainingTargets.length} generated-AI posts still published`)
console.log(JSON.stringify({ mode: 'apply', archived: completed, verified_remaining: 0, backupPath }, null, 2))
