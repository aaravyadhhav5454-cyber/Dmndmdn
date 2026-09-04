import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Send,
  Loader2,
  Volume2,
} from 'lucide-react';

interface VoiceSphereProps {
  isRecording: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isModelSpeaking: boolean;
  isProcessing: boolean;
  isExecutingAction: boolean;
  inputEnergy: number;
  outputEnergy: number;
  onToggleMic: () => void;
  onInterrupt: () => void;
  onSendText: (text: string) => void;
  statusText: string;
}

export const VoiceSphere: React.FC<VoiceSphereProps> = ({
  isRecording,
  isConnected,
  isConnecting,
  isModelSpeaking,
  isProcessing,
  isExecutingAction,
  inputEnergy,
  outputEnergy,
  onToggleMic,
  onInterrupt,
  onSendText,
  statusText,
}) => {
  const [typedPrompt, setTypedPrompt] = useState('');

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedPrompt.trim()) return;
    onSendText(typedPrompt.trim());
    setTypedPrompt('');
  };

  // Determine sphere scale & colors based on active energy
  const activeEnergy = isModelSpeaking ? outputEnergy : inputEnergy;
  const sphereScale = 1 + activeEnergy * 0.45;

  return (
    <div className="flex flex-col items-center justify-center w-full py-8 sm:py-12 px-4 relative">
      {/* Background glow ambiance */}
      <div
        className={`absolute w-72 h-72 rounded-full filter blur-[90px] pointer-events-none transition-all duration-700 ${
          isModelSpeaking
            ? 'bg-rose-500/20'
            : isRecording
              ? 'bg-amber-500/20'
              : 'bg-indigo-600/10'
        }`}
      />

      {/* Central Visualizer Sphere */}
      <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 my-4">
        {/* Outer Ripple Rings */}
        {isRecording && (
          <>
            <motion.div
              animate={{
                scale: [1, 1.25, 1.45],
                opacity: [0.35, 0.15, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute inset-0 rounded-full border border-amber-400/30"
            />
            <motion.div
              animate={{
                scale: [1, 1.35, 1.6],
                opacity: [0.25, 0.1, 0],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                delay: 0.8,
                ease: 'easeOut',
              }}
              className="absolute inset-0 rounded-full border border-rose-400/20"
            />
          </>
        )}

        {/* Model Speaking Waves */}
        {isModelSpeaking && (
          <motion.div
            animate={{
              scale: [1, 1.3, 1.1, 1.4],
              opacity: [0.4, 0.1, 0.3, 0],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-indigo-500/20"
          />
        )}

        {/* Main Animated Sphere Orb */}
        <motion.div
          animate={{
            scale: sphereScale,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
          className={`relative z-10 w-40 h-40 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${
            isModelSpeaking
              ? 'bg-gradient-to-br from-rose-500 via-pink-600 to-amber-500 shadow-rose-500/40 text-white'
              : isExecutingAction
                ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 shadow-emerald-500/40 text-white'
                : isRecording
                  ? 'bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-700 shadow-amber-500/30 text-white'
                  : 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 shadow-slate-950/60 text-slate-400'
          }`}
        >
          {/* Internal Orb Graphic */}
          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none select-none">
            {isConnecting ? (
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            ) : isModelSpeaking ? (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="flex items-center justify-center"
              >
                <Volume2 className="w-10 h-10 text-white drop-shadow-md" />
              </motion.div>
            ) : isExecutingAction ? (
              <Sparkles className="w-10 h-10 text-white animate-bounce" />
            ) : isRecording ? (
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Mic className="w-10 h-10 text-white drop-shadow-md" />
              </motion.div>
            ) : (
              <MicOff className="w-10 h-10 text-slate-500" />
            )}

            {/* Name / Subtext */}
            <span className="text-xs font-semibold tracking-wider uppercase opacity-90">
              {isModelSpeaking
                ? 'Arushi Speaking'
                : isRecording
                  ? 'Listening'
                  : 'Tap to Start'}
            </span>
          </div>

          {/* Equalizer Bars when speaking or listening */}
          {(isRecording || isModelSpeaking) && (
            <div className="absolute bottom-4 flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => {
                const height = Math.max(
                  4,
                  Math.min(
                    22,
                    (activeEnergy * 35 * ((i % 2 === 0 ? 1.2 : 0.8) + Math.sin(i)))
                  )
                );
                return (
                  <motion.div
                    key={i}
                    animate={{ height }}
                    transition={{ duration: 0.1 }}
                    className="w-1 bg-white/80 rounded-full"
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Live Status Description */}
      <div className="flex flex-col items-center gap-1.5 text-center my-3 max-w-md">
        <p className="text-sm font-medium text-slate-200">{statusText}</p>
        <p className="text-xs text-slate-400">
          Speak in Hindi, English, or Hinglish â€” Arushi detects language automatically
        </p>
      </div>

      {/* Primary Voice Controls */}
      <div className="flex items-center gap-3 mt-3">
        {/* Main Microphone Button */}
        <button
          id="toggle-mic-btn"
          onClick={onToggleMic}
          disabled={isConnecting}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-medium text-sm transition-all shadow-lg active:scale-95 ${
            isRecording
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-amber-500/25'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Mute Microphone</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Start Voice Conversation</span>
            </>
          )}
        </button>

        {/* Interrupt button (active when Arushi is speaking) */}
        {isModelSpeaking && (
          <motion.button
            id="interrupt-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onInterrupt}
            className="flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 shadow-md transition-all active:scale-95"
            title="Interrupt Arushi while speaking"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Interrupt</span>
          </motion.button>
        )}
      </div>

      {/* Silent / Typed Query Fallback Form */}
      <form
        onSubmit={handleSendText}
        className="w-full max-w-md mt-6 flex items-center gap-2 bg-slate-900/70 border border-slate-800 focus-within:border-slate-700 rounded-xl p-1.5 shadow-inner"
      >
        <input
          id="text-query-input"
          type="text"
          value={typedPrompt}
          onChange={(e) => setTypedPrompt(e.target.value)}
          placeholder="Or type a command (e.g. 'WhatsApp kholo', 'Call Mom')..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <button
          id="send-text-btn"
          type="submit"
          disabled={!typedPrompt.trim()}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-colors"
          title="Send command"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
