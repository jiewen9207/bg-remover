/**
 * BG Remover - Cloudflare Worker
 * Proxy for remove.bg API
 */

const REMOVE_BG_API_KEY = REMOVE_BG_API_KEY;
const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

export default {
  async fetch(request, env, ctx) {
    // Only accept POST with multipart/form-data
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (e) {
      return json({ error: 'Invalid form data' }, 400);
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return json({ error: 'Missing file field' }, 400);
    }

    // Size check (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return json({ error: 'File too large (max 10MB)' }, 400);
    }

    // Build form data for remove.bg
    const rbFormData = new FormData();
    rbFormData.append('image_file', file);
    rbFormData.append('size', 'auto');
    rbFormData.append('format', 'png');

    try {
      const rbResponse = await fetch(REMOVE_BG_API_URL, {
        method: 'POST',
        headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
        body: rbFormData,
      });

      if (!rbResponse.ok) {
        const errText = await rbResponse.text().catch(() => '');
        console.error('remove.bg error:', rbResponse.status, errText);
        return json({ error: `remove.bg API error: ${rbResponse.status}` }, 500);
      }

      const resultBuffer = await rbResponse.arrayBuffer();

      return new Response(resultBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store',
          'Content-Length': resultBuffer.byteLength,
        },
      });
    } catch (e) {
      console.error('Worker error:', e);
      return json({ error: 'Processing failed: ' + e.message }, 500);
    }
  },
};

function json(body, status = 400) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}