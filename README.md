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

### One-time setup:
```bash
# After creating a new repository on GitHub (e.g. ai-document-reader)
git remote add origin https://github.com/YOUR_USERNAME/ai-document-reader.git
git branch -M main
git push -u origin main
```

Then go to **Repository Settings → Pages → Source: Deploy from a branch → main → / (root)** and save.

Your app will be live at: `https://YOUR_USERNAME.github.io/ai-document-reader/`

## License
Free to use and modify.
