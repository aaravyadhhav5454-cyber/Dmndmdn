import React from 'react';
import {
  PhoneCall,
  MessageCircle,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { ActionLogItem } from '../types';

interface ActionCardProps {
  action: ActionLogItem | null;
  onSelectDisambiguation?: (name: string, number: string) => void;
  onDismiss?: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  onSelectDisambiguation,
  onDismiss,
}) => {
  if (!action) return null;

  const isSuccess = action.status === 'executed';
  const isDisambiguation = action.status === 'disambiguation';
  const isFallback = action.status === 'fallback';
  const isFailed = action.status === 'failed';

  return (
    <div
      id={`action-card-${action.id}`}
      className="w-full max-w-lg mx-auto my-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Action Icon */}
        <div
          className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${
            action.type === 'whatsapp'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : action.type === 'call' || action.type === 'contact_call'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}
        >
          {action.type === 'whatsapp' ? (
            <MessageCircle className="w-5 h-5" />
          ) : action.type === 'call' || action.type === 'contact_call' ? (
            <PhoneCall className="w-5 h-5" />
          ) : (
            <ExternalLink className="w-5 h-5" />
          )}
        </div>

        {/* Action Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-100">
              {action.title}
            </h3>
            {/* Platform Tag */}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium flex items-center gap-1">
              <Smartphone className="w-2.5 h-2.5 text-indigo-400" />
              {action.platform}
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {action.details}
          </p>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {isSuccess ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                <CheckCircle2 className="w-3 h-3" />
                Action Executed
              </span>
            ) : isDisambiguation ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                <HelpCircle className="w-3 h-3" />
                Clarification Required
              </span>
            ) : isFallback ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/50">
                <ExternalLink className="w-3 h-3" />
                Browser Web Fallback
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
                <AlertTriangle className="w-3 h-3" />
                Unsupported on Browser
              </span>
            )}
          </div>

          {/* Disambiguation Buttons (e.g. for "Call Rahul") */}
          {isDisambiguation && onSelectDisambiguation && (
            <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-col gap-2">
              <p className="text-xs font-medium text-amber-300">
                Which contact did you mean?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    onSelectDisambiguation('Rahul Sharma', '+91 98111 22233')
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors"
                >
                  <PhoneCall className="w-3 h-3 text-emerald-400" />
                  <span>Rahul Sharma (Friend)</span>
                </button>
                <button
                  onClick={() =>
                    onSelectDisambiguation('Rahul Verma', '+91 98222 33344')
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors"
                >
                  <PhoneCall className="w-3 h-3 text-indigo-400" />
                  <span>Rahul Verma (Work)</span>
                </button>
              </div>
            </div>
          )}

          {/* Direct Launch / Re-trigger button for web fallback */}
          {action.url && (
            <div className="mt-3">
              <a
                href={action.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 underline"
              >
                <span>Tap to open link directly</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-500 hover:text-slate-300 text-xs p-1"
            title="Dismiss"
          >
            âœ•
          </button>
        )}
      </div>
    </div>
  );
};
