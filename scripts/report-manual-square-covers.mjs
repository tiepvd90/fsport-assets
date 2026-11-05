import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BACKEND = 'D:\\WEBSITE\\Code\\26\\fsport-backend'
const AUDIT_DIR = 'D:\\WEBSITE\\Feed audit'
const SUPABASE_URL = 'https://xcigbbcpwfzluqazadez.supabase.co'

function envValue(text, name) {
  const match = text.match(new RegExp(`^${name}=(.*)$`, 'm'))
  return match ? match[1].trim() : ''
}

const [env, auditText] = await Promise.all([
  readFile(path.join(BACKEND, '.env'), 'utf8'),
  readFile(path.join(AUDIT_DIR, 'FSPORT-feed-cover-dimension-audit.json'), 'utf8'),
])
const anon = envValue(env, 'VITE_SUPABASE_ANON_KEY')
if (!anon) throw new Error('Missing VITE_SUPABASE_ANON_KEY')

const audit = JSON.parse(auditText)
const response = await fetch(`${SUPABASE_URL}/rest/v1/feed_posts?status=eq.published&select=id,slug,title,category,content_type,video_id,published_at,source_type,generated_by,feed_origin,ai_generated&order=published_at.desc&limit=2000`, {
  headers: { apikey: anon, Authorization: `Bearer ${anon}` },
})
if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`)
const posts = await response.json()
const byId = new Map(posts.map(post => [post.id, post]))

const rows = audit.square
  .map(image => ({ ...image, ...byId.get(image.id) }))
  .filter(row => row.source_type === 'manual' || row.feed_origin === 'backend' || !row.generated_by)
  .sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)))

const jsonPath = path.join(AUDIT_DIR, 'FSPORT-manual-square-covers-to-regenerate.json')
const mdPath = path.join(AUDIT_DIR, 'FSPORT-manual-square-covers-to-regenerate.md')
const md = [
  '# F-SPORT Feed — ảnh vuông của bài đăng thủ công cần tạo lại',
  '',
  `Tổng số: **${rows.length} bài**. Chuẩn mới: **1600×900 WebP**, không chèn chữ, mục tiêu khoảng 300 KB.`,
  '',
  '| # | Môn | Dạng | Tiêu đề | Slug | Ảnh hiện tại |',
  '|---:|---|---|---|---|---|',
  ...rows.map((row, index) => `| ${index + 1} | ${row.category || ''} | ${row.video_id ? 'Video' : (row.content_type || 'Bài')} | ${String(row.title || '').replaceAll('|', '\\|')} | \`${row.slug}\` | ${row.width}×${row.height} |`),
  '',
].join('\n')

await Promise.all([
  writeFile(jsonPath, JSON.stringify({ created_at: new Date().toISOString(), count: rows.length, rows }, null, 2)),
  writeFile(mdPath, md),
])
console.log(JSON.stringify({ count: rows.length, jsonPath, mdPath, rows: rows.map(({ slug, title, category, video_id }) => ({ slug, title, category, video: Boolean(video_id) })) }, null, 2))
