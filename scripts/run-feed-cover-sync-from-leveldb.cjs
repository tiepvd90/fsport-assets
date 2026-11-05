const { spawn } = require('node:child_process')
const path = require('node:path')
const { ClassicLevel } = require('classic-level')

async function readSession(levelDbPath) {
  const db = new ClassicLevel(levelDbPath, { keyEncoding: 'buffer', valueEncoding: 'buffer' })
  let session = null
  for await (const [keyBuffer, valueBuffer] of db.iterator()) {
    const key = keyBuffer.toString('utf8')
    if (!key.includes('_https://app.fun-sport.co') || !key.includes('fsport_erp_session')) continue
    const value = valueBuffer.toString('utf8')
    session = JSON.parse(value.slice(value.indexOf('{')))
    break
  }
  await db.close()
  if (!session?.access_token) throw new Error('Production ERP session was not found')
  return session
}

async function main() {
  const levelDbPath = process.argv[2]
  if (!levelDbPath) throw new Error('LevelDB copy path is required')
  const session = await readSession(levelDbPath)
  const scriptName = process.argv[3] || 'sync-feed-shortlist-covers.mjs'
  const script = path.join(__dirname, scriptName)
  const child = spawn(process.execPath, [script, '--apply'], {
    cwd: path.dirname(__dirname),
    env: { ...process.env, FSPORT_ADMIN_ACCESS_TOKEN: session.access_token },
    stdio: 'inherit',
    windowsHide: true,
  })
  child.on('exit', code => { process.exitCode = code || 0 })
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
