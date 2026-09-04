export interface Contact {
  id: string;
  name: string;
  number: string;
  relation?: string;
  category?: 'family' | 'work' | 'friends' | 'emergency';
  avatar?: string;
}

export type PlatformMode = 'browser' | 'native';

export type ActionType = 'whatsapp' | 'call' | 'contact_call' | 'app' | 'url';

export interface ActionLogItem {
  id: string;
  timestamp: Date;
  type: ActionType;
  title: string;
  target: string;
  status: 'executed' | 'fallback' | 'failed' | 'disambiguation';
  platform: 'Android Native Bridge' | 'Web Deep-Link';
  details: string;
  url?: string;
  rawArgs?: any;
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'arushi' | 'system';
  text?: string;
  language?: string;
  timestamp: Date;
  actionItem?: ActionLogItem;
}

export interface NativeBridgeInterface {
  openApp?: (appName: string) => boolean | string;
  makeCall?: (phoneNumber: string) => boolean | string;
  callContact?: (contactName: string) => string;
  searchContacts?: (query: string) => string;
  openWhatsApp?: () => boolean | string;
  openUrl?: (url: string) => boolean | string;
  isNative?: () => boolean;
}

declare global {
  interface Window {
    AndroidBridge?: NativeBridgeInterface;
    Android?: NativeBridgeInterface;
    ArushiNative?: NativeBridgeInterface;
  }
}
