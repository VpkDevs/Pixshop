
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon, PaletteIcon, SunIcon, ImageIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const SAMPLE_IMAGES = [
    { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000&auto=format&fit=crop', name: 'Landscape' },
    { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop', name: 'Portrait' },
    { url: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=1000&auto=format&fit=crop', name: 'Mountains' },
    { url: 'https://images.unsplash.com/photo-1493246507139-91e8bef99c17?q=80&w=1000&auto=format&fit=crop', name: 'Nature' },
];

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  const loadSample = async (url: string) => {
      setLoadingSample(url);
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          onFileSelect(dataTransfer.files);
      } catch (e) {
          console.error("Failed to load sample", e);
      } finally {
          setLoadingSample(null);
      }
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-4 md:p-12 transition-all duration-500 rounded-3xl border-2 ${isDraggingOver ? 'bg-blue-500/10 border-dashed border-blue-400 scale-[0.99]' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter text-[var(--text-primary)] sm:text-6xl md:text-8xl">
              Pix<span className="text-blue-500">shop</span>.
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-[var(--text-secondary)] md:text-2xl font-medium leading-relaxed">
              Experience the future of photo editing. Simple text prompts, powerful AI, professional results.
            </p>
        </div>

        <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <label htmlFor="image-upload-start" className="w-full relative inline-flex items-center justify-center px-10 py-6 text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl cursor-pointer group hover:from-blue-500 hover:to-indigo-600 transition-all shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1 active:translate-y-0">
                <UploadIcon className="w-7 h-7 mr-3 transition-transform duration-700 group-hover:rotate-180" />
                Upload Image
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">or drag and drop anywhere</p>
        </div>

        <div className="w-full space-y-6">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] opacity-50">Try a Sample</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SAMPLE_IMAGES.map((img) => (
                    <button 
                        key={img.url}
                        onClick={() => loadSample(img.url)}
                        disabled={loadingSample !== null}
                        className="group relative h-32 md:h-40 rounded-2xl overflow-hidden border border-[var(--border-color)] transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-sm bg-blue-600 px-3 py-1 rounded-full">{loadingSample === img.url ? 'Loading...' : 'Select'}</span>
                        </div>
                        <div className="absolute bottom-2 left-2 text-[10px] text-white/70 font-bold uppercase bg-black/30 px-2 py-0.5 rounded">
                            {img.name}
                        </div>
                    </button>
                ))}
            </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="bg-[var(--bg-panel)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center text-center backdrop-blur-md hover:bg-[var(--bg-panel-solid)] transition-colors">
                <div className="flex items-center justify-center w-14 h-14 bg-blue-500/10 rounded-2xl mb-5">
                   <MagicWandIcon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Retouch</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">Describe changes to any specific part of your photo with pixel precision.</p>
            </div>
            <div className="bg-[var(--bg-panel)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center text-center backdrop-blur-md hover:bg-[var(--bg-panel-solid)] transition-colors">
                <div className="flex items-center justify-center w-14 h-14 bg-purple-500/10 rounded-2xl mb-5">
                   <PaletteIcon className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Style</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">Apply sophisticated cinematic looks, artistic filters, and lighting presets.</p>
            </div>
            <div className="bg-[var(--bg-panel)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center text-center backdrop-blur-md hover:bg-[var(--bg-panel-solid)] transition-colors">
                <div className="flex items-center justify-center w-14 h-14 bg-emerald-500/10 rounded-2xl mb-5">
                   <SunIcon className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Analyze</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">Extract data, identify objects, or get deep insights from images and video.</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StartScreen;
