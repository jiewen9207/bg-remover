import { NextRequest, NextResponse } from 'next/server';

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || '';
const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!REMOVE_BG_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
  }

  const fileInstance = file as File;
  if (fileInstance.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

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
      return NextResponse.json({ error: `remove.bg API error: ${rbResponse.status}` }, { status: 502 });
    }

    const buffer = await rbResponse.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    console.error('Processing error:', e);
    return NextResponse.json({ error: 'Processing failed: ' + e.message }, { status: 500 });
  }
}