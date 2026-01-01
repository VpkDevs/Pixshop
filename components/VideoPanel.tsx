/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { VideoIcon, SparklesIcon } from './icons';

interface VideoPanelProps {
    onGenerateVideo: (prompt: string, ratio: '16:9' | '9:16', useImage: boolean) => void;
    isLoading: boolean;
    hasImage: boolean;
}

const VideoPanel: React.FC<VideoPanelProps> = ({ onGenerateVideo, isLoading, hasImage }) => {
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [prompt, setPrompt] = useState('');
    const [ratio, setRatio] = useState<'16:9' | '9:16'>('16:9');
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
                <h3 className="text-xl font-bold mb-4">Connect to Veo</h3>
                <p className="mb-6 text-[var(--text-secondary)]">Video generation requires a connected Google Cloud project with billing.</p>
                <button onClick={handleConnect} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg">
                    Connect for Video
                </button>
            </div>
        );
    }

    return (
        <div className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl p-6 animate-fade-in backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)] flex items-center gap-2">
                <VideoIcon className="w-6 h-6 text-purple-400" />
                Motion Studio (Veo)
            </h2>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setMode('text')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${mode === 'text' ? 'bg-purple-600 text-white shadow-lg' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}
                >
                    Text to Video
                </button>
                <button
                    onClick={() => setMode('image')}
                    disabled={!hasImage}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${mode === 'image' ? 'bg-purple-600 text-white shadow-lg' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'} ${!hasImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Animate Image
                </button>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Aspect Ratio</label>
                <div className="flex gap-4">
                    <button onClick={() => setRatio('16:9')} className={`px-4 py-2 rounded-lg border transition-all ${ratio === '16:9' ? 'border-purple-500 bg-purple-500/20 text-purple-200' : 'border-[var(--border-color)] bg-[var(--bg-input)]'}`}>
                        16:9 (Landscape)
                    </button>
                    <button onClick={() => setRatio('9:16')} className={`px-4 py-2 rounded-lg border transition-all ${ratio === '9:16' ? 'border-purple-500 bg-purple-500/20 text-purple-200' : 'border-[var(--border-color)] bg-[var(--bg-input)]'}`}>
                        9:16 (Portrait)
                    </button>
                </div>
            </div>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'text' ? "A neon hologram of a cat driving at top speed..." : "Describe the motion (e.g. 'camera pans right, water flows'). Optional."}
                className="w-full h-24 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-4 mb-4 focus:ring-2 focus:ring-purple-500 outline-none text-[var(--text-primary)]"
                disabled={isLoading}
            />

            <button
                onClick={() => onGenerateVideo(prompt, ratio, mode === 'image')}
                disabled={isLoading || (mode === 'text' && !prompt.trim())}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isLoading ? <span className="animate-pulse">Generating Video (this takes time)...</span> : (
                    <>
                        <SparklesIcon className="w-5 h-5" />
                        Generate Video
                    </>
                )}
            </button>
        </div>
    );
};

export default VideoPanel;
