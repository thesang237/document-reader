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
- **Tailwind CSS** with custom academia theme
- **pdfjs-dist** + react-pdf for document parsing
- **Canvas API** for waveform visualization
- **vite-plugin-pwa** for full PWA capabilities
- **Lucide React** icons

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deployment to GitHub Pages

The project is configured for **automatic deployment**:

```bash
npm run deploy
```

This builds the app and pushes the `dist` folder to the `gh-pages` branch.

### One-time GitHub Setup:
1. Go to repository **Settings** → **Pages**
2. Under "Build and deployment", select **Deploy from a branch**
3. Choose **gh-pages** branch → **/(root)** → **Save**

Your app will be live at: https://thesang237.github.io/google-read-text/

Run `npm run deploy` anytime to update the live site.

## API Key Setup

1. Get a Google Cloud Text-to-Speech API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"MANAGE API KEY"** in the app
3. Paste your key (saved securely in browser's localStorage)
4. The input becomes a **"Change API Key"** button after first use

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
