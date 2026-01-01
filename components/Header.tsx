
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SparklesIcon, BatchIcon, SunIcon, MoonIcon, EraseIcon } from './icons';

interface HeaderProps {
    mode: 'single' | 'batch';
    setMode: (mode: 'single' | 'batch') => void;
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
    onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode, theme, setTheme, onReset }) => {
  return (
    <header className="w-full py-4 px-6 md:px-10 border-b border-[var(--border-color)] bg-[var(--bg-panel)] backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={onReset}>
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                <SparklesIcon className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
                PIXSHOP
              </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[var(--bg-panel-solid)] p-1 rounded-lg border border-[var(--border-color)] flex items-center">
                <button
                    onClick={() => setMode('single')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'single' ? 'bg-[var(--accent-color)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                    Single
                </button>
                <button
                    onClick={() => setMode('batch')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'batch' ? 'bg-[var(--accent-color)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                    <BatchIcon className="w-4 h-4" />
                    Batch
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onReset}
                    className="p-2.5 rounded-full bg-[var(--bg-panel-solid)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-400 hover:border-red-400 transition-all shadow-sm active:scale-90"
                    title="Reset Session"
                >
                    <EraseIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2.5 rounded-full bg-[var(--bg-panel-solid)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)] transition-all shadow-sm active:scale-90"
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>
            </div>
          </div>
      </div>
    </header>
  );
};

export default Header;
