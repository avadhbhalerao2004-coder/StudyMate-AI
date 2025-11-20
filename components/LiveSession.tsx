import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Volume2, X, Play } from 'lucide-react';
import { logActivity } from '../utils/storage';

export const LiveSession: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState(0);
  
  // Audio Context and processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const animationRef = useRef<number>();

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
        // There isn't a clear disconnect method exposed on the session promise wrapper 
        // in the example, but we stop sending data.
        sessionRef.current = null;
    }
    if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setAudioVolume(0);
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const connect = async () => {
    setError(null);
    try {
        logActivity('live', 'Language Practice Session');
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Initialize Audio Contexts
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        // Setup Input Stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        
        const inputCtx = inputAudioContextRef.current;
        const source = inputCtx.createMediaStreamSource(stream);
        sourceRef.current = source;

        // Connect to Gemini Live
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setIsConnected(true);
                    console.log("Live session opened");
                    
                    // Start processing input audio
                    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                    processorRef.current = processor;
                    
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        
                        // Visualize volume
                        let sum = 0;
                        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                        const vol = Math.sqrt(sum / inputData.length);
                        setAudioVolume(Math.min(vol * 5, 1)); // Amplify for visual
                        
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    
                    source.connect(processor);
                    processor.connect(inputCtx.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && audioContextRef.current) {
                        const ctx = audioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        
                        const audioBuffer = await decodeAudioData(
                            decode(base64Audio),
                            ctx,
                            24000,
                            1
                        );
                        
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        
                        setIsSpeaking(true);
                        source.onended = () => setIsSpeaking(false);
                    }
                },
                onclose: () => {
                    setIsConnected(false);
                    console.log("Live session closed");
                },
                onerror: (err) => {
                    console.error("Live session error", err);
                    setError("Connection error. Please try again.");
                    cleanup();
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                systemInstruction: "You are a patient and helpful language tutor. Help the student practice by conversing naturally. Correct their grammar gently if needed, but focus on keeping the conversation flowing. Speak clearly.",
            }
        });
        
        sessionRef.current = sessionPromise;

    } catch (e) {
        console.error(e);
        setError("Could not access microphone or connect to AI.");
    }
  };

  // Helper Functions
  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50 to-white dark:from-dark-bg dark:to-dark-card rounded-2xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Live Language Tutor</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Practice your speaking skills in real-time. Have a natural conversation with AI to improve your fluency.
        </p>
      </div>

      {/* Visualizer Circle */}
      <div className="relative mb-12">
        {isConnected && (
            <div className="absolute inset-0 rounded-full bg-indigo-400 opacity-20 animate-ping"></div>
        )}
        <div 
            className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
            ${isConnected 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 scale-105' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            style={{
                transform: isConnected ? `scale(${1 + audioVolume * 0.5})` : 'scale(1)'
            }}
        >
            {isConnected ? (
                isSpeaking ? <Volume2 className="w-16 h-16 text-white animate-pulse" /> : <Mic className="w-16 h-16 text-white" />
            ) : (
                <MicOff className="w-16 h-16 text-gray-400" />
            )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
        </div>
      )}

      <button
        onClick={isConnected ? cleanup : connect}
        className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg transform hover:scale-105
            ${isConnected 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
      >
        {isConnected ? (
            <>
                <X size={24} /> End Session
            </>
        ) : (
            <>
                <Play size={24} /> Start Conversation
            </>
        )}
      </button>

      {isConnected && (
          <p className="mt-6 text-sm text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
              Listening... Speak now
          </p>
      )}
    </div>
  );
};