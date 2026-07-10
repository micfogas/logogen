/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Video, Upload, Sparkles, Wand2, Loader2, PlayCircle, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'design' | 'upload'>('design');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30 font-sans">
      <div className="max-w-5xl mx-auto p-6 md:p-12">
        <header className="mb-12 text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-2"
          >
            <Sparkles className="w-8 h-8 text-purple-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl md:text-6xl font-semibold tracking-tight"
          >
            Brand <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Animator</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Design a professional logo with Gemini, and bring it to life with Veo.
          </motion.p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="bg-white/5 p-1 rounded-full inline-flex space-x-1">
            <button
              onClick={() => setActiveTab('design')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'design' 
                  ? 'bg-white/10 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              Design & Animate
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'upload' 
                  ? 'bg-white/10 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              Animate Photo
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'design' ? (
            <DesignTab key="design" />
          ) : (
            <UploadTab key="upload" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DesignTab() {
  const [description, setDescription] = useState('');
  const [imageSize, setImageSize] = useState('1K');
  
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [videoPrompt, setVideoPrompt] = useState('Animate this logo professionally, adding dynamic lighting and smooth motion.');
  
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoOpName, setVideoOpName] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>('');

  const handleGenerateLogo = async () => {
    if (!description.trim()) return;
    
    setIsGeneratingLogo(true);
    setLogoError(null);
    setLogoImage(null);
    setVideoOpName(null);
    setVideoReady(false);
    
    try {
      const res = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, imageSize })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate logo');
      
      setLogoImage(data.image);
    } catch (err: any) {
      setLogoError(err.message);
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleAnimateLogo = async () => {
    if (!logoImage) return;
    
    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoOpName(null);
    setVideoReady(false);
    setPollingStatus('Starting generation...');
    
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base64Image: logoImage,
          prompt: videoPrompt,
          aspectRatio 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start video generation');
      
      setVideoOpName(data.operationName);
    } catch (err: any) {
      setVideoError(err.message);
      setIsGeneratingVideo(false);
    }
  };

  // Poll for video status
  useEffect(() => {
    if (!videoOpName || videoReady) return;

    let intervalId: any;
    
    const checkStatus = async () => {
      try {
        setPollingStatus('Rendering video (this usually takes 1-3 minutes)...');
        const res = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: videoOpName })
        });
        
        const data = await res.json();
        if (data.done) {
          setVideoReady(true);
          setIsGeneratingVideo(false);
          setPollingStatus('');
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };

    intervalId = setInterval(checkStatus, 5000);
    return () => clearInterval(intervalId);
  }, [videoOpName, videoReady]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-5">
          <h2 className="text-xl font-medium flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-purple-400" />
            1. Design Logo
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Company Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A modern tech startup focusing on AI and nature..."
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors resize-none h-32"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Resolution</label>
              <select
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500/50 appearance-none"
              >
                <option value="1K">1K (Standard)</option>
                <option value="2K">2K (High)</option>
                <option value="4K">4K (Ultra)</option>
              </select>
            </div>
            
            <button
              onClick={handleGenerateLogo}
              disabled={!description.trim() || isGeneratingLogo}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-medium transition-all flex justify-center items-center"
            >
              {isGeneratingLogo ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Designing...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Logo
                </>
              )}
            </button>
            
            {logoError && (
              <p className="text-red-400 text-sm mt-2">{logoError}</p>
            )}
          </div>
        </div>

        <div className={`bg-white/5 p-6 rounded-2xl border border-white/10 space-y-5 transition-opacity ${logoImage ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <h2 className="text-xl font-medium flex items-center">
            <Video className="w-5 h-5 mr-2 text-pink-400" />
            2. Animate Logo
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Animation Prompt (Optional)</label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="How should the logo move?"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-24"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500/50 appearance-none"
              >
                <option value="16:9">16:9 (Landscape - Video)</option>
                <option value="9:16">9:16 (Portrait - Reels/Shorts)</option>
              </select>
            </div>
            
            <button
              onClick={handleAnimateLogo}
              disabled={!logoImage || isGeneratingVideo || videoReady}
              className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-medium transition-all flex justify-center items-center"
            >
              {isGeneratingVideo ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Rendering Video...
                </>
              ) : videoReady ? (
                <>
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Video Complete
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Animate with Veo
                </>
              )}
            </button>
            
            {videoError && (
              <p className="text-red-400 text-sm mt-2">{videoError}</p>
            )}
            {isGeneratingVideo && pollingStatus && (
              <p className="text-pink-400 text-sm mt-2 text-center animate-pulse">{pollingStatus}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[500px] overflow-hidden relative">
        {!logoImage && !videoOpName && (
          <div className="text-center text-gray-500 flex flex-col items-center">
            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>Your generated assets will appear here</p>
          </div>
        )}
        
        {logoImage && !videoReady && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex flex-col items-center justify-center space-y-4"
          >
            <img 
              src={logoImage} 
              alt="Generated Logo" 
              className="max-w-full max-h-[400px] rounded-xl shadow-2xl shadow-purple-500/20"
              referrerPolicy="no-referrer"
            />
            {isGeneratingVideo && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl border border-pink-500/30">
                <Loader2 className="w-10 h-10 text-pink-400 animate-spin mb-4" />
                <p className="text-pink-200 font-medium">Generating Video...</p>
                <p className="text-xs text-pink-300/70 mt-2">This typically takes a few minutes.</p>
              </div>
            )}
          </motion.div>
        )}

        {videoReady && videoOpName && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex items-center justify-center"
          >
            <video 
              src={`/api/video-download?op=${encodeURIComponent(videoOpName)}`} // This won't work perfectly with standard fetch if we need to POST. We should create a helper.
              controls
              autoPlay
              loop
              className="max-w-full max-h-full rounded-xl shadow-2xl shadow-pink-500/20"
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Custom Video Player component that handles POST download request
function VideoPlayer({ operationName }: { operationName: string }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    
    const fetchVideo = async () => {
      try {
        const res = await fetch('/api/video-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName })
        });
        
        if (!res.ok) throw new Error('Failed to load video');
        
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setVideoUrl(objectUrl);
      } catch (err: any) {
        setError(err.message);
      }
    };
    
    fetchVideo();
    
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [operationName]);

  if (error) {
    return <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">{error}</div>;
  }

  if (!videoUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-pink-400 animate-spin mb-4" />
        <p className="text-gray-400">Downloading video...</p>
      </div>
    );
  }

  return (
    <video 
      src={videoUrl}
      controls
      autoPlay
      loop
      className="max-w-full max-h-full rounded-xl shadow-2xl shadow-pink-500/20"
    />
  );
}

function UploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [videoPrompt, setVideoPrompt] = useState('');
  
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoOpName, setVideoOpName] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    }
  };

  const handleAnimatePhoto = async () => {
    if (!file) return;
    
    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoOpName(null);
    setVideoReady(false);
    setPollingStatus('Starting generation...');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('prompt', videoPrompt);
      formData.append('aspectRatio', aspectRatio);
      
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start video generation');
      
      setVideoOpName(data.operationName);
    } catch (err: any) {
      setVideoError(err.message);
      setIsGeneratingVideo(false);
    }
  };

  useEffect(() => {
    if (!videoOpName || videoReady) return;

    let intervalId: any;
    
    const checkStatus = async () => {
      try {
        setPollingStatus('Rendering video (this usually takes 1-3 minutes)...');
        const res = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: videoOpName })
        });
        
        const data = await res.json();
        if (data.done) {
          setVideoReady(true);
          setIsGeneratingVideo(false);
          setPollingStatus('');
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };

    intervalId = setInterval(checkStatus, 5000);
    return () => clearInterval(intervalId);
  }, [videoOpName, videoReady]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Upload Photo</label>
          <div 
            onClick={() => !isGeneratingVideo && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              previewUrl 
                ? 'border-pink-500/30 bg-pink-500/5' 
                : 'border-white/20 hover:border-white/40 hover:bg-white/5 cursor-pointer'
            } ${isGeneratingVideo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {previewUrl ? (
              <div className="flex flex-col items-center">
                <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg mb-4" />
                <span className="text-sm text-gray-400">Click to change image</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <Upload className="w-10 h-10 text-gray-500" />
                <div>
                  <p className="text-white font-medium">Click to upload image</p>
                  <p className="text-gray-500 text-sm mt-1">JPEG, PNG up to 10MB</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Animation Prompt (Optional)</label>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Describe the desired motion, lighting, and camera movement..."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-24"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500/50 appearance-none"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
            </select>
          </div>
          
          <button
            onClick={handleAnimatePhoto}
            disabled={!file || isGeneratingVideo || videoReady}
            className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-medium transition-all flex justify-center items-center"
          >
            {isGeneratingVideo ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Rendering Video...
              </>
            ) : videoReady ? (
              <>
                <PlayCircle className="w-5 h-5 mr-2" />
                Generation Complete
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Animate Photo
              </>
            )}
          </button>
          
          {videoError && (
            <p className="text-red-400 text-sm mt-2">{videoError}</p>
          )}
          {isGeneratingVideo && pollingStatus && (
            <p className="text-pink-400 text-sm mt-2 text-center animate-pulse">{pollingStatus}</p>
          )}
        </div>
      </div>
      
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[500px] overflow-hidden relative">
        {!previewUrl && !videoOpName && (
          <div className="text-center text-gray-500 flex flex-col items-center">
            <Video className="w-12 h-12 mb-4 opacity-50" />
            <p>Your video will appear here</p>
          </div>
        )}
        
        {previewUrl && !videoReady && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex flex-col items-center justify-center space-y-4"
          >
            <img 
              src={previewUrl} 
              alt="Uploaded source" 
              className="max-w-full max-h-[400px] rounded-xl shadow-2xl shadow-white/5 opacity-50 blur-[2px]"
            />
            {isGeneratingVideo && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl border border-pink-500/30">
                <Loader2 className="w-10 h-10 text-pink-400 animate-spin mb-4" />
                <p className="text-pink-200 font-medium">Generating Video with Veo...</p>
                <p className="text-xs text-pink-300/70 mt-2">This typically takes 1-3 minutes.</p>
              </div>
            )}
          </motion.div>
        )}

        {videoReady && videoOpName && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex items-center justify-center"
          >
            <VideoPlayer operationName={videoOpName} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

