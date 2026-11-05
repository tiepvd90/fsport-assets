import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = 'D:\\WEBSITE\\Code\\26\\fsport-frontend'
const BACKEND = 'D:\\WEBSITE\\Code\\26\\fsport-backend'
const AUDIT = 'D:\\WEBSITE\\Feed audit'
const SHORTLIST = path.join(AUDIT, 'F-SPORT-Feed-AI-Content-Keep-Shortlist.md')
const SUPABASE_URL = 'https://xcigbbcpwfzluqazadez.supabase.co'
const concurrency = Math.max(1, Math.min(20, Number(process.env.FEED_AUDIT_CONCURRENCY || 12)))

function envValue(text, name) {
  const match = text.match(new RegExp(`^${name}=(.*)$`, 'm'))
  return match ? match[1].trim() : ''
}

function firstImage(images) {
  let list = images
  if (typeof list === 'string') {
    try { list = JSON.parse(list) } catch { list = [] }
  }
  if (!Array.isArray(list) || !list.length) return ''
  const first = list[0]
  return typeof first === 'string' ? first : String(first?.url || '')
}

function probe(url) {
  return new Promise((resolve) => {
    const child = spawn('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,codec_name',
      '-of', 'json', url,
    ], { windowsHide: true })
    let output = ''
    let error = ''
    const timer = setTimeout(() => child.kill(), 20000)
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { error += chunk })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) return resolve({ error: error.trim() || `ffprobe exit ${code}` })
      try {
        const stream = JSON.parse(output).streams?.[0]
        if (!stream?.width || !stream?.height) return resolve({ error: 'No image dimensions' })
        resolve({ width: stream.width, height: stream.height, codec: stream.codec_name })
      } catch (parseError) {
        resolve({ error: parseError.message })
      }
    })
  })
}

async function mapLimit(items, limit, worker) {
  const result = new Array(items.length)
  let cursor = 0
  async function run() {
    while (cursor < items.length) {
      const index = cursor++
      result[index] = await worker(items[index], index)
      if ((index + 1) % 50 === 0) console.log(`PROBED ${index + 1}/${items.length}`)
    }
  }
  await Promise.all(Array.from({ length: limit }, run))
  return result
}

const env = await readFile(path.join(BACKEND, '.env'), 'utf8')
const anon = envValue(env, 'VITE_SUPABASE_ANON_KEY')
if (!anon) throw new Error('Missing VITE_SUPABASE_ANON_KEY')
const response = await fetch(`${SUPABASE_URL}/rest/v1/feed_posts?status=eq.published&select=id,slug,title,category,images,video_id,published_at&order=published_at.desc&limit=2000`, {
  headers: { apikey: anon, Authorization: `Bearer ${anon}` },
})
if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`)
const posts = await response.json()
const shortlistText = await readFile(SHORTLIST, 'utf8')
const shortlist = new Set([...shortlistText.matchAll(/https:\/\/www\.fun-sport\.co\/feed\/([^\)\s]+)/g)].map(match => match[1]))

const withImages = posts.map(post => ({ ...post, image_url: firstImage(post.images) })).filter(post => post.image_url)
const audited = await mapLimit(withImages, concurrency, async post => {
  const dimensions = await probe(post.image_url)
  const ratio = dimensions.width && dimensions.height ? dimensions.width / dimensions.height : null
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: post.category,
    video_id: post.video_id,
    published_at: post.published_at,
    shortlist: shortlist.has(post.slug),
    image_url: post.image_url,
    ...dimensions,
    ratio: ratio == null ? null : Number(ratio.toFixed(4)),
    square: ratio != null && ratio >= 0.9 && ratio <= 1.1,
    landscape_16_9: ratio != null && ratio >= 1.7 && ratio <= 1.85,
  }
})

const square = audited.filter(row => row.square)
const report = {
  created_at: new Date().toISOString(),
  published_posts: posts.length,
  posts_with_images: withImages.length,
  probe_errors: audited.filter(row => row.error).length,
  square_total: square.length,
  square_shortlist: square.filter(row => row.shortlist).length,
  square_outside_shortlist: square.filter(row => !row.shortlist).length,
  landscape_16_9_total: audited.filter(row => row.landscape_16_9).length,
  square,
  all: audited,
}
const output = path.join(AUDIT, 'FSPORT-feed-cover-dimension-audit.json')
await writeFile(output, JSON.stringify(report, null, 2))
console.log(JSON.stringify({
  output,
  published_posts: report.published_posts,
  posts_with_images: report.posts_with_images,
  probe_errors: report.probe_errors,
  square_total: report.square_total,
  square_shortlist: report.square_shortlist,
  square_outside_shortlist: report.square_outside_shortlist,
  landscape_16_9_total: report.landscape_16_9_total,
}, null, 2))
