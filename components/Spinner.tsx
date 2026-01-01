
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
        <div className="absolute w-12 h-12 rounded-full border-4 border-indigo-500/20 border-b-indigo-500 animate-spin-slow"></div>
        <div className="w-6 h-6 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></div>
        <style>{`
            @keyframes spin-slow {
                from { transform: rotate(360deg); }
                to { transform: rotate(0deg); }
            }
            .animate-spin-slow {
                animation: spin-slow 3s linear infinite;
            }
        `}</style>
    </div>
  );
};

export default Spinner;
