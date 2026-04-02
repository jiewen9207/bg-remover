/**
 * BG Remover - Cloudflare Worker with Static Assets
 */

const REMOVE_BG_API_KEY = REMOVE_BG_API_KEY;
const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

// Static HTML
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BG Remover - Remove Image Backgrounds</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #6366f1; }
    .subtitle { color: #64748b; margin-bottom: 40px; font-size: 16px; }
    .upload-area {
      width: 100%;
      max-width: 500px;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }
    .upload-area:hover { border-color: #6366f1; background: #fafafa; }
    .upload-area.dragover { border-color: #6366f1; background: #eef2ff; }
    .upload-icon { font-size: 48px; margin-bottom: 16px; }
    .upload-text { color: #64748b; font-size: 16px; }
    .upload-hint { color: #94a3b8; font-size: 14px; margin-top: 8px; }
    input[type="file"] { display: none; }
    .result-area {
      width: 100%;
      max-width: 500px;
      margin-top: 30px;
      display: none;
    }
    .result-area.show { display: block; }
    .tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .tab {
      flex: 1;
      padding: 12px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      text-align: center;
    }
    .tab.active { background: #6366f1; color: white; border-color: #6366f1; }
    .preview {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      min-height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .preview img { max-width: 100%; max-height: 400px; }
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
    .btn {
      flex: 1;
      padding: 14px 24px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary { background: #6366f1; color: white; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
    .btn-secondary:hover { background: #cbd5e1; }
    .bg-colors {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .color-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid #e2e8f0;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .color-btn:hover { transform: scale(1.1); }
    .color-btn.active { border-color: #6366f1; }
    .loading {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.9);
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      z-index: 100;
    }
    .loading.show { display: flex; }
    .spinner {
      width: 48px; height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { margin-top: 16px; color: #64748b; }
  </style>
</head>
<body>
  <h1>BG Remover</h1>
  <p class="subtitle">Remove image backgrounds with AI</p>
  <div class="upload-area" id="uploadArea">
    <div class="upload-icon">🖼️</div>
    <p class="upload-text">Click or drag image here</p>
    <p class="upload-hint">PNG, JPG up to 10MB</p>
    <input type="file" id="fileInput" accept="image/*">
  </div>
  <div class="result-area" id="resultArea">
    <div class="tabs">
      <div class="tab active" data-tab="original">Original</div>
      <div class="tab" data-tab="result">Result</div>
    </div>
    <div class="preview">
      <img id="previewImg" src="" alt="Preview">
    </div>
    <div class="bg-colors" id="bgColors">
      <button class="color-btn active" style="background:transparent" data-color="transparent" title="Transparent"></button>
      <button class="color-btn" style="background:#ffffff" data-color="#ffffff" title="White"></button>
      <button class="color-btn" style="background:#000000" data-color="#000000" title="Black"></button>
      <button class="color-btn" style="background:#ff0000" data-color="#ff0000" title="Red"></button>
      <button class="color-btn" style="background:#00ff00" data-color="#00ff00" title="Green"></button>
      <button class="color-btn" style="background:#0000ff" data-color="#0000ff" title="Blue"></button>
      <button class="color-btn" style="background:#ffff00" data-color="#ffff00" title="Yellow"></button>
      <button class="color-btn" style="background:#ff00ff" data-color="#ff00ff" title="Pink"></button>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" id="resetBtn">Reset</button>
      <button class="btn btn-primary" id="downloadBtn">Download</button>
    </div>
  </div>
  <div class="loading" id="loading">
    <div class="spinner"></div>
    <p class="loading-text">Processing image...</p>
  </div>
  <script>
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const resultArea = document.getElementById('resultArea');
    const previewImg = document.getElementById('previewImg');
    const loading = document.getElementById('loading');
    const bgColors = document.getElementById('bgColors');
    let originalFile = null;
    let resultBlob = null;
    let selectedColor = 'transparent';
    uploadArea.onclick = () => fileInput.click();
    fileInput.onchange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };
    uploadArea.ondragover = (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); };
    uploadArea.ondragleave = () => uploadArea.classList.remove('dragover');
    uploadArea.ondrop = (e) => { e.preventDefault(); uploadArea.classList.remove('dragover'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
    async function handleFile(file) {
      originalFile = file;
      previewImg.src = URL.createObjectURL(file);
      resultArea.classList.add('show');
      uploadArea.style.display = 'none';
      processImage(file);
    }
    async function processImage(file) {
      loading.classList.add('show');
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/removebg', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Failed');
        resultBlob = await res.blob();
        previewImg.src = URL.createObjectURL(resultBlob);
      } catch (e) {
        alert('Error: ' + e.message);
      } finally {
        loading.classList.remove('show');
      }
    }
    document.querySelectorAll('.tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        previewImg.src = tab.dataset.tab === 'original' 
          ? URL.createObjectURL(originalFile) 
          : URL.createObjectURL(resultBlob);
      };
    });
    bgColors.onclick = (e) => {
      if (e.target.classList.contains('color-btn')) {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedColor = e.target.dataset.color;
      }
    };
    document.getElementById('downloadBtn').onclick = () => {
      if (!resultBlob) return;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (selectedColor !== 'transparent') {
          ctx.fillStyle = selectedColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        const a = document.createElement('a');
        a.download = 'removed-bg.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      img.src = URL.createObjectURL(resultBlob);
    };
    document.getElementById('resetBtn').onclick = () => {
      originalFile = null;
      resultBlob = null;
      fileInput.value = '';
      resultArea.classList.remove('show');
      uploadArea.style.display = 'block';
    };
  </script>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API endpoint
    if (url.pathname === '/api/removebg') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let formData;
      try {
        formData = await request.formData();
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid form data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const file = formData.get('file');
      if (!file || typeof file === 'string') {
        return new Response(JSON.stringify({ error: 'Missing file field' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Size check (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'File too large (max 10MB)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
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
          return new Response(JSON.stringify({ error: `remove.bg API error: ${rbResponse.status}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
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
        return new Response(JSON.stringify({ error: 'Processing failed: ' + e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Serve static HTML
    return new Response(INDEX_HTML, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
};