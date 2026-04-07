# AI Document Reader

A beautiful single-file web app that converts text and documents (TXT, PDF) to high-quality speech using Google Cloud Text-to-Speech.

## Features
- Paste text or upload PDF/TXT files
- Support for English (multiple ultra-realistic voices) and Vietnamese
- Custom playback controls (speed, seek, ±15s)
- Clean Markdown stripping
- Fully client-side (no backend)

## How to Use
1. Get a **Google Cloud Text-to-Speech API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Cloud Text-to-Speech API
   - Create an API key
2. Paste the API key in the app
3. Paste text or upload a document
4. Click "Generate Audio & Listen"

## Deployment

This project is ready for **GitHub Pages**.

### Deploy to GitHub Pages (2 minutes)

1. Go to [github.com/new](https://github.com/new)
   - Repository name: `ai-document-reader` (or any name you like)
   - **Public** (required for free GitHub Pages)
   - Do **not** initialize with README

2. Run these commands:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ai-document-reader.git
git push -u origin main
```

3. Go to your new repo → **Settings** → **Pages** (left sidebar)
   - Under "Build and deployment", choose **Deploy from a branch**
   - Select **main** branch → **/(root)** → **Save**

Your live app will be at: `https://YOUR_GITHUB_USERNAME.github.io/ai-document-reader`

(Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username)

## License
Free to use and modify.
