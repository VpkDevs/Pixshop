/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { XCircleIcon, CheckIcon, SparklesIcon } from './icons';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div 
                    key={toast.id}
                    className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-lg shadow-xl border backdrop-blur-md flex items-start gap-3 animate-fade-in transform transition-all duration-300 ${
                        toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-100' :
                        toast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-100' :
                        'bg-blue-500/20 border-blue-500/50 text-blue-100'
                    }`}
                >
                    <div className="mt-0.5 shrink-0">
                        {toast.type === 'error' && <XCircleIcon className="w-5 h-5" />}
                        {toast.type === 'success' && <CheckIcon className="w-5 h-5" />}
                        {toast.type === 'info' && <SparklesIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-grow text-sm font-medium">
                        {toast.message}
                    </div>
                    <button 
                        onClick={() => removeToast(toast.id)}
                        className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <XCircleIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;