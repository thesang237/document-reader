# Echo Archive — AI Document Reader (React PWA)

A sophisticated, production-grade **Progressive Web App** that transforms documents into spoken audio with beautiful dark-academia aesthetics. Built with React, TypeScript, Vite, Tailwind, and `vite-plugin-pwa`.

## ✨ Features

- **Living Manuscript Reader**: Upload PDF/TXT or paste text — sentences highlight live as narrated
- **Spectral Voice Library**: 4 carefully crafted narrator personas (Professor Alden, Lady Elowen, etc.)
- **Real-time Waveform**: Canvas oscilloscope that reacts to playback
- **Accurate Stats**: Live word count + estimated duration (dynamic with speed setting)
- **Google Cloud TTS** + fallback to browser SpeechSynthesis
- **PWA Ready**: Installable, works offline, beautiful manifest
- **API Key Management**: Secure localStorage with elegant "Change API Key" flow
- **Premium Dark Academia Design**: Parchment panels, gold accents, ornate borders, scholarly typography

## Tech Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS** with custom dark academia theme
- **pdfjs-dist** + react-pdf for document parsing
- **Canvas API** for real-time waveform visualization
- **vite-plugin-pwa** for full PWA capabilities (installable app)
- **Lucide React** icons
- **GitHub Actions** for automatic deployment to GitHub Pages

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deployment to GitHub Pages

The project uses **GitHub Actions** for automatic deployment on every push to `main`.

### One-time GitHub Setup:
1. Go to repository **Settings** → **Pages**
2. Under "Build and deployment", select **GitHub Actions**
3. (No further configuration needed)

Your app will be live at: **https://thesang237.github.io/google-read-text/**

The workflow (`.github/workflows/deploy.yml`) automatically builds and deploys the `dist` folder whenever you push to `main`.

You can also trigger deployment manually from the **Actions** tab.

## API Key Setup

1. Get a Google Cloud Text-to-Speech API key from [Google Cloud Console](https://console.cloud.google.com/)
2. **Important**: Create the key with **strict restrictions**:
   - Set "Application restrictions" to HTTP referrers
   - Add your GitHub Pages domain (`*.github.io`)
   - Only enable the **Text-to-Speech API**
3. Click **"MANAGE API KEY"** in the app
4. Paste your key (stored in browser localStorage — see Security section)
5. The input becomes a **"Change API Key"** button after first use

## Security Considerations

**⚠️ API Key Exposure (Primary Risk)**
- The Google TTS API key is stored in `localStorage` and sent client-side in every request URL.
- It is visible in browser DevTools (Network tab, Application Storage).
- **Mitigation**: Always use referrer-restricted keys. Never use a key with broad permissions or billing enabled without monitoring.
- For production use, consider a backend proxy (e.g. Cloudflare Worker) to hide your key.

**Build Dependencies**
- High severity vulnerability in `serialize-javascript` (transitive via `vite-plugin-pwa`).
- Affects build process only (RCE risk if build inputs are malicious). Can be mitigated with npm overrides.
- Run `npm audit` to monitor.

**PDF Processing**
- Now uses secure local `pdfjs-dist` v5 worker (previously used outdated CDN version — fixed in this update).

**General**
- This is a client-side PWA. All processing happens in-browser.
- No server-side secrets are committed to the repo.
- Review `src/App.tsx` (monolithic component) for changes.

## Project Structure

```
src/
├── App.tsx              # Main EchoArchive component (640+ LOC of polished UI)
├── main.tsx
├── index.css            # Academia theme + custom scrollbar/waveform styles
├── vite-env.d.ts
public/
├── pwa icons...
```

## Design Philosophy

Every detail follows Emil Kowalski's design engineering principles:
- Responsive button press feedback (`active:scale-95`)
- Purposeful animations only
- Custom easing curves
- Unseen polish that compounds into something that *feels* right

Made with love for beautiful software.

---

*Originally a single-file HTML project. Now a modern React PWA with vastly improved architecture, state management, and user experience.*
