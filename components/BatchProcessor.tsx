
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
// Added BatchIcon to imports
import { UploadIcon, DownloadIcon, SparklesIcon, CheckIcon, XCircleIcon, EraseIcon, BatchIcon } from './icons';
import { generateFilteredImage, generateAdjustedImage, generateRemovedBackgroundImage } from '../services/geminiService';
import Spinner from './Spinner';

interface BatchItem {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'done' | 'error';
    resultUrl?: string;
    error?: string;
}

interface BatchProcessorProps {
    onBack: () => void;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ onBack }) => {
    const [items, setItems] = useState<BatchItem[]>([]);
    const [operation, setOperation] = useState<'filter' | 'adjust' | 'removeBg'>('filter');
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newItems: BatchItem[] = Array.from(e.target.files).map((file) => ({
                id: Math.random().toString(36).substr(2, 9),
                file: file as File,
                status: 'pending'
            }));
            setItems(prev => [...prev, ...newItems]);
        }
    };

    const processItem = async (item: BatchItem) => {
        try {
            let url = '';
            if (operation === 'removeBg') {
                url = await generateRemovedBackgroundImage(item.file);
            } else if (operation === 'filter') {
                url = await generateFilteredImage(item.file, prompt);
            } else if (operation === 'adjust') {
                url = await generateAdjustedImage(item.file, prompt);
            }
            return url;
        } catch (e) { throw e; }
    };

    const startBatch = async () => {
        if ((operation !== 'removeBg' && !prompt) || items.length === 0) return;
        setIsProcessing(true);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.status === 'done') continue;
            setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'processing' } : it));
            try {
                const resultUrl = await processItem(item);
                setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'done', resultUrl } : it));
            } catch (error: any) {
                setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'error', error: error.message } : it));
            }
        }
        setIsProcessing(false);
    };

    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `batch-${filename}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAll = () => {
        items.forEach(item => {
            if (item.resultUrl) handleDownload(item.resultUrl, item.file.name);
        });
    };

    const clearAll = () => {
        if (isProcessing) return;
        setItems([]);
    };

    return (
        <div className="w-full flex flex-col gap-6 animate-fade-in">
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] p-6 rounded-xl shadow-lg backdrop-blur-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tighter">
                            <BatchIcon className="w-7 h-7 text-blue-400" />
                            Batch Studio
                        </h2>
                        <p className="text-[var(--text-secondary)]">Automate edits for multiple images at once.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={clearAll} disabled={isProcessing || items.length === 0} className="bg-[var(--bg-panel-solid)] border border-[var(--border-color)] hover:text-red-400 hover:border-red-400 text-[var(--text-secondary)] px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-30">
                            Clear All
                        </button>
                        <label className="cursor-pointer bg-[var(--bg-panel-solid)] border border-[var(--border-color)] hover:border-[var(--accent-color)] text-[var(--text-primary)] px-4 py-2 rounded-lg font-bold transition-all">
                            <UploadIcon className="w-5 h-5 inline mr-2" />
                            Add Images
                            <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                        {items.some(i => i.status === 'done') && (
                            <button onClick={downloadAll} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg">
                                Download All
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Operation</label>
                        <select value={operation} onChange={(e) => setOperation(e.target.value as any)} className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg p-3 font-bold focus:ring-2 focus:ring-[var(--accent-color)] outline-none" disabled={isProcessing}>
                            <option value="filter">Artistic Filter</option>
                            <option value="adjust">Pro Adjustment</option>
                            <option value="removeBg">Remove Background</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">{operation === 'removeBg' ? 'Config' : 'Description'}</label>
                        <div className="flex gap-2">
                            <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={operation === 'removeBg' || isProcessing} placeholder={operation === 'removeBg' ? "No prompt needed for background removal" : "e.g. 'Retro film style'"} className="flex-grow bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg p-3 focus:ring-2 focus:ring-[var(--accent-color)] outline-none disabled:opacity-50" />
                            <button onClick={startBatch} disabled={isProcessing || (operation !== 'removeBg' && !prompt) || items.length === 0} className="bg-[var(--accent-color)] hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-black uppercase tracking-tight shadow-lg disabled:opacity-50 transition-all">
                                {isProcessing ? 'Working...' : 'Run'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {items.map(item => (
                    <div key={item.id} className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-md hover:bg-[var(--bg-panel-solid)] transition-all">
                        <div className="relative w-full md:w-48 h-48 shrink-0 bg-black/20 rounded-lg overflow-hidden border border-[var(--border-color)]">
                            <img src={URL.createObjectURL(item.file)} className="w-full h-full object-cover grayscale opacity-50" alt="original" />
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Original</span>
                        </div>
                        <div className="flex-grow flex flex-col items-center justify-center w-full h-48 bg-[var(--bg-input)] rounded-lg border border-[var(--border-color)] relative overflow-hidden">
                            {item.status === 'pending' && <span className="text-[var(--text-secondary)] font-bold">In Queue</span>}
                            {item.status === 'processing' && <Spinner />}
                            {item.status === 'error' && <div className="text-red-400 flex flex-col items-center text-center p-4"><XCircleIcon className="w-8 h-8 mb-2" /><span className="text-xs font-bold">{item.error}</span></div>}
                            {item.status === 'done' && item.resultUrl && (
                                <>
                                    <img src={item.resultUrl} className="w-full h-full object-contain" alt="result" />
                                    <button onClick={() => handleDownload(item.resultUrl!, item.file.name)} className="absolute bottom-3 right-3 bg-white/10 p-3 rounded-full shadow-lg hover:bg-green-500 hover:text-white transition-all border border-white/10"><DownloadIcon className="w-5 h-5" /></button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-24 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-panel)]/30">
                        <BatchIcon className="w-12 h-12 mb-4 opacity-20" />
                        <span className="font-bold">No images in batch queue.</span>
                     </div>
                )}
            </div>
        </div>
    );
};

export default BatchProcessor;
