
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  isLoading: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Synthwave', prompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.' },
    { name: 'Anime', prompt: 'Give the image a vibrant Japanese anime style, with bold outlines, cel-shading, and saturated colors.' },
    { name: 'Cyberpunk', prompt: 'Apply a high-tech cyberpunk vibe with raining digital code, neon light reflections, and a dark blue night atmosphere.' },
    { name: 'Oil Painting', prompt: 'Transform this image into a classic oil painting with thick impasto brushstrokes and rich textures.' },
    { name: 'Polaroid', prompt: 'Give this photo a vintage 1970s Polaroid film look with soft edges, high grain, and slightly faded warm tones.' },
    { name: 'Cinematic', prompt: 'Apply a professional cinematic color grade (teal and orange) with dramatic contrast and anamorphic lens flare.' },
    { name: 'Ink Sketch', prompt: 'Convert this image into a detailed black and white ink sketch with fine hatching and cross-hatching details.' },
    { name: 'Golden Hour', prompt: 'Simulate the warm, soft, glowing light of the golden hour, enhancing oranges and long shadows.' },
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
      onApplyFilter(activePrompt);
    }
  };

  return (
    <div className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col gap-6 animate-fade-in backdrop-blur-md shadow-2xl">
      <div className="text-center">
          <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Artistic Styles</h3>
          <p className="text-sm text-[var(--text-secondary)]">Instantly transform the mood and aesthetic.</p>
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
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-panel-solid)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 ml-1">Custom Style Prompt</label>
          <input
            type="text"
            value={customPrompt}
            onChange={handleCustomChange}
            placeholder="e.g., '1940s film noir' or 'psychedelic 60s'..."
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
            {isLoading ? 'Processing Art...' : 'Render Filter'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
