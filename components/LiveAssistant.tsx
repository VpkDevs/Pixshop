
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, Blob } from '@google/genai';
import { MicIcon, StopIcon, WaveformIcon, XCircleIcon } from './icons';

interface LiveAssistantProps {
    onClose: () => void;
    onApplyFilter: (filter: string) => void;
    onRemoveBackground: () => void;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose, onApplyFilter, onRemoveBackground }) => {
    const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'idle'>('connecting');
    const [transcript, setTranscript] = useState<string>('Initializing Live Session...');
    const [error, setError] = useState<string | null>(null);

    // Audio Contexts
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    // Tools
    const tools: FunctionDeclaration[] = [
        {
            name: 'applyFilter',
            description: 'Apply a visual filter to the image (e.g., retro, cyberpunk, anime).',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    filterName: { type: Type.STRING, description: 'The name or description of the filter' }
                },
                required: ['filterName']
            }
        },
        {
            name: 'removeBackground',
            description: 'Remove the background from the current image.',
            parameters: { type: Type.OBJECT, properties: {} }
        }
    ];

    useEffect(() => {
        const startSession = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                
                inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                
                // Input Stream
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
                const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
                
                // Connect Session
                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        systemInstruction: "You are a helpful creative assistant for a photo editing app. You can execute tools to edit images.",
                        tools: [{ functionDeclarations: tools }],
                    },
                    callbacks: {
                        onopen: () => {
                            setStatus('listening');
                            setTranscript("Listening... say 'Apply a retro filter'");
                        },
                        onmessage: async (msg: LiveServerMessage) => {
                            // Audio
                            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (audioData) {
                                setStatus('speaking');
                                playAudio(audioData);
                            }
                            // Tool Calls
                            if (msg.toolCall) {
                                for (const call of msg.toolCall.functionCalls) {
                                    setTranscript(`Executing: ${call.name}...`);
                                    let result = "Done";
                                    if (call.name === 'applyFilter') {
                                        const filter = (call.args as any).filterName;
                                        onApplyFilter(filter);
                                        result = `Applied filter: ${filter}`;
                                    } else if (call.name === 'removeBackground') {
                                        onRemoveBackground();
                                        result = "Background removed";
                                    }

                                    // Send Response
                                    sessionPromiseRef.current?.then(session => {
                                        session.sendToolResponse({
                                            functionResponses: {
                                                id: call.id,
                                                name: call.name,
                                                response: { result }
                                            }
                                        });
                                    });
                                }
                            }
                            
                            if (msg.serverContent?.turnComplete) {
                                setStatus('listening');
                            }
                        },
                        onclose: () => console.log('Session closed'),
                        onerror: (e) => {
                            console.error(e);
                            setError("Connection error");
                        }
                    }
                });

                // Audio Processing
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromiseRef.current?.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                
                source.connect(processor);
                processor.connect(inputContextRef.current.destination);

            } catch (e: any) {
                setError(e.message);
                setStatus('idle');
            }
        };

        startSession();

        return () => {
            // Cleanup
            streamRef.current?.getTracks().forEach(track => track.stop());
            inputContextRef.current?.close();
            outputContextRef.current?.close();
            // No explicit close method on session promise, depends on SDK
        };
    }, []);

    const createBlob = (data: Float32Array): Blob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        
        let binary = '';
        const len = int16.buffer.byteLength;
        const bytes = new Uint8Array(int16.buffer);
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return {
            data: btoa(binary),
            mimeType: 'audio/pcm;rate=16000'
        };
    };

    const playAudio = async (base64: string) => {
        if (!outputContextRef.current) return;
        
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for(let i=0; i<int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
        }

        const buffer = outputContextRef.current.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);

        const source = outputContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(outputContextRef.current.destination);
        
        const now = outputContextRef.current.currentTime;
        // Schedule next chunk
        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;
        
        sourcesRef.current.add(source);
        source.onended = () => {
            sourcesRef.current.delete(source);
            if(sourcesRef.current.size === 0) setStatus('listening');
        };
    };

    return (
        <div className="fixed bottom-24 right-6 z-50 animate-fade-in-up">
            <div className="bg-[var(--bg-panel-solid)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 w-80 backdrop-blur-md flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
                    <h3 className="font-bold flex items-center gap-2 text-[var(--text-primary)]">
                        <WaveformIcon className="w-5 h-5 text-blue-400" />
                        Live Partner
                    </h3>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-4 py-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'speaking' ? 'bg-blue-500 shadow-lg shadow-blue-500/50 scale-110' : status === 'listening' ? 'bg-red-500/20 border-2 border-red-500 animate-pulse' : 'bg-gray-700'}`}>
                         {status === 'speaking' ? <WaveformIcon className="w-10 h-10 text-white" /> : <MicIcon className="w-8 h-8 text-white" />}
                    </div>
                    <p className="text-center text-sm font-medium text-[var(--text-primary)]">
                        {error ? <span className="text-red-400">{error}</span> : transcript}
                    </p>
                </div>

                <div className="text-xs text-[var(--text-secondary)] text-center bg-[var(--bg-input)] p-2 rounded-lg">
                    Try: "Make it look vintage", "Remove background"
                </div>
            </div>
        </div>
    );
};

export default LiveAssistant;
