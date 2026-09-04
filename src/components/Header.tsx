import React from 'react';
import {
  Sparkles,
  Smartphone,
  Globe,
  Radio,
  BookUser,
  ShieldCheck,
  Languages,
} from 'lucide-react';
import { PlatformMode } from '../types';

interface HeaderProps {
  isConnected: boolean;
  isConnecting: boolean;
  platformMode: PlatformMode;
  detectedLanguage: string;
  onToggleContacts: () => void;
  onToggleBridge: () => void;
  isSimulated: boolean;
  onToggleSimulated: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  isConnecting,
  platformMode,
  detectedLanguage,
  onToggleContacts,
  onToggleBridge,
  isSimulated,
  onToggleSimulated,
}) => {
  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3.5 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-500/20">
            <Sparkles className="w-5 h-5" />
            {isConnected && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                Arushi
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/20 font-medium">
                Live Voice AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multilingual Voice Assistant & App Action Bridge
            </p>
          </div>
        </div>

        {/* Center/Status Badges */}
        <div className="hidden md:flex items-center gap-2.5 text-xs">
          {/* Active / Detected Language */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <span>Language:</span>
            <span className="font-semibold text-slate-100">
              {detectedLanguage || 'Auto (Hindi/Eng/Hinglish)'}
            </span>
          </div>

          {/* Connection Status */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                : isConnecting
                  ? 'bg-amber-950/40 border-amber-700/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                isConnected
                  ? 'animate-pulse text-emerald-400'
                  : isConnecting
                    ? 'animate-spin text-amber-400'
                    : 'text-slate-500'
              }`}
            />
            <span>
              {isConnected
                ? 'Gemini Live: Online'
                : isConnecting
                  ? 'Connecting...'
                  : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Platform Bridge Mode Toggle */}
          <button
            id="platform-bridge-btn"
            onClick={onToggleSimulated}
            title={
              isSimulated
                ? 'Simulating Android Native Bridge (APK mode)'
                : 'Running in Web Browser mode (Deep links fallback)'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              platformMode === 'native' || isSimulated
                ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-200 hover:bg-indigo-900/60'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {platformMode === 'native' || isSimulated ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Android Bridge</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 rounded text-indigo-300">
                  APK
                </span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Platform: Web</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-700 rounded text-slate-400">
                  Browser
                </span>
              </>
            )}
          </button>

          {/* Contacts Drawer Button */}
          <button
            id="contacts-drawer-btn"
            onClick={onToggleContacts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
          >
            <BookUser className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Contacts</span>
          </button>

          {/* Bridge Inspector Button */}
          <button
            id="bridge-inspector-btn"
            onClick={onToggleBridge}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Bridge Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
