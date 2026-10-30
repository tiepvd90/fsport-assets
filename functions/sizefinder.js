const TARGET_URL = 'https://fun-sport.co/feed/chon-size-dep-chay-bo-ysandal-ung-chuan-huong-dan-chi-tiet-cho-nguoi-moi-va-chuyen-nghiep-20260724';
const CAMPAIGN = {
  utm_source: 'facebook',
  utm_medium: 'social',
  utm_campaign: 'sizefinder_facebook_groups',
  utm_content: 'group_post'
};

export async function onRequest(context) {
  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { allow: 'GET, HEAD' }
    });
  }

  const target = new URL(TARGET_URL);
  Object.entries(CAMPAIGN).forEach(([key, value]) => target.searchParams.set(key, value));

  return new Response(null, {
    status: 302,
    headers: {
      location: target.toString(),
      'cache-control': 'no-store, max-age=0',
      'x-robots-tag': 'noindex, nofollow'
    }
  });
}
