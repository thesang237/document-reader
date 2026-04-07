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

This project is ready for **GitHub Pages** (single-file HTML + Tailwind).

### Enable GitHub Pages

1. Go to your repository: https://github.com/thesang237/document-reader
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Build and deployment":
   - Choose **Deploy from a branch**
   - Select **main** branch
   - Select **/(root)** folder
   - Click **Save**

Your app will be live at: **https://thesang237.github.io/document-reader**

> **Note**: It may take 1-2 minutes for the site to become available after enabling Pages.

## License
Free to use and modify.
