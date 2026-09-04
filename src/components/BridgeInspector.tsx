import React from 'react';
import {
  Smartphone,
  Globe,
  ShieldCheck,
  CheckCircle2,
  X,
  Trash2,
  Terminal,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { ActionLogItem, PlatformMode } from '../types';

interface BridgeInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  platformMode: PlatformMode;
  isSimulated: boolean;
  onToggleSimulated: () => void;
  logs: ActionLogItem[];
  onClearLogs: () => void;
}

export const BridgeInspector: React.FC<BridgeInspectorProps> = ({
  isOpen,
  onClose,
  platformMode,
  isSimulated,
  onToggleSimulated,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl p-4 sm:p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              Android Bridge Inspector
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Architecture Status */}
        <div className="my-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Runtime Platform
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                platformMode === 'native' || isSimulated
                  ? 'bg-indigo-950 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
            >
              {platformMode === 'native' || isSimulated
                ? 'Android APK Wrapper (Active)'
                : 'Standard Web Browser'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {platformMode === 'native' || isSimulated
              ? 'Actions execute through direct Android Intents via JavaScriptInterface (window.AndroidBridge).'
              : 'Actions execute using browser deep-links (whatsapp://, tel:, web URLs). Device settings are safely sandboxed.'}
          </p>

          {/* Simulator Toggle */}
          <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-200">
                Simulate Android APK Bridge
              </div>
              <div className="text-[11px] text-slate-400">
                Test native Android bridge responses in browser
              </div>
            </div>
            <button
              onClick={onToggleSimulated}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isSimulated
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {isSimulated ? 'APK Mode: ON' : 'APK Mode: OFF'}
            </button>
          </div>
        </div>

        {/* Specification Functions Checklist */}
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Bridge Functions Specification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              {
                name: 'openWhatsApp()',
                desc: 'Deep-link or Android Intent',
              },
              {
                name: 'makeCall(phoneNumber)',
                desc: 'Direct dialer / Intent',
              },
              {
                name: 'callContact(contactName)',
                desc: 'Contact query & disambiguation',
              },
              {
                name: 'openApp(appName)',
                desc: 'Package or web portal',
              },
              {
                name: 'openUrl(url)',
                desc: 'Secure browser navigation',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono font-semibold text-slate-200">
                    {f.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Logs Feed */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              Action Execution Logs ({logs.length})
            </h3>
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200">
                    {log.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-300">{log.details}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-indigo-300 font-mono">
                    {log.platform}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      log.status === 'executed'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : log.status === 'disambiguation'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {log.status}
                  </span>
                  {log.url && (
                    <a
                      href={log.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-indigo-400 hover:underline inline-flex items-center gap-0.5 ml-auto"
                    >
                      <span>link</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-500">
                No actions triggered yet. Speak or click a test prompt to see live bridge executions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
