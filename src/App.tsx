import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Play, Pause, Square, Settings, Key, Mic, Clock, BookOpen, Volume2, Edit3 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Types
interface Sentence {
  id: number;
  text: string;
  wordCount: number;
}

interface AudioChunk {
  id: number;
  text: string;
  preview: string;
  audioUrl: string;
  duration?: number;
}

interface Voice {
  id: string;
  name: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
  gender: 'male' | 'female';
}

const EchoArchive: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('googleTtsApiKey') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [documentText, setDocumentText] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [selectedVoiceId, setSelectedVoiceId] = useState('en-US-Wavenet-D');
  const [isProcessing, setIsProcessing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [estTime, setEstTime] = useState('');
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [audioChunks, setAudioChunks] = useState<AudioChunk[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nowPlayingChunkId, setNowPlayingChunkId] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voices: Voice[] = [
    { 
      id: 'en-US-Wavenet-D', 
      name: 'Professor Alden', 
      description: 'Deep, scholarly narration', 
      accent: 'American', 
      icon: <BookOpen className="w-5 h-5" />,
      gender: 'male' 
    },
    { 
      id: 'en-GB-Neural2-A', 
      name: 'Lady Elowen', 
      description: 'Elegant British tone', 
      accent: 'British', 
      icon: <Volume2 className="w-5 h-5" />,
      gender: 'female' 
    },
    { 
      id: 'en-US-Studio-M', 
      name: 'The Archivist', 
      description: 'Precise & measured', 
      accent: 'American', 
      icon: <Edit3 className="w-5 h-5" />,
      gender: 'male' 
    },
    { 
      id: 'en-AU-Neural2-B', 
      name: 'Ms. Hawthorne', 
      description: 'Warm storyteller', 
      accent: 'Australian', 
      icon: <Mic className="w-5 h-5" />,
      gender: 'female' 
    },
  ];

  // Split text into sentences
  const splitIntoSentences = (text: string): Sentence[] => {
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const matches = text.match(sentenceRegex) || [text];
    return matches.map((sentence, index) => ({
      id: index,
      text: sentence.trim(),
      wordCount: sentence.trim().split(/\s+/).length,
    }));
  };

  // Intelligent chunking for Google TTS (max ~5000 chars per request)
  const chunkTextForTTS = (text: string, maxChars: number = 4500): string[] => {
    const sentences = splitIntoSentences(text).map(s => s.text);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChars && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  };

  // Calculate stats
  const calculateStats = useCallback((sents: Sentence[]) => {
    const totalWords = sents.reduce((sum, s) => sum + s.wordCount, 0);
    setWordCount(totalWords);
    
    // Estimate time: base 160 wpm, adjusted by speed
    const wpm = 160 * speed;
    const minutes = totalWords / wpm;
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    setEstTime(`${mins}m ${secs}s`);
  }, [speed]);

  // Process uploaded file
  const processFile = async (file: File) => {
    setIsProcessing(true);
    setDocumentTitle(file.name.replace(/\.(pdf|txt)$/, ''));
    
    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Use pdfjs to extract text
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => (item.str || ''))
            .join(' ');
          fullText += pageText + '\n\n';
        }
        
        setDocumentText(fullText);
        const sents = splitIntoSentences(fullText);
        setSentences(sents);
        calculateStats(sents);
      } else {
        // Text file
        const text = await file.text();
        setDocumentText(text);
        const sents = splitIntoSentences(text);
        setSentences(sents);
        calculateStats(sents);
      }
    } catch (error) {
      console.error('Processing error:', error);
      alert('Error processing document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate all audio chunks sequentially using Google TTS
  const generateFullAudio = async () => {
    if (!documentText.trim() || !apiKey) {
      alert('Please provide both text and a valid Google TTS API key.');
      return;
    }

    setIsGenerating(true);
    setAudioChunks([]);

    try {
      const chunks = chunkTextForTTS(documentText);
      const generatedChunks: AudioChunk[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const preview = chunkText.length > 60 
          ? chunkText.substring(0, 57) + '...' 
          : chunkText;

        const response = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: chunkText },
              voice: { 
                languageCode: selectedVoiceId.startsWith('en-GB') ? 'en-GB' : 'en-US',
                name: selectedVoiceId 
              },
              audioConfig: { 
                audioEncoding: 'MP3',
                speakingRate: speed 
              },
            }),
          }
        );

        if (!response.ok) throw new Error(`Failed to generate chunk ${i + 1}`);

        const data = await response.json();
        const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;

        generatedChunks.push({
          id: i,
          text: chunkText,
          preview,
          audioUrl,
        });

        // Update UI progressively
        setAudioChunks([...generatedChunks]);
      }

      // Switch main panel to playlist mode
      setAudioChunks(generatedChunks);
      
    } catch (error: any) {
      console.error('Generation error:', error);
      
      let userMessage = 'Error generating audio chunks.\n\n';
      
      if (!apiKey) {
        userMessage += 'No API key provided. Please add one in Settings.';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        userMessage += 'Network error. Check your internet connection.';
      } else if (error.message?.includes('billing') || error.message?.toLowerCase().includes('billing')) {
        userMessage += 'Billing must be enabled on your Google Cloud project for Text-to-Speech.';
      } else if (error.message?.includes('API key') || error.message?.includes('key')) {
        userMessage += 'Your API key is invalid, expired, or missing Text-to-Speech permissions.';
      } else if (error.status === 403 || error.message?.includes('403')) {
        userMessage += 'Permission denied. Make sure the Text-to-Speech API is enabled and billing is active.';
      } else {
        userMessage += error.message || 'Unknown error. Please check browser console (F12) for details.';
      }
      
      alert(userMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Play full playlist sequentially
  const togglePlayback = async () => {
    if (audioChunks.length === 0) return;

    if (isPlaying) {
      if (currentAudio) currentAudio.pause();
      setIsPlaying(false);
      setNowPlayingChunkId(null);
      return;
    }

    setIsPlaying(true);
    
    for (let i = 0; i < audioChunks.length; i++) {
      if (!isPlaying) break;
      
      const chunk = audioChunks[i];
      setNowPlayingChunkId(chunk.id);
      
      const audio = new Audio(chunk.audioUrl);
      audio.playbackRate = speed;
      
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.play().catch(() => resolve());
        setCurrentAudio(audio);
      });
    }
    
    setIsPlaying(false);
    setNowPlayingChunkId(null);
    setCurrentAudio(null);
  };

  // Canvas Waveform Animation
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 120;

    let phase = 0;
    const bars = 48;
    const barWidth = (canvas.width / bars) * 0.6;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const isActive = isPlaying;
      
      for (let i = 0; i < bars; i++) {
        const x = (i * canvas.width) / bars;
        // Dynamic height based on play state and sine wave for organic feel
        let height = isActive 
          ? 35 + Math.sin(phase + i * 0.3) * 22 + (Math.random() * 18)
          : 18 + Math.sin(phase + i * 0.2) * 8;
        
        // Gold to burgundy gradient
        const gradient = ctx.createLinearGradient(x, canvas.height / 2 - height / 2, x, canvas.height / 2 + height / 2);
        gradient.addColorStop(0, isActive ? '#d4af37' : '#8c6f47');
        gradient.addColorStop(1, '#4a2c2a');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = isActive ? '#d4af37' : '#3a2720';
        ctx.shadowBlur = isActive ? 12 : 4;
        
        ctx.fillRect(x, canvas.height / 2 - height / 2, barWidth, height);
      }
      
      phase += isActive ? 0.18 : 0.04;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [isPlaying]);

  useEffect(() => {
    drawWaveform();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawWaveform]);

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Save API key
  const saveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem('googleTtsApiKey', trimmed);
    setShowSettings(false);
  };

  const selectedVoice = voices.find(v => v.id === selectedVoiceId) || voices[0];

  // Play a specific audio chunk
  const playChunk = (chunk: AudioChunk) => {
    if (nowPlayingChunkId === chunk.id) {
      // Pause
      if (currentAudio) currentAudio.pause();
      setNowPlayingChunkId(null);
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(chunk.audioUrl);
    audio.playbackRate = speed;
    
    audio.onended = () => {
      setNowPlayingChunkId(null);
      setIsPlaying(false);
      setCurrentAudio(null);
    };

    audio.play().then(() => {
      setNowPlayingChunkId(chunk.id);
      setIsPlaying(true);
      setCurrentAudio(audio);
    }).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-[#120b06] text-[#d4c3a3] font-serif overflow-hidden relative">
      {/* Ornate Header */}
      <header className="academia-container border-b border-[#5c4634] py-4 px-8 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8c6f47] flex items-center justify-center shadow-inner">
            <BookOpen className="w-4 h-4 text-[#1a0f08]" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter gold-text">ECHO ARCHIVE</h1>
            <p className="text-xs tracking-[3px] text-[#8c6f47] -mt-1">V O X   E X   L I T T E R I S</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          {apiKey && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#1a0f08] rounded-full border border-[#d4af37]/30 text-[#d4af37] text-xs">
              <Key className="w-3.5 h-3.5" /> KEY CONFIGURED
            </div>
          )}
          
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-5 py-2 hover:bg-[#3a2720] rounded-xl transition-colors border border-transparent hover:border-[#5c4634]"
          >
            <Settings className="w-4 h-4" />
            <span>SETTINGS</span>
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar: Document Input */}
        <div className="w-96 border-r border-[#5c4634] bg-[#1a0f08]/80 flex flex-col academia-container m-3 mr-0 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-[#5c4634]">
            <div className="uppercase tracking-widest text-xs mb-2 text-[#8c6f47]">CURRENT ARCHIVE</div>
            <h2 className="text-2xl gold-text font-bold leading-none">{documentTitle || 'Untitled Manuscript'}</h2>
            {wordCount > 0 && (
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{estTime}</span>
                </div>
                <div>{wordCount.toLocaleString()} words</div>
              </div>
            )}
          </div>

          {/* Text Input + Upload Area */}
          <div className="flex-1 flex flex-col p-6 gap-4">
            {/* Paste Text Field */}
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="uppercase tracking-widest text-xs text-[#8c6f47]">MANUSCRIPT TEXT</div>
                <button
                  onClick={generateFullAudio}
                  disabled={isGenerating || !documentText.trim() || !apiKey}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#b38b4d] disabled:from-[#3a2720] disabled:to-[#2c2118] text-[#1a0f08] disabled:text-[#6b5542] font-medium rounded-2xl text-sm transition-all active:scale-[0.97]"
                >
                  {isGenerating ? 'GENERATING CHAPTERS...' : 'GENERATE AUDIO CHAPTERS'}
                </button>
              </div>
              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste or type your manuscript here. Click 'GENERATE AUDIO CHAPTERS' to create separate MP3 files (respects Google TTS limits)."
                className="flex-1 bg-[#120b06] border border-[#5c4634] focus:border-[#d4af37] rounded-2xl p-5 text-sm resize-none outline-none font-serif leading-relaxed placeholder:text-[#6b5542]"
              />
            </div>

            {/* File Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#5c4634] hover:border-[#d4af37] transition-all rounded-2xl p-6 cursor-pointer group flex flex-col items-center justify-center h-32"
            >
              <Upload className="w-9 h-9 text-[#8c6f47] group-hover:text-[#d4af37] mb-3 transition-colors" />
              <p className="text-[#d4af37] text-sm font-medium">Drop PDF or TXT file</p>
              <p className="text-[#8c6f47] text-xs text-center mt-1">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Text Viewer with Highlights */}
          {documentText && (
            <div className="flex-1 p-6 overflow-auto text-sm leading-relaxed custom-scroll">
              {sentences.map((sentence, idx) => (
                <span
                  key={sentence.id}
                  className={`block mb-3 cursor-pointer transition-all duration-200 p-2 rounded-xl hover:bg-[#3a2720]/50 ${
                    idx === currentSentenceIndex 
                      ? 'bg-[#4a2c2a] text-[#d4af37] shadow-inner scale-[1.02] ornate-border' 
                      : ''
                  }`}
                  onClick={() => {
                    setCurrentSentenceIndex(idx);
                    if (isPlaying) togglePlayback();
                  }}
                >
                  {sentence.text}
                </span>
              ))}
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="gold-text">Extracting text from manuscript...</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Reader Area - Text or Playlist */}
        <div className="flex-1 flex flex-col p-8 relative">
          <div className="academia-container flex-1 rounded-3xl p-10 flex flex-col ornate-border overflow-hidden">
            {audioChunks.length > 0 ? (
              /* Playlist View */
              <div className="flex-1 flex flex-col">
                <div className="uppercase tracking-widest text-xs mb-6 text-[#8c6f47] flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  AUDIO CHAPTERS • {audioChunks.length} PARTS
                </div>
                
                <div className="flex-1 overflow-auto space-y-3 pr-4 custom-scroll">
                  {audioChunks.map((chunk, index) => (
                    <div
                      key={chunk.id}
                      onClick={() => playChunk(chunk)}
                      className={`group flex items-center gap-5 p-5 rounded-2xl border cursor-pointer transition-all hover:bg-[#2c2118] ${
                        nowPlayingChunkId === chunk.id 
                          ? 'border-[#d4af37] bg-[#2c2118]' 
                          : 'border-[#3a2720] hover:border-[#6b5542]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3a2720] to-[#1a0f08] flex items-center justify-center text-[#d4af37] flex-shrink-0">
                        {nowPlayingChunkId === chunk.id ? '♪' : `${index + 1}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#d4c3a3] line-clamp-2 group-hover:text-white transition-colors">
                          {chunk.preview}
                        </div>
                        <div className="text-[10px] text-[#6b5542] mt-2 font-mono">
                          CHAPTER {index + 1} • {Math.round(chunk.text.length / 6)}s est.
                        </div>
                      </div>
                      <button className="w-9 h-9 rounded-xl bg-[#1a0f08] flex items-center justify-center text-[#d4af37] opacity-0 group-hover:opacity-100 transition-all">
                        ▶
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-[#3a2720] text-xs text-[#8c6f47] flex justify-between">
                  <div>Click any chapter to play • All files saved in browser memory</div>
                  <button 
                    onClick={() => setAudioChunks([])}
                    className="underline hover:text-white transition-colors"
                  >
                    Clear Playlist
                  </button>
                </div>
              </div>
            ) : !documentText ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 mx-auto mb-8 opacity-40">
                  <BookOpen className="w-full h-full text-[#d4af37]" />
                </div>
                <h3 className="text-5xl gold-text mb-6 tracking-tight">The Archive Awaits</h3>
                <p className="max-w-md text-[#a38b6b] text-lg leading-relaxed">
                  Paste text or upload a document on the left. Then click "GENERATE AUDIO CHAPTERS" to create separate MP3 files.
                </p>
                <div className="mt-12 text-[10px] tracking-[2px] text-[#5c4634]">EST. 1892 • OXFORD READING SOCIETY</div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto pr-4 custom-scroll text-[15.2px] leading-[1.85] text-[#d4c3a3]">
                {sentences.map((sentence, idx) => (
                  <span
                    key={idx}
                    className={`transition-all inline ${
                      idx === currentSentenceIndex 
                        ? 'text-[#f0d9a0] font-medium relative after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:bg-[#d4af37] after:w-full' 
                        : 'hover:text-[#e0c88a]'
                    }`}
                  >
                    {sentence.text}{' '}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Player Console */}
          <div className="academia-container mt-6 rounded-3xl p-6 border border-[#5c4634]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="px-4 py-1 bg-[#2c2118] text-xs rounded-3xl border border-[#d4af37]/20 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-[#8c6f47]'}`}></div>
                  {isPlaying ? 'NARRATING' : 'STANDBY'}
                </div>
                <div className="text-xs text-[#8c6f47] flex items-center gap-1">
                  <span>VOICE:</span> 
                  <span className="gold-text">{selectedVoice.name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayback}
                  disabled={sentences.length === 0}
                  className="w-14 h-14 flex items-center justify-center bg-gradient-to-b from-[#d4af37] to-[#b38b4d] hover:brightness-110 active:scale-95 text-[#1a0f08] rounded-2xl transition-all shadow-lg disabled:opacity-40"
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
                </button>
                
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentSentenceIndex(-1);
                    window.speechSynthesis.cancel();
                    if (currentAudio) currentAudio.pause();
                  }}
                  className="w-11 h-11 flex items-center justify-center border border-[#5c4634] hover:bg-[#2c2118] rounded-2xl transition-colors"
                >
                  <Square className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Waveform */}
            <div className="relative mb-6 bg-[#120b06] rounded-2xl p-4 border border-[#3a2720]">
              <canvas 
                ref={canvasRef} 
                className="waveform-canvas w-full h-[110px] rounded-xl"
              />
              <div className="absolute bottom-6 left-8 text-[10px] font-mono text-[#5c4634] tracking-widest">OSCILLOSCOPE • LIVE</div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-8">
                {/* Speed Control */}
                <div>
                  <div className="flex justify-between text-[#8c6f47] mb-1 text-[10px]">
                    <span>SPEED</span>
                    <span className="tabular-nums">{speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speed}
                    onChange={(e) => {
                      const newSpeed = parseFloat(e.target.value);
                      setSpeed(newSpeed);
                      if (sentences.length > 0) calculateStats(sentences);
                    }}
                    className="accent-[#d4af37] w-36"
                  />
                </div>

                {/* Voice Selector Cards - Mini */}
                <div>
                  <div className="text-[#8c6f47] text-[10px] mb-2">NARRATOR</div>
                  <div className="flex gap-2">
                    {voices.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoiceId(voice.id)}
                        className={`px-4 py-2 text-xs rounded-2xl border transition-all flex items-center gap-2 ${
                          selectedVoiceId === voice.id 
                            ? 'border-[#d4af37] bg-[#2c2118] shadow-md' 
                            : 'border-transparent hover:border-[#5c4634] bg-[#1a0f08]'
                        }`}
                      >
                        {voice.icon}
                        <span className={selectedVoiceId === voice.id ? 'gold-text' : ''}>{voice.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 text-xs px-6 py-3 border border-[#5c4634] hover:bg-[#2c2118] rounded-2xl transition-colors"
              >
                <Key className="w-4 h-4" /> MANAGE API KEY
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Voice Library */}
        <div className="w-80 border-l border-[#5c4634] bg-[#1a0f08]/90 flex flex-col academia-container m-3 ml-0 rounded-3xl p-6 overflow-hidden">
          <div className="uppercase text-xs tracking-widest mb-6 text-[#8c6f47]">THE NARRATORS</div>
          
          <div className="space-y-4 overflow-auto custom-scroll">
            {voices.map((voice, index) => (
              <div 
                key={voice.id}
                onClick={() => setSelectedVoiceId(voice.id)}
                className={`group p-5 rounded-2xl border cursor-pointer transition-all hover:-translate-y-0.5 ${
                  selectedVoiceId === voice.id 
                    ? 'border-[#d4af37] bg-[#2c2118] shadow-[0_0_25px_-5px] shadow-[#d4af37]/30' 
                    : 'border-[#3a2720] hover:border-[#6b5542]'
                }`}
              >
                <div className="flex gap-4">
                  <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#3a2720] to-[#1a0f08] flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                    {voice.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div className="font-semibold text-lg gold-text leading-none">{voice.name}</div>
                      <div className="text-[10px] px-2.5 py-0.5 bg-[#120b06] rounded-full text-[#a38b6b]">{voice.accent}</div>
                    </div>
                    <div className="text-xs text-[#a38b6b] mt-1.5 line-clamp-2">{voice.description}</div>
                    <div className="mt-4 text-[10px] flex items-center gap-1 text-[#6b5542]">
                      {voice.gender === 'female' ? '♀' : '♂'} NARRATOR • {index + 1}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-auto pt-8 text-[10px] text-center text-[#5c4634] border-t border-[#3a2720]">
            Powered by Google Cloud Text-to-Speech<br />
            All voices synthesized with period-accurate timbre
          </div>
        </div>
      </div>

      {/* Settings Modal - Parchment Style */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="academia-container w-full max-w-md mx-4 rounded-3xl p-10 relative ornate-border shadow-2xl"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2c2118] text-[#d4af37] text-xs tracking-widest px-8 py-1 border border-[#5c4634] rounded-full">
              ARCHIVE CONFIGURATION
            </div>
            
            <h3 className="text-3xl gold-text text-center mt-6 mb-8">Google TTS Credentials</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs tracking-widest text-[#8c6f47] mb-2">API KEY</label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#120b06] border border-[#5c4634] focus:border-[#d4af37] rounded-2xl px-5 py-4 text-sm font-mono outline-none transition-colors"
                  />
                  <Key className="absolute right-5 top-4 text-[#8c6f47]" />
                </div>
                <p className="text-[10px] mt-3 text-[#6b5542]">Stored locally in browser. Never shared with servers.</p>
              </div>

              <div className="bg-[#120b06] p-5 rounded-2xl text-xs border border-[#3a2720]">
                Obtain your key from the Google Cloud Console. Enable the Text-to-Speech API and create credentials. 
                Free tier available with limits.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-4 border border-[#5c4634] hover:bg-[#2c2118] rounded-2xl text-sm transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => saveApiKey(apiKey)}
                  className="flex-1 py-4 bg-gradient-to-b from-[#d4af37] to-[#b38b4d] text-[#120b06] font-semibold rounded-2xl text-sm hover:brightness-110 transition-all active:scale-[0.985]"
                >
                  SAVE KEY
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-6 right-6 text-[#8c6f47] hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EchoArchive;
