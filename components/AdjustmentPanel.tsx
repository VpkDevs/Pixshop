
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  isLoading: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Auto-Fix', prompt: 'Automatically analyze the image and optimize exposure, white balance, contrast, and saturation for a professional finish.' },
    { name: 'Blur BG', prompt: 'Apply a realistic shallow depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.' },
    { name: 'Studio Light', prompt: 'Add dramatic, professional studio lighting from the side to the main subject, enhancing depth and shadows.' },
    { name: 'Vibrant', prompt: 'Subtly boost the colors and vibrancy across the entire image without losing skin tone naturalness.' },
    { name: 'B&W Contrast', prompt: 'Convert the image to a high-contrast black and white, reminiscent of classic silver-halide film photography.' },
    { name: 'Warm Glow', prompt: 'Adjust the lighting to add a soft, warm candle-light glow to all subjects in the image.' },
    { name: 'De-Noise', prompt: 'Remove digital noise and grain from the image while preserving sharp edges and fine textures.' },
    { name: 'Brighten', prompt: 'Gently increase exposure and lift the shadows to reveal more detail in dark areas.' },
  ];

  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApplyAdjustment(activePrompt);
    }
  };

  return (
    <div className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col gap-6 animate-fade-in backdrop-blur-md shadow-2xl">
      <div className="text-center">
          <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Pro Adjustments</h3>
          <p className="text-sm text-[var(--text-secondary)]">Enhance, fix, and optimize your image quality.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center border border-transparent font-bold py-4 px-3 rounded-xl transition-all duration-300 ease-in-out active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedPresetPrompt === preset.prompt 
                ? 'bg-[var(--accent-color)] text-white shadow-xl scale-[1.03]' 
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-panel-solid)] hover:text-[var(--text-primary)]'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 ml-1">Manual Adjustment Request</label>
          <input
            type="text"
            value={customPrompt}
            onChange={handleCustomChange}
            placeholder="e.g., 'Make it look like a rainy day' or 'Add motion blur'..."
            className="flex-grow bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-5 focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base shadow-inner"
            disabled={isLoading}
          />
      </div>

      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
            <button
                onClick={handleApply}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black py-5 px-6 rounded-xl transition-all duration-300 shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !activePrompt.trim()}
            >
                {isLoading ? 'Analyzing Exposure...' : 'Apply Correction'}
            </button>
        </div>
      )}
    </div>
  );
};

export default AdjustmentPanel;
