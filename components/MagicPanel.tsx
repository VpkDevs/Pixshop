/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { BackgroundRemovalIcon, SparklesIcon, EraseIcon } from './icons';

interface MagicPanelProps {
  onRemoveBackground: () => void;
  onMagicFill: (prompt: string) => void;
  magicPrompt: string;
  onMagicPromptChange: (prompt: string) => void;
  isMasking: boolean;
  onToggleMasking: () => void;
  onClearMask: () => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  isLoading: boolean;
  hasMask: boolean;
}

const MagicPanel: React.FC<MagicPanelProps> = ({
  onRemoveBackground,
  onMagicFill,
  magicPrompt,
  onMagicPromptChange,
  isMasking,
  onToggleMasking,
  onClearMask,
  brushSize,
  onBrushSizeChange,
  isLoading,
  hasMask,
}) => {

  const handleMagicFillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMagicFill(magicPrompt);
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-6 animate-fade-in backdrop-blur-sm">
      {/* Remove Background Section */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
          <BackgroundRemovalIcon className="w-6 h-6" />
          Background Remover
        </h3>
        <p className="text-sm text-gray-400">Instantly remove the background from your image with a single click.</p>
        <button
          onClick={onRemoveBackground}
          disabled={isLoading}
          className="w-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-purple-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
          Remove Background
        </button>
      </div>

      <div className="w-full h-px bg-gray-700"></div>

      {/* Magic Fill Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
          <SparklesIcon className="w-6 h-6" />
          Magic Fill
        </h3>
        <p className="text-sm text-gray-400 -mt-2">Paint a mask over an area and describe what you want to generate.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-black/20 p-3 rounded-lg">
            <button
              onClick={onToggleMasking}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-md font-semibold transition-all duration-200 ${isMasking ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/30' : 'bg-white/10 hover:bg-white/20 text-gray-200'}`}
            >
              {isMasking ? 'Masking Enabled' : 'Draw Mask'}
            </button>
            <div className="flex items-center gap-3">
                <label htmlFor="brush-size" className="text-sm font-medium text-gray-400 whitespace-nowrap">Brush Size:</label>
                <input
                    id="brush-size"
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                    disabled={isLoading || !isMasking}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
            </div>
        </div>

        {isMasking && (
          <div className="animate-fade-in">
            <button
              onClick={onClearMask}
              disabled={isLoading || !hasMask}
              className="flex items-center justify-center w-full bg-white/10 text-gray-300 font-semibold py-2 px-4 rounded-md transition-colors hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <EraseIcon className="w-5 h-5 mr-2" />
              Clear Mask
            </button>
          </div>
        )}

        <form onSubmit={handleMagicFillSubmit} className="w-full flex items-center gap-2">
          <input
            type="text"
            value={magicPrompt}
            onChange={(e) => onMagicPromptChange(e.target.value)}
            placeholder={hasMask ? "e.g., 'a field of wildflowers'" : "First, draw a mask on the image"}
            className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
            disabled={isLoading || !isMasking}
          />
          <button
            type="submit"
            className="bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !magicPrompt.trim() || !hasMask}
          >
            Generate
          </button>
        </form>
      </div>
    </div>
  );
};

export default MagicPanel;
