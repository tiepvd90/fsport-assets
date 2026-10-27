const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

test('website analytics writes by user_id without Profile RPCs', () => {
  const analytics = read('js/analytics.js')

  assert.match(analytics, /\/rest\/v1\/analytics_users/)
  assert.match(analytics, /\/rest\/v1\/analytics_events/)
  assert.doesNotMatch(analytics, /profile_id|fsport_profile|track_profile_event|resolve_website_profile|identify_profile_customer/)
})

test('AI chat keeps its content link through user_id', () => {
  const chat = read('js/ai-chat.js')

  assert.match(chat, /user_id:\s*uid/)
  assert.doesNotMatch(chat, /profile_id|getProfileId/)
})
