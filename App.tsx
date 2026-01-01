/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { 
    generateEditedImage, 
    generateFilteredImage, 
    generateAdjustedImage, 
    generateRemovedBackgroundImage, 
    generateMagicFillImage,
    generateNewImage,
    generateVeoVideo,
    analyzeImage,
    analyzeVideo,
    generateSpeech
} from './services/geminiService';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import MagicPanel from './components/MagicPanel';
import GeneratePanel from './components/GeneratePanel';
import VideoPanel from './components/VideoPanel';
import AnalyzePanel from './components/AnalyzePanel';
import BatchProcessor from './components/BatchProcessor';
import ExportModal from './components/ExportModal';
import ToastContainer, { ToastType, ToastMessage } from './components/ToastContainer';
import LiveAssistant from './components/LiveAssistant';
import StartScreen from './components/StartScreen';
import { saveSession, loadSession, clearSession } from './utils/storage';
import { AspectRatio, ImageSize } from './types';
import { 
    UndoIcon, RedoIcon, EyeIcon, SparklesIcon, DownloadIcon, 
    ImageIcon, VideoIcon, AnalyzeIcon, MicIcon, 
    MagicWandIcon, PaletteIcon, SunIcon, BatchIcon,
    MoonIcon
} from './components/icons';

// --- Data & Helpers ---

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type:mimeMatch[1]});
}

export type ToolMode = 'retouch' | 'magic' | 'adjust' | 'filters' | 'crop' | 'generate' | 'video' | 'analyze';

// --- Components ---

const App: React.FC = () => {
  // Global State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [appMode, setAppMode] = useState<'single' | 'batch'>('single');
  
  // History & Image State
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Tool State
  const [activeTool, setActiveTool] = useState<ToolMode>('retouch');
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Feature Specific State
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [magicPrompt, setMagicPrompt] = useState<string>('');
  const [isMasking, setIsMasking] = useState<boolean>(false);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState<number>(40);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[] | null>(null);
  
  // UI State
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLiveAssistant, setShowLiveAssistant] = useState(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  
  // Refs
  const imgRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  // --- Effects ---

  useEffect(() => { document.body.setAttribute('data-theme', theme); }, [theme]);

  // Load Session
  useEffect(() => {
      loadSession().then(session => {
          if (session && session.history?.length > 0) {
              setHistory(session.history);
              setHistoryIndex(session.currentIndex);
              addToast("Session restored", "success");
          }
      }).catch(console.warn);
  }, []);

  // Save Session
  useEffect(() => {
      if (history.length > 0) saveSession(history, historyIndex).catch(console.error);
  }, [history, historyIndex]);

  // Image URLs
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else setCurrentImageUrl(null);
  }, [currentImage]);
  
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else setOriginalImageUrl(null);
  }, [originalImage]);

  // Canvas Resizing for Mask
  useEffect(() => {
    const img = imgRef.current;
    const canvas = maskCanvasRef.current;
    if (img && canvas) {
        const sync = () => {
            canvas.width = img.clientWidth;
            canvas.height = img.clientHeight;
        };
        const obs = new ResizeObserver(sync);
        obs.observe(img);
        sync();
        return () => obs.disconnect();
    }
  }, [currentImageUrl, activeTool]);

  // Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') e.shiftKey ? handleRedo() : handleUndo();
        if ((e.metaKey || e.ctrlKey) && e.key === 'y') handleRedo();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [historyIndex, history]);


  // --- Actions ---

  const addToast = (message: string, type: ToastType = 'info') => {
      const id = Date.now().toString();
      setToasts(p => [...p, { id, message, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  const handleError = (e: any) => addToast(e instanceof Error ? e.message : "Unknown error", 'error');

  const addToHistory = useCallback((file: File) => {
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(file);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    // Reset transient states
    setEditHotspot(null); setDisplayHotspot(null);
    setCrop(undefined); setCompletedCrop(undefined);
    setIsMasking(false); setMaskDataUrl(null);
    setVideoResult(null); setAnalysisResult(null);
    addToast("Layer added", "success");
  }, [history, historyIndex]);

  // API Wrappers
  const handleGenAction = async (action: () => Promise<string>, filename: string) => {
      if (!currentImage) return;
      setIsLoading(true);
      try {
          const url = await action();
          addToHistory(dataURLtoFile(url, filename));
      } catch (e) { handleError(e); } finally { setIsLoading(false); }
  };

  const handleRetouch = () => {
      if (!editHotspot) return addToast("Click on the image to select an area.", "error");
      if (!prompt) return addToast("Please describe the edit.", "error");
      handleGenAction(() => generateEditedImage(currentImage!, prompt, editHotspot), `retouched-${Date.now()}.png`);
  };

  const handleMagicFill = (p: string) => {
      if (!maskDataUrl) return addToast("Please draw a mask first.", "error");
      // Convert mask string to file
      const maskImg = new Image();
      maskImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = imgRef.current?.naturalWidth || maskImg.width;
          canvas.height = imgRef.current?.naturalHeight || maskImg.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.fillStyle = 'black'; ctx.fillRect(0,0,canvas.width,canvas.height);
             ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
             const file = dataURLtoFile(canvas.toDataURL(), 'mask.png');
             handleGenAction(() => generateMagicFillImage(currentImage!, file, p), `fill-${Date.now()}.png`);
          }
      };
      maskImg.src = maskDataUrl;
  };

  const handleCropApply = () => {
      if (!completedCrop || !imgRef.current) return;
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = completedCrop.width; canvas.height = completedCrop.height;
      ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, completedCrop.width, completedCrop.height);
      addToHistory(dataURLtoFile(canvas.toDataURL(), `crop-${Date.now()}.png`));
  };

  const handleAnalysis = async (p: string, think: boolean, ground: boolean) => {
      if (!currentImage) return;
      setIsLoading(true);
      try {
          const { text, groundingChunks: chunks } = await analyzeImage(currentImage, p, think, ground);
          setAnalysisResult(text);
          setGroundingChunks(chunks);
      } catch(e) { handleError(e); } finally { setIsLoading(false); }
  };

  // --- Interaction Handlers ---

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
      if (activeTool !== 'retouch' || isMasking) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDisplayHotspot({ x, y });
      
      const scaleX = e.currentTarget.naturalWidth / e.currentTarget.clientWidth;
      const scaleY = e.currentTarget.naturalHeight / e.currentTarget.clientHeight;
      setEditHotspot({ x: Math.round(x * scaleX), y: Math.round(y * scaleY) });
  };

  const handleMaskDraw = (e: any) => {
      if (!isMasking || !maskCanvasRef.current) return;
      const rect = maskCanvasRef.current.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      
      const ctx = maskCanvasRef.current.getContext('2d');
      if (!ctx) return;

      if (e.type === 'mousedown' || e.type === 'touchstart') {
          isDrawingRef.current = true;
          lastPositionRef.current = { x, y };
          ctx.beginPath(); ctx.arc(x, y, brushSize/2, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
      } else if (e.type === 'mousemove' || e.type === 'touchmove') {
          if (!isDrawingRef.current) return;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = brushSize; ctx.lineCap = 'round';
          ctx.moveTo(lastPositionRef.current!.x, lastPositionRef.current!.y);
          ctx.lineTo(x, y);
          ctx.stroke();
          lastPositionRef.current = { x, y };
      } else {
          isDrawingRef.current = false;
          setMaskDataUrl(maskCanvasRef.current.toDataURL());
      }
  };

  const handleUndo = () => historyIndex > 0 && setHistoryIndex(historyIndex - 1);
  const handleRedo = () => historyIndex < history.length - 1 && setHistoryIndex(historyIndex + 1);
  const handleClear = async () => { await clearSession(); setHistory([]); setHistoryIndex(-1); };

  // --- Renderers ---

  if (appMode === 'batch') return <BatchProcessor onBack={() => setAppMode('single')} />;

  if (!currentImage && activeTool !== 'generate') {
      return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
            <header className="p-6 flex justify-between items-center glass-panel border-b-0">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-[var(--accent)]" /> Lumina
                </h1>
                <div className="flex gap-2">
                    <button onClick={() => setAppMode('batch')} className="text-sm font-semibold px-4 py-2 hover:bg-[var(--bg-panel-hover)] rounded-lg">Batch Mode</button>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-[var(--bg-panel-hover)]">
                        {theme === 'dark' ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center p-4">
                <StartScreen onFileSelect={(files) => files?.[0] && addToHistory(files[0])} />
            </main>
        </div>
      );
  }

  const TOOLS: {id: ToolMode, icon: any, label: string}[] = [
      { id: 'retouch', icon: MagicWandIcon, label: 'Retouch' },
      { id: 'magic', icon: SparklesIcon, label: 'Magic Fill' },
      { id: 'crop', icon: ImageIcon, label: 'Crop' }, // Using ImageIcon as placeholder crop
      { id: 'adjust', icon: SunIcon, label: 'Adjust' },
      { id: 'filters', icon: PaletteIcon, label: 'Filters' },
      { id: 'analyze', icon: AnalyzeIcon, label: 'Analyze' },
      { id: 'video', icon: VideoIcon, label: 'Video' },
      { id: 'generate', icon: ImageIcon, label: 'Generate' },
  ];

  return (
    <div className="h-screen w-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col overflow-hidden">
        <ToastContainer toasts={toasts} removeToast={id => setToasts(p => p.filter(t => t.id !== id))} />
        {showExportModal && currentImage && <ExportModal image={currentImage} onClose={() => setShowExportModal(false)} />}
        {showLiveAssistant && <LiveAssistant onClose={() => setShowLiveAssistant(false)} onApplyFilter={(f) => handleGenAction(() => generateFilteredImage(currentImage!, f), 'filter.png')} onRemoveBackground={() => handleGenAction(() => generateRemovedBackgroundImage(currentImage!), 'rm-bg.png')} />}

        {/* Header */}
        <header className="h-14 shrink-0 glass-panel border-b flex items-center justify-between px-4 z-20">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" onClick={handleClear}>
                    <SparklesIcon className="w-6 h-6 text-[var(--accent)]" /> Lumina
                </div>
                <div className="h-6 w-px bg-[var(--border-subtle)] mx-2"></div>
                <div className="flex items-center gap-1">
                    <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded hover:bg-[var(--bg-panel-hover)] disabled:opacity-30"><UndoIcon className="w-5 h-5" /></button>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded hover:bg-[var(--bg-panel-hover)] disabled:opacity-30"><RedoIcon className="w-5 h-5" /></button>
                </div>
                {historyIndex > 0 && (
                   <button 
                     onMouseDown={() => setIsComparing(true)} onMouseUp={() => setIsComparing(false)} onMouseLeave={() => setIsComparing(false)}
                     className="ml-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                   >
                     <EyeIcon className="w-4 h-4" /> Hold to Compare
                   </button>
                )}
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => setAppMode('batch')} title="Batch Mode" className="p-2 hover:bg-[var(--bg-panel-hover)] rounded text-[var(--text-secondary)]"><BatchIcon className="w-5 h-5" /></button>
                <button onClick={() => setShowLiveAssistant(true)} title="Voice Assistant" className="p-2 hover:bg-[var(--bg-panel-hover)] rounded text-[var(--text-secondary)]"><MicIcon className="w-5 h-5" /></button>
                <button onClick={() => setShowExportModal(true)} disabled={!currentImage} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm flex items-center gap-2">
                    <DownloadIcon className="w-4 h-4" /> Export
                </button>
            </div>
        </header>

        {/* Workspace */}
        <div className="flex-grow flex overflow-hidden">
            {/* Left Sidebar (Tools) */}
            <nav className="w-20 shrink-0 glass-panel border-r flex flex-col items-center py-4 gap-4 z-10 overflow-y-auto no-scrollbar">
                {TOOLS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTool(t.id)}
                        className={`p-3 rounded-xl transition-all duration-200 group relative ${activeTool === t.id ? 'bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-hover)] hover:text-[var(--text-primary)]'}`}
                        title={t.label}
                    >
                        <t.icon className="w-6 h-6" />
                        <span className="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">{t.label}</span>
                    </button>
                ))}
            </nav>

            {/* Center Canvas */}
            <main className="flex-grow bg-[var(--bg-app)] relative flex items-center justify-center p-8 overflow-hidden select-none">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Spinner />
                    </div>
                )}
                
                {/* Image Render */}
                {activeTool === 'generate' && !currentImageUrl ? (
                    <div className="text-[var(--text-secondary)] flex flex-col items-center">
                        <ImageIcon className="w-16 h-16 opacity-20 mb-4" />
                        <p>Use the panel to generate a new image</p>
                    </div>
                ) : (currentImageUrl && (
                    <div className="relative shadow-2xl rounded-lg overflow-hidden max-w-full max-h-full border border-[var(--border-subtle)]">
                        {/* Compare Layer */}
                        {isComparing && originalImageUrl && (
                            <img src={originalImageUrl} className="absolute inset-0 w-full h-full object-contain z-30 pointer-events-none" alt="Original" />
                        )}

                        {/* Main Image */}
                        {activeTool === 'crop' ? (
                            <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={aspect}>
                                <img ref={imgRef} src={currentImageUrl} className="max-w-full max-h-[85vh] object-contain block" alt="Work" />
                            </ReactCrop>
                        ) : activeTool === 'video' && videoResult ? (
                            <video src={videoResult} controls autoPlay className="max-w-full max-h-[85vh] rounded" />
                        ) : (
                            <div className="relative">
                                <img 
                                    ref={imgRef}
                                    src={currentImageUrl} 
                                    className={`max-w-full max-h-[85vh] object-contain block ${activeTool === 'retouch' && !isMasking ? 'cursor-crosshair' : ''}`}
                                    onClick={handleImageClick}
                                    alt="Work" 
                                />
                                {/* Mask Layer */}
                                <canvas
                                    ref={maskCanvasRef}
                                    className={`absolute inset-0 w-full h-full ${isMasking ? 'cursor-crosshair z-20' : 'pointer-events-none'}`}
                                    onMouseDown={handleMaskDraw} onMouseMove={handleMaskDraw} onMouseUp={handleMaskDraw} onMouseLeave={handleMaskDraw}
                                    onTouchStart={handleMaskDraw} onTouchMove={handleMaskDraw} onTouchEnd={handleMaskDraw}
                                />
                                {/* Hotspot */}
                                {displayHotspot && activeTool === 'retouch' && (
                                    <div className="absolute w-6 h-6 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg pointer-events-none animate-pulse" style={{ left: displayHotspot.x, top: displayHotspot.y, boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}>
                                        <div className="absolute inset-0 bg-blue-500/30 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </main>

            {/* Right Control Rail */}
            <aside className="w-80 shrink-0 glass-panel border-l flex flex-col z-10">
                <div className="p-4 border-b border-[var(--border-subtle)]">
                    <h2 className="font-bold text-lg capitalize flex items-center gap-2">
                        {TOOLS.find(t => t.id === activeTool)?.label}
                    </h2>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-6">
                    {activeTool === 'retouch' && (
                        <div className="animate-in space-y-4">
                            <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-panel-hover)] p-3 rounded-lg border border-[var(--border-subtle)]">
                                {editHotspot ? "Point selected. Describe your change below." : "Click on the image to select an area to edit."}
                            </div>
                            <textarea 
                                value={prompt} 
                                onChange={e => setPrompt(e.target.value)} 
                                placeholder="e.g. Turn this red flower into a blue one"
                                className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--accent)] resize-none h-32"
                            />
                            <button onClick={handleRetouch} disabled={!editHotspot || !prompt || isLoading} className="w-full btn-primary py-3 rounded-lg font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-50">
                                Apply Edit
                            </button>
                        </div>
                    )}

                    {activeTool === 'magic' && (
                        <div className="animate-in">
                            <MagicPanel 
                                onRemoveBackground={() => handleGenAction(() => generateRemovedBackgroundImage(currentImage!), 'rm-bg.png')}
                                onMagicFill={handleMagicFill}
                                magicPrompt={magicPrompt} onMagicPromptChange={setMagicPrompt}
                                isMasking={isMasking} onToggleMasking={() => setIsMasking(!isMasking)}
                                onClearMask={() => { const ctx = maskCanvasRef.current?.getContext('2d'); if(ctx) ctx.clearRect(0,0,9999,9999); setMaskDataUrl(null); }}
                                brushSize={brushSize} onBrushSizeChange={setBrushSize}
                                isLoading={isLoading} hasMask={!!maskDataUrl}
                            />
                        </div>
                    )}

                    {activeTool === 'crop' && (
                        <CropPanel onApplyCrop={handleCropApply} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop} />
                    )}

                    {activeTool === 'adjust' && (
                        <AdjustmentPanel onApplyAdjustment={p => handleGenAction(() => generateAdjustedImage(currentImage!, p), 'adj.png')} isLoading={isLoading} />
                    )}

                    {activeTool === 'filters' && (
                         <FilterPanel onApplyFilter={p => handleGenAction(() => generateFilteredImage(currentImage!, p), 'filt.png')} isLoading={isLoading} />
                    )}

                    {activeTool === 'analyze' && (
                        <AnalyzePanel 
                            onAnalyzeImage={handleAnalysis} 
                            onAnalyzeVideo={(f, p) => analyzeVideo(f, p).then(setAnalysisResult)} 
                            isLoading={isLoading} hasImage={!!currentImage}
                            onSelectTemplate={setPrompt}
                        />
                    )}

                    {activeTool === 'video' && (
                        <VideoPanel onGenerateVideo={(p, r, i) => handleGenAction(() => generateVeoVideo(p, r, i ? currentImage! : undefined), 'video.mp4')} isLoading={isLoading} hasImage={!!currentImage} />
                    )}

                    {activeTool === 'generate' && (
                        <GeneratePanel onGenerate={(p, r, s) => handleGenAction(() => generateNewImage(p, r, s), 'gen.png')} isLoading={isLoading} />
                    )}

                    {/* Results Area for Analysis */}
                    {activeTool === 'analyze' && analysisResult && (
                        <div className="mt-4 p-4 bg-[var(--bg-panel-hover)] rounded-lg text-sm border border-[var(--border-subtle)]">
                            <h3 className="font-bold mb-2 text-[var(--accent)]">Analysis Result</h3>
                            <p className="whitespace-pre-wrap leading-relaxed">{analysisResult}</p>
                            {groundingChunks && <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">{groundingChunks.length} Sources Found</div>}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    </div>
  );
};

export default App;