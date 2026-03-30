# BG Remover

> Remove image backgrounds with one click. No signup required.

## 🔧 Tech Stack

- **Frontend**: HTML + Vanilla JS (Cloudflare Pages)
- **Backend**: Cloudflare Workers
- **AI**: remove.bg API

## 🚀 Getting Started

### 1. Configure API Key

Get your API key from [remove.bg](https://www.remove.bg/api) and set it in `wrangler.toml`:

```toml
[vars]
REMOVE_BG_API_KEY = "your-api-key-here"
```

### 2. Deploy

```bash
npm install
npx wrangler deploy
```

### 3. Frontend

Deploy the `public/` folder to Cloudflare Pages or any static host.

## 📁 Project Structure

```
├── public/
│   └── index.html      # Frontend UI
├── src/
│   └── removebg.js     # Cloudflare Worker
├── SPEC.md             # Project specification
├── README.md
└── wrangler.toml       # Cloudflare Workers config
```

## 🆓 Free Tier

- Cloudflare Workers: 100,000 requests/day free
- Cloudflare Pages: Unlimited bandwidth
- remove.bg: 50 free requests/month

## 📝 License

MIT