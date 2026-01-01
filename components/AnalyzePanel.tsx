
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
// Added VideoIcon to the imports to resolve reference error on line 125.
import { AnalyzeIcon, UploadIcon, GoogleIcon, MapPinIcon, BrainIcon, SpeakerIcon, StopIcon, VideoIcon } from './icons';

interface AnalyzePanelProps {
    onAnalyzeImage: (prompt: string, thinking: boolean, grounding: boolean) => void;
    onAnalyzeVideo: (file: File, prompt: string) => void;
    isLoading: boolean;
    hasImage: boolean;
    onSelectTemplate?: (prompt: string) => void;
}

const TEMPLATES = [
    { name: 'Describe Scene', prompt: 'Provide a detailed, professional description of this image, listing key elements, lighting, and mood.' },
    { name: 'Identify Objects', prompt: 'List and describe all significant objects found in this image. Categorize them if possible.' },
    { name: 'Style Analysis', prompt: 'Analyze the artistic style of this image. Identify techniques, period inspirations, and aesthetic choices.' },
    { name: 'Read Text', prompt: 'Extract and transcribe any visible text in this image accurately.' },
    { name: 'Identify Location', prompt: 'Where was this likely taken? Identify landmarks, city characteristics, or geographical clues.' },
    { name: 'Human Context', prompt: 'Analyze the people in this image (if any). Describe their actions, expressions, and the social context.' },
];

const AnalyzePanel: React.FC<AnalyzePanelProps> = ({ onAnalyzeImage, onAnalyzeVideo, isLoading, hasImage, onSelectTemplate }) => {
    const [mode, setMode] = useState<'image' | 'video'>('image');
    const [prompt, setPrompt] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [useThinking, setUseThinking] = useState(false);
    const [useGrounding, setUseGrounding] = useState(false);

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
        }
    };

    const handleAction = () => {
        if (mode === 'image') {
            onAnalyzeImage(prompt, useThinking, useGrounding);
        } else {
            if (videoFile) onAnalyzeVideo(videoFile, prompt);
        }
    };

    const handleTemplateClick = (p: string) => {
        setPrompt(p);
        if (onSelectTemplate) onSelectTemplate(p);
    };
    
    return (
        <div className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl p-6 animate-fade-in backdrop-blur-sm shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <AnalyzeIcon className="w-6 h-6 text-emerald-400" />
                    Vision Intelligence
                </h2>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setMode('image')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === 'image' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-white'}`}
                >
                    Current Image
                </button>
                <button
                    onClick={() => setMode('video')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === 'video' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-white'}`}
                >
                    Analyze Video
                </button>
            </div>

            {mode === 'image' && !hasImage && (
                <div className="text-center py-12 px-6 border-2 border-dashed border-[var(--border-color)] rounded-2xl text-[var(--text-secondary)] mb-6 bg-black/10">
                    <AnalyzeIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold">Upload an image to start analysis</p>
                </div>
            )}
            
            {mode === 'image' && hasImage && (
                <div className="flex flex-col gap-6 mb-6">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setUseThinking(!useThinking)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${useThinking ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md shadow-purple-900/40' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'}`}
                        >
                            <BrainIcon className="w-4 h-4" />
                            Deep Thinking
                        </button>
                        <button
                            onClick={() => setUseGrounding(!useGrounding)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${useGrounding ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md shadow-blue-900/40' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'}`}
                        >
                            <GoogleIcon className="w-4 h-4" />
                            Web Grounding
                        </button>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] ml-1">Templates</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {TEMPLATES.map(t => (
                                <button
                                    key={t.name}
                                    onClick={() => handleTemplateClick(t.prompt)}
                                    className="text-left bg-[var(--bg-input)] hover:bg-[var(--bg-panel-solid)] border border-[var(--border-color)] hover:border-emerald-500/50 p-3 rounded-xl transition-all group"
                                >
                                    <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-emerald-400">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {mode === 'video' && (
                <div className="mb-6">
                    <label className="block w-full cursor-pointer bg-[var(--bg-input)] border-2 border-dashed border-[var(--border-color)] rounded-2xl p-8 text-center hover:border-emerald-500/50 transition-all">
                        <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                        {videoFile ? (
                            <div className="flex items-center justify-center gap-3">
                                <VideoIcon className="w-6 h-6 text-emerald-400" />
                                <span className="text-emerald-400 font-bold truncate max-w-xs">{videoFile.name}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)]">
                                <UploadIcon className="w-10 h-10 opacity-30" />
                                <span className="font-bold">Drop video for AI review</span>
                            </div>
                        )}
                    </label>
                </div>
            )}

            <div className="flex flex-col gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] ml-1">Analysis Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={mode === 'image' ? "Ask anything about this image..." : "What happens in this video?"}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-4 min-h-[100px] focus:ring-2 focus:ring-emerald-500/50 outline-none text-[var(--text-primary)] transition-all resize-none"
                        disabled={isLoading}
                    />
                </div>
                
                <button
                    onClick={handleAction}
                    disabled={isLoading || !prompt.trim() || (mode === 'image' && !hasImage) || (mode === 'video' && !videoFile)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-5 rounded-xl shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-tight"
                >
                    {isLoading ? 'Synthesizing...' : 'Run Intelligence'}
                </button>
            </div>
        </div>
    );
};

export default AnalyzePanel;
