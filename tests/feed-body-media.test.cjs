const test = require('node:test')
const assert = require('node:assert/strict')

test('Feed detail converts editor Markdown images to responsive HTML', async () => {
  const { transformBodyMarkdownMedia } = await import('../functions/feed/[slug].js')
  const url = 'https://pub-example.r2.dev/feed/2026/10/Harry-Kane_-Road-to-2026.webp'
  const html = transformBodyMarkdownMedia('<div class="body"><p>Before</p><p>![](' + url + ')</p><p>After</p></div>')
  assert.match(html, /<figure class="fn-article-body-media">/)
  assert.match(html, new RegExp('<img src="' + url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"'))
  assert.doesNotMatch(html, /!\[\]\(/)
})

test('Feed detail preserves unsafe or malformed image Markdown as text', async () => {
  const { transformBodyMarkdownMedia } = await import('../functions/feed/[slug].js')
  assert.equal(transformBodyMarkdownMedia('<p>![](javascript:alert(1))</p>'), '<p>![](javascript:alert(1))</p>')
})
