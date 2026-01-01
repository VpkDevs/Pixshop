/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DownloadIcon, XCircleIcon } from './icons';

interface ExportModalProps {
    image: File;
    onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ image, onClose }) => {
    const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
    const [quality, setQuality] = useState<number>(0.9);
    const [scale, setScale] = useState<number>(1);
    const [fileSize, setFileSize] = useState<string>('Calculating...');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const generatePreview = async () => {
            const img = new Image();
            img.src = URL.createObjectURL(image);
            await new Promise(r => img.onload = r);

            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const type = `image/${format}`;
                const dataUrl = canvas.toDataURL(type, quality);
                setPreviewUrl(dataUrl);
                
                // Estimate size
                const head = 'data:' + type + ';base64,';
                const size = Math.round((dataUrl.length - head.length) * 3 / 4);
                setFileSize((size / 1024).toFixed(2) + ' KB');
            }
        };
        generatePreview();
    }, [image, format, quality, scale]);

    const handleDownload = () => {
        if (previewUrl) {
            const link = document.createElement('a');
            link.href = previewUrl;
            link.download = `pixshop-export-${Date.now()}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[var(--bg-panel-solid)] border border-[var(--border-color)] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                
                {/* Preview Section */}
                <div className="w-full md:w-1/2 bg-[var(--bg-primary)] p-8 flex items-center justify-center border-r border-[var(--border-color)]">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg border border-[var(--border-color)]" />
                    ) : (
                        <div className="animate-pulse w-full h-48 bg-gray-700 rounded-lg"></div>
                    )}
                </div>

                {/* Controls Section */}
                <div className="w-full md:w-1/2 p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Export Image</h2>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            <XCircleIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Format</label>
                            <div className="flex gap-2">
                                {['png', 'jpeg', 'webp'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFormat(f as any)}
                                        className={`px-4 py-2 rounded-md text-sm font-semibold capitalize transition-all ${format === f ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {format !== 'png' && (
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Quality: {Math.round(quality * 100)}%</label>
                                <input 
                                    type="range" min="0.1" max="1" step="0.1" 
                                    value={quality} onChange={e => setQuality(parseFloat(e.target.value))} 
                                    className="w-full"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Scale: {scale}x</label>
                            <div className="flex gap-2">
                                {[0.5, 1, 2, 4].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setScale(s)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${scale === s ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
                         <div className="flex justify-between items-center mb-4 text-sm text-[var(--text-secondary)]">
                            <span>Estimated Size:</span>
                            <span className="font-mono text-[var(--text-primary)]">{fileSize}</span>
                         </div>
                         <button
                            onClick={handleDownload}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                         >
                            <DownloadIcon className="w-5 h-5" />
                            Export Image
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;