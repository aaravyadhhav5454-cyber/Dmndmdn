import React from 'react';
import {
  MessageSquare,
  Phone,
  Share2,
  Tv,
  Camera,
  Languages,
  Sparkles,
} from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

interface TestPrompt {
  id: string;
  label: string;
  category: 'multilingual' | 'action' | 'call';
  icon: React.ReactNode;
}

const TEST_PROMPTS: TestPrompt[] = [
  {
    id: 't1',
    label: 'Hello Arushi',
    category: 'multilingual',
    icon: <Sparkles className="w-3 h-3 text-amber-400" />,
  },
  {
    id: 't2',
    label: 'Hindi mein baat karo',
    category: 'multilingual',
    icon: <Languages className="w-3 h-3 text-rose-400" />,
  },
  {
    id: 't3',
    label: 'Talk to me in English',
    category: 'multilingual',
    icon: <Languages className="w-3 h-3 text-indigo-400" />,
  },
  {
    id: 't4',
    label: 'Hinglish mein baat karo',
    category: 'multilingual',
    icon: <Languages className="w-3 h-3 text-emerald-400" />,
  },
  {
    id: 't5',
    label: 'WhatsApp kholo',
    category: 'action',
    icon: <Share2 className="w-3 h-3 text-emerald-400" />,
  },
  {
    id: 't6',
    label: 'Open WhatsApp',
    category: 'action',
    icon: <Share2 className="w-3 h-3 text-emerald-400" />,
  },
  {
    id: 't7',
    label: 'Mummy ko call karo',
    category: 'call',
    icon: <Phone className="w-3 h-3 text-rose-400" />,
  },
  {
    id: 't8',
    label: 'Call Rahul (2 matches test)',
    category: 'call',
    icon: <Phone className="w-3 h-3 text-amber-400" />,
  },
  {
    id: 't9',
    label: 'Call 9876543210',
    category: 'call',
    icon: <Phone className="w-3 h-3 text-indigo-400" />,
  },
  {
    id: 't10',
    label: 'Open YouTube',
    category: 'action',
    icon: <Tv className="w-3 h-3 text-red-400" />,
  },
  {
    id: 't11',
    label: 'Open Instagram',
    category: 'action',
    icon: <Camera className="w-3 h-3 text-pink-400" />,
  },
  {
    id: 't12',
    label: 'Open Settings',
    category: 'action',
    icon: <MessageSquare className="w-3 h-3 text-slate-400" />,
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSelectPrompt,
  disabled,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Test Specification Prompts
        </span>
        <span className="text-[11px] text-slate-500">
          Click any prompt to test Arushi's voice & actions
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {TEST_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            id={`quick-prompt-${prompt.id}`}
            disabled={disabled}
            onClick={() => {
              // Clean label for sending (strip helper annotations like "(2 matches test)")
              const cleanPrompt = prompt.label.replace(/\(.*?\)/g, '').trim();
              onSelectPrompt(cleanPrompt);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            {prompt.icon}
            <span>{prompt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
