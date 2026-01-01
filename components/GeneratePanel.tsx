/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { AspectRatio, ImageSize } from '../types';
import { SparklesIcon } from './icons';

interface GeneratePanelProps {
    onGenerate: (prompt: string, ratio: AspectRatio, size: ImageSize) => void;
    isLoading: boolean;
}

const GeneratePanel: React.FC<GeneratePanelProps> = ({ onGenerate, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [ratio, setRatio] = useState<AspectRatio>('1:1');
    const [size, setSize] = useState<ImageSize>('1K');
    const [apiKeyReady, setApiKeyReady] = useState(false);

    React.useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setApiKeyReady(true);
            }
        };
        checkKey();
    }, []);

    const handleConnect = async () => {
        try {
            await window.aistudio.openSelectKey();
            setApiKeyReady(true);
        } catch (e) {
            console.error(e);
        }
    };

    if (!apiKeyReady) {
        return (
            <div className="w-full bg-[var(--bg-panel)] p-8 rounded-xl border border-[var(--border-color)] text-center">
                <h3 className="text-xl font-bold mb-4">Connect to Gemini 3 Pro</h3>
                <p className="mb-6 text-[var(--text-secondary)]">To use high-fidelity image generation, please connect your paid API key.</p>
                <button onClick={handleConnect} className="bg-[var(--accent-color)] text-white px-6 py-3 rounded-lg font-bold">
                    Connect Google Account
                </button>
            </div>
        );
    }

    return (
        <div className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl p-6 animate-fade-in backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Studio Generation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Aspect Ratio</label>
                    <div className="flex flex-wrap gap-2">
                        {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map(r => (
                            <button
                                key={r}
                                onClick={() => setRatio(r)}
                                className={`px-3 py-1.5 rounded-md text-sm transition-all ${ratio === r ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-input)] border border-[var(--border-color)]'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Resolution (Pro)</label>
                    <div className="flex gap-2">
                        {(['1K', '2K', '4K'] as ImageSize[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setSize(s)}
                                className={`px-3 py-1.5 rounded-md text-sm transition-all ${size === s ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-input)] border border-[var(--border-color)]'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create in vivid detail..."
                className="w-full h-32 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-4 mb-4 focus:ring-2 focus:ring-[var(--accent-color)] outline-none text-[var(--text-primary)]"
                disabled={isLoading}
            />

            <button
                onClick={() => onGenerate(prompt, ratio, size)}
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
        </div>
    );
};

export default GeneratePanel;
