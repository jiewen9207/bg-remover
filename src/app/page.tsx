'use client';

import { useState, useRef, useCallback } from 'react';

type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error';
type Tab = 'original' | 'result';

export default function HomePage() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [activeTab, setActiveTab] = useState<Tab>('original');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultBlobRef = useRef<Blob | null>(null);
  const originalFileRef = useRef<File | null>(null);

  const resetState = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalUrl('');
    setResultUrl('');
    setStatus('idle');
    setErrorMsg('');
    setActiveTab('original');
    resultBlobRef.current = null;
    originalFileRef.current = null;
  }, [originalUrl, resultUrl]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (JPG, PNG, WebP)');
      setStatus('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large (max 10MB)');
      setStatus('error');
      return;
    }
    resetState();
    originalFileRef.current = file;
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setStatus('uploading');
    processImage(file);
  }, [resetState]);

  const processImage = async (file: File) => {
    setStatus('processing');
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/removebg', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      resultBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus('done');
      setActiveTab('result');
    } catch (e: any) {
      setErrorMsg(e.message || 'Processing failed');
      setStatus('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDownload = () => {
    if (!resultBlobRef.current || !originalFileRef.current) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resultBlobRef.current);
    a.download = originalFileRef.current.name.replace(/\.[^.]+$/, '-nobg.png');
    a.click();
  };

  const statusText = {
    idle: '',
    uploading: '⏳ Uploading...',
    processing: '🪄 AI is removing background... (may take up to 30s)',
    done: '✅ Done! Your image is ready.',
    error: '',
  }[status];

  const showPreview = status !== 'idle' && originalUrl;

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-8">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">🪄 BG Remover</h1>
        <p className="text-muted mt-2">Remove image backgrounds in seconds — no signup required</p>
      </div>

      {/* Upload Area */}
      {!showPreview && (
        <div
          className={`w-full border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors select-none ${isDragOver ? 'border-primary bg-indigo-50' : 'border-border hover:border-primary hover:bg-slate-50'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-5xl mb-4">📤</div>
          <div className="text-lg font-medium mb-2">Drop your image here or click to upload</div>
          <div className="text-sm text-muted">JPG, PNG, WebP — max 10MB</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* Preview Area */}
      {showPreview && (
        <div className="w-full flex flex-col gap-4">

          {/* Tab Switcher */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setActiveTab('original')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'original' ? 'bg-primary text-white' : 'bg-white text-muted border border-border'}`}
            >
              Original
            </button>
            <button
              onClick={() => setActiveTab('result')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'result' ? 'bg-primary text-white' : 'bg-white text-muted border border-border'}`}
            >
              Result
            </button>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">

            {activeTab === 'original' ? (
              <div className="p-4 text-center">
                <div className="text-xs text-muted mb-2 uppercase tracking-wide font-medium">Original</div>
                <img src={originalUrl} alt="Original" className="max-w-full max-h-80 mx-auto rounded-xl" />
              </div>
            ) : (
              <div className="p-4 text-center">
                <div className="text-xs text-muted mb-2 uppercase tracking-wide font-medium">Result</div>
                <div
                  className="inline-block rounded-xl overflow-hidden"
                  style={{ background: bgColor }}
                >
                  <img src={resultUrl} alt="Result" className="max-w-full max-h-80 mx-auto" />
                </div>
              </div>
            )}
          </div>

          {/* BG Color Picker (only show when result is ready) */}
          {status === 'done' && (
            <div className="flex items-center gap-3 justify-center">
              <span className="text-sm text-muted">Background:</span>
              <div className="flex gap-2">
                {['#ffffff', '#000000', '#ef4444', '#22c55e', '#3b82f6', '#a855f7'].map(c => (
                  <button
                    key={c}
                    onClick={() => setBgColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${bgColor === c ? 'border-primary scale-110' : 'border-transparent'}`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <p className={`text-center text-sm ${status === 'error' ? 'text-error' : status === 'done' ? 'text-success' : 'text-muted'}`}>
            {statusText}
            {status === 'error' && <span className="block mt-1">{errorMsg}</span>}
          </p>

          {/* Action Buttons */}
          {status === 'done' && (
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-base transition-colors"
              >
                ⬇️ Download
              </button>
              <button
                onClick={resetState}
                className="px-5 py-3 bg-white border border-border hover:bg-slate-50 text-muted rounded-xl font-medium text-base transition-colors"
              >
                New Image
              </button>
            </div>
          )}

          {status === 'error' && (
            <button
              onClick={resetState}
              className="w-full py-3 bg-white border border-border hover:bg-slate-50 text-muted rounded-xl font-medium text-base transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-muted mt-4">Powered by remove.bg · Built on Cloudflare</p>
    </div>
  );
}