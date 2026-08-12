export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return env.ASSETS.fetch(request);
  }

  // Existing HTML files in html/auth are legacy pages and must remain untouched.
  const staticResponse = await env.ASSETS.fetch(request);
  if (staticResponse.status !== 404) return staticResponse;

  const templateUrl = new URL(request.url);
  // Use the clean asset path internally so Cloudflare does not return its
  // automatic .html -> extensionless redirect to the public NFC URL.
  templateUrl.pathname = '/html/auth/nfc';
  templateUrl.search = '';
  const templateResponse = await env.ASSETS.fetch(new Request(templateUrl, request));

  if (request.method !== 'HEAD') return templateResponse;
  return new Response(null, {
    status: templateResponse.status,
    headers: templateResponse.headers
  });
}
