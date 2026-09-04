import { ActionLogItem, Contact, PlatformMode } from '../types';

export const DEFAULT_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Mom',
    number: '+91 98765 43210',
    relation: 'Mummy / Mother / Maa',
    category: 'family',
  },
  {
    id: 'c2',
    name: 'Dad',
    number: '+91 98765 43211',
    relation: 'Papa / Father',
    category: 'family',
  },
  {
    id: 'c3',
    name: 'Rahul Sharma',
    number: '+91 98111 22233',
    relation: 'Friend / College',
    category: 'friends',
  },
  {
    id: 'c4',
    name: 'Rahul Verma',
    number: '+91 98222 33344',
    relation: 'Colleague / Office',
    category: 'work',
  },
  {
    id: 'c5',
    name: 'Priya Patel',
    number: '+91 98333 44455',
    relation: 'Sister / Didi',
    category: 'family',
  },
  {
    id: 'c6',
    name: 'Emergency Services',
    number: '112',
    relation: 'Police / Ambulance / National Emergency',
    category: 'emergency',
  },
];

let simulatedBridgeActive = false;

export function setSimulatedBridge(active: boolean) {
  simulatedBridgeActive = active;
}

export function isSimulatedBridge(): boolean {
  return simulatedBridgeActive;
}

export function isNativeBridgeAvailable(): boolean {
  if (simulatedBridgeActive) return true;
  return Boolean(
    window.AndroidBridge?.isNative?.() ||
      window.AndroidBridge?.openApp ||
      window.Android?.openApp ||
      window.ArushiNative?.openApp
  );
}

export function getActiveBridge(): any {
  if (window.AndroidBridge) return window.AndroidBridge;
  if (window.Android) return window.Android;
  if (window.ArushiNative) return window.ArushiNative;
  return null;
}

export interface ActionResult {
  success: boolean;
  status: 'executed' | 'fallback' | 'failed' | 'disambiguation';
  message: string;
  logItem: ActionLogItem;
  rawResponse: Record<string, any>;
}

// Map common app aliases to package names / web URLs
const APP_REGISTRY: Record<
  string,
  {
    name: string;
    packageName: string;
    webUrl: string;
    deepLink?: string;
    category: string;
  }
> = {
  youtube: {
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    webUrl: 'https://www.youtube.com',
    deepLink: 'vnd.youtube://',
    category: 'video',
  },
  instagram: {
    name: 'Instagram',
    packageName: 'com.instagram.android',
    webUrl: 'https://www.instagram.com',
    deepLink: 'instagram://',
    category: 'social',
  },
  whatsapp: {
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    webUrl: 'https://web.whatsapp.com',
    deepLink: 'whatsapp://',
    category: 'messaging',
  },
  chrome: {
    name: 'Google Chrome',
    packageName: 'com.android.chrome',
    webUrl: 'https://www.google.com',
    deepLink: 'googlechrome://',
    category: 'browser',
  },
  settings: {
    name: 'Device Settings',
    packageName: 'com.android.settings',
    webUrl: '',
    category: 'system',
  },
  maps: {
    name: 'Google Maps',
    packageName: 'com.google.android.apps.maps',
    webUrl: 'https://maps.google.com',
    deepLink: 'geo:0,0?q=',
    category: 'navigation',
  },
  camera: {
    name: 'Camera',
    packageName: 'com.android.camera',
    webUrl: '',
    category: 'media',
  },
  calculator: {
    name: 'Calculator',
    packageName: 'com.google.android.calculator',
    webUrl: '',
    category: 'utility',
  },
  spotify: {
    name: 'Spotify',
    packageName: 'com.spotify.music',
    webUrl: 'https://open.spotify.com',
    deepLink: 'spotify://',
    category: 'music',
  },
};

/**
 * Execute Open WhatsApp action
 */
export function executeOpenWhatsApp(
  args: { message?: string; phoneNumber?: string } = {}
): ActionResult {
  const isNative = isNativeBridgeAvailable();
  const bridge = getActiveBridge();
  const cleanPhone = (args.phoneNumber || '').replace(/[^\d+]/g, '');
  const encodedMsg = encodeURIComponent(args.message || '');

  let deepLink = 'whatsapp://';
  let webUrl = 'https://web.whatsapp.com';

  if (cleanPhone) {
    deepLink = `whatsapp://send?phone=${cleanPhone}${encodedMsg ? `&text=${encodedMsg}` : ''}`;
    webUrl = `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
  } else if (encodedMsg) {
    deepLink = `whatsapp://send?text=${encodedMsg}`;
    webUrl = `https://wa.me/?text=${encodedMsg}`;
  }

  if (isNative && bridge?.openWhatsApp) {
    try {
      bridge.openWhatsApp();
      const logItem: ActionLogItem = {
        id: 'act_' + Date.now(),
        timestamp: new Date(),
        type: 'whatsapp',
        title: 'Open WhatsApp',
        target: 'WhatsApp Android App',
        status: 'executed',
        platform: 'Android Native Bridge',
        details: 'Invoked native Android WhatsApp Intent.',
        rawArgs: args,
      };
      return {
        success: true,
        status: 'executed',
        message: 'WhatsApp launched via native Android Intent.',
        logItem,
        rawResponse: {
          status: 'success',
          action: 'openWhatsApp',
          platform: 'android_native',
          executed: true,
        },
      };
    } catch (e) {
      console.warn('Native openWhatsApp call failed:', e);
    }
  }

  // Browser / Web fallback
  let windowOpened = false;
  try {
    const w = window.open(deepLink, '_blank');
    if (!w || w.closed || typeof w.closed === 'undefined') {
      window.open(webUrl, '_blank');
    }
    windowOpened = true;
  } catch (err) {
    console.warn('Window open deepLink failed, falling back:', err);
    window.location.href = webUrl;
    windowOpened = true;
  }

  const logItem: ActionLogItem = {
    id: 'act_' + Date.now(),
    timestamp: new Date(),
    type: 'whatsapp',
    title: 'Open WhatsApp',
    target: webUrl,
    status: windowOpened ? 'executed' : 'fallback',
    platform: 'Web Deep-Link',
    details: 'Opened WhatsApp deep-link / web portal in new window.',
    url: webUrl,
    rawArgs: args,
  };

  return {
    success: true,
    status: windowOpened ? 'executed' : 'fallback',
    message: 'WhatsApp opened via web deep-link.',
    logItem,
    rawResponse: {
      status: 'success',
      action: 'openWhatsApp',
      platform: 'browser_deep_link',
      url: webUrl,
      executed: true,
    },
  };
}

/**
 * Execute Open App action
 */
export function executeOpenApp(appNameRaw: string): ActionResult {
  const isNative = isNativeBridgeAvailable();
  const bridge = getActiveBridge();
  const query = (appNameRaw || '').toLowerCase().trim();

  // Route to WhatsApp if requested
  if (query.includes('whatsapp')) {
    return executeOpenWhatsApp();
  }

  // Find in registry
  let matchedKey = Object.keys(APP_REGISTRY).find(
    (k) => query.includes(k) || k.includes(query)
  );
  const appInfo = matchedKey ? APP_REGISTRY[matchedKey] : null;
  const displayName = appInfo?.name || appNameRaw;

  // Settings in browser check
  if (query.includes('setting')) {
    if (isNative && bridge?.openApp) {
      bridge.openApp('settings');
      const logItem: ActionLogItem = {
        id: 'act_' + Date.now(),
        timestamp: new Date(),
        type: 'app',
        title: 'Open Settings',
        target: 'com.android.settings',
        status: 'executed',
        platform: 'Android Native Bridge',
        details: 'Opened native Android system settings intent.',
      };
      return {
        success: true,
        status: 'executed',
        message: 'Opened device settings on Android.',
        logItem,
        rawResponse: {
          status: 'success',
          app: 'settings',
          platform: 'android_native',
          executed: true,
        },
      };
    } else {
      // Browser cannot open Android system settings
      const logItem: ActionLogItem = {
        id: 'act_' + Date.now(),
        timestamp: new Date(),
        type: 'app',
        title: 'Open Settings',
        target: 'Device Settings',
        status: 'failed',
        platform: 'Web Deep-Link',
        details:
          'Browser security prevents opening device settings directly. Requires Android APK native bridge wrapper.',
      };
      return {
        success: false,
        status: 'failed',
        message:
          'Device settings can only be opened when running inside the Android APK with native bridge. Web browsers do not have access to OS settings.',
        logItem,
        rawResponse: {
          status: 'unsupported_on_browser',
          app: 'settings',
          platform: 'web_browser',
          executed: false,
          reason:
            'Browser security sandbox prohibits opening device settings without Android APK native bridge.',
        },
      };
    }
  }

  // Native bridge execution for other apps
  if (isNative && bridge?.openApp) {
    const target = appInfo?.packageName || query;
    try {
      bridge.openApp(target);
      const logItem: ActionLogItem = {
        id: 'act_' + Date.now(),
        timestamp: new Date(),
        type: 'app',
        title: `Open ${displayName}`,
        target,
        status: 'executed',
        platform: 'Android Native Bridge',
        details: `Launched package ${target} via native bridge.`,
      };
      return {
        success: true,
        status: 'executed',
        message: `Opened ${displayName} via Android Native Bridge.`,
        logItem,
        rawResponse: {
          status: 'success',
          app: displayName,
          packageName: target,
          platform: 'android_native',
          executed: true,
        },
      };
    } catch (e) {
      console.warn('Native openApp failed:', e);
    }
  }

  // Web fallback
  if (appInfo?.webUrl) {
    window.open(appInfo.webUrl, '_blank');
    const logItem: ActionLogItem = {
      id: 'act_' + Date.now(),
      timestamp: new Date(),
      type: 'app',
      title: `Open ${displayName}`,
      target: appInfo.webUrl,
      status: 'executed',
      platform: 'Web Deep-Link',
      details: `Opened ${displayName} web service at ${appInfo.webUrl}.`,
      url: appInfo.webUrl,
    };
    return {
      success: true,
      status: 'executed',
      message: `Opened ${displayName} in browser.`,
      logItem,
      rawResponse: {
        status: 'success',
        app: displayName,
        url: appInfo.webUrl,
        platform: 'browser_deep_link',
        executed: true,
      },
    };
  }

  // Generic web search for unknown app
  const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(
    appNameRaw + ' app'
  )}`;
  window.open(fallbackUrl, '_blank');
  const logItem: ActionLogItem = {
    id: 'act_' + Date.now(),
    timestamp: new Date(),
    type: 'app',
    title: `Find ${appNameRaw}`,
    target: fallbackUrl,
    status: 'fallback',
    platform: 'Web Deep-Link',
    details: `App not found in local registry; navigated to web search.`,
    url: fallbackUrl,
  };
  return {
    success: true,
    status: 'fallback',
    message: `Navigated to ${appNameRaw} search.`,
    logItem,
    rawResponse: {
      status: 'fallback',
      app: appNameRaw,
      url: fallbackUrl,
      executed: true,
    },
  };
}

/**
 * Execute Open URL action
 */
export function executeOpenUrl(urlRaw: string): ActionResult {
  let targetUrl = urlRaw.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  const isNative = isNativeBridgeAvailable();
  const bridge = getActiveBridge();

  if (isNative && bridge?.openUrl) {
    try {
      bridge.openUrl(targetUrl);
    } catch (e) {
      window.open(targetUrl, '_blank');
    }
  } else {
    window.open(targetUrl, '_blank');
  }

  const logItem: ActionLogItem = {
    id: 'act_' + Date.now(),
    timestamp: new Date(),
    type: 'url',
    title: 'Open Web Link',
    target: targetUrl,
    status: 'executed',
    platform: isNative ? 'Android Native Bridge' : 'Web Deep-Link',
    details: `Navigated to ${targetUrl}.`,
    url: targetUrl,
  };

  return {
    success: true,
    status: 'executed',
    message: `Opened link: ${targetUrl}`,
    logItem,
    rawResponse: {
      status: 'success',
      url: targetUrl,
      executed: true,
    },
  };
}

/**
 * Execute Make Call action (by phone number)
 */
export function executeMakeCall(phoneNumberRaw: string): ActionResult {
  const isNative = isNativeBridgeAvailable();
  const bridge = getActiveBridge();
  const cleanNumber = phoneNumberRaw.replace(/[^\d+]/g, '');

  if (!cleanNumber) {
    const logItem: ActionLogItem = {
      id: 'act_' + Date.now(),
      timestamp: new Date(),
      type: 'call',
      title: 'Phone Call Failed',
      target: phoneNumberRaw,
      status: 'failed',
      platform: 'Web Deep-Link',
      details: 'No valid phone number provided.',
    };
    return {
      success: false,
      status: 'failed',
      message: 'Invalid phone number provided.',
      logItem,
      rawResponse: {
        status: 'error',
        message: 'Invalid or empty phone number.',
        executed: false,
      },
    };
  }

  if (isNative && bridge?.makeCall) {
    try {
      bridge.makeCall(cleanNumber);
      const logItem: ActionLogItem = {
        id: 'act_' + Date.now(),
        timestamp: new Date(),
        type: 'call',
        title: `Calling ${cleanNumber}`,
        target: cleanNumber,
        status: 'executed',
        platform: 'Android Native Bridge',
        details: `Dispatched Android ACTION_CALL / ACTION_DIAL intent for ${cleanNumber}.`,
      };
      return {
        success: true,
        status: 'executed',
        message: `Calling ${cleanNumber} via Android Native Bridge.`,
        logItem,
        rawResponse: {
          status: 'calling',
          phoneNumber: cleanNumber,
          platform: 'android_native_intent',
          executed: true,
        },
      };
    } catch (e) {
      console.warn('Native makeCall failed:', e);
    }
  }

  // Browser tel: trigger
  const telUrl = `tel:${cleanNumber}`;
  // Using anchor click to trigger system dialer safely without page navigation
  const a = document.createElement('a');
  a.href = telUrl;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  const logItem: ActionLogItem = {
    id: 'act_' + Date.now(),
    timestamp: new Date(),
    type: 'call',
    title: `Dialing ${cleanNumber}`,
    target: cleanNumber,
    status: 'executed',
    platform: 'Web Deep-Link',
    details: `Triggered device telephone dialer with number pre-filled (${telUrl}).`,
    url: telUrl,
  };

  return {
    success: true,
    status: 'executed',
    message: `Pre-filled phone dialer for ${cleanNumber}.`,
    logItem,
    rawResponse: {
      status: 'calling',
      phoneNumber: cleanNumber,
      platform: 'browser_tel_dialer',
      executed: true,
    },
  };
}

/**
 * Execute Call Contact action (by contact name)
 */
export function executeCallContact(
  contactNameRaw: string,
  contacts: Contact[] = DEFAULT_CONTACTS
): ActionResult {
  const query = (contactNameRaw || '').toLowerCase().trim();
  if (!query) {
    return {
      success: false,
      status: 'failed',
      message: 'Contact name was empty.',
      logItem: {
        id: 'act_' + Date.now(),
        timestamp: new Date(),
        type: 'contact_call',
        title: 'Call Contact Failed',
        target: 'Unknown',
        status: 'failed',
        platform: 'Web Deep-Link',
        details: 'No contact name specified.',
      },
      rawResponse: {
        status: 'error',
        message: 'No contact name provided.',
        executed: false,
      },
    };
  }

  // Relation synonyms in Indian context
  const momAliases = ['mom', 'mummy', 'mother', 'maa', 'ammi', 'aai', 'mataji'];
  const dadAliases = ['dad', 'father', 'papa', 'pitaji', 'baba', 'abbu'];

  // Check if query is alias for Mom/Dad
  const isMom = momAliases.some((alias) => query.includes(alias));
  const isDad = dadAliases.some((alias) => query.includes(alias));

  // Find matches
  const matches = contacts.filter((c) => {
    const cName = c.name.toLowerCase();
    const cRel = (c.relation || '').toLowerCase();

    if (isMom && (cName.includes('mom') || cRel.includes('mummy') || cRel.includes('mother'))) {
      return true;
    }
    if (isDad && (cName.includes('dad') || cRel.includes('father') || cRel.includes('papa'))) {
      return true;
    }

    // Exact word match or inclusion
    return cName.includes(query) || cRel.includes(query) || query.includes(cName);
  });

  // Case 1: Multiple matches (disambiguation required - e.g. "Call Rahul")
  if (matches.length > 1) {
    const matchNames = matches.map((m) => m.name).join(' and ');
    const logItem: ActionLogItem = {
      id: 'act_' + Date.now(),
      timestamp: new Date(),
      type: 'contact_call',
      title: `Multiple matches for "${contactNameRaw}"`,
      target: matchNames,
      status: 'disambiguation',
      platform: isNativeBridgeAvailable()
        ? 'Android Native Bridge'
        : 'Web Deep-Link',
      details: `Found ${matches.length} contacts matching '${contactNameRaw}': ${matchNames}. Requesting user clarification.`,
    };

    return {
      success: false,
      status: 'disambiguation',
      message: `Found ${matches.length} contacts for ${contactNameRaw}: ${matchNames}. Please ask the user which one they would like to call.`,
      logItem,
      rawResponse: {
        status: 'multiple_matches',
        contactQuery: contactNameRaw,
        matchesCount: matches.length,
        matches: matches.map((m) => ({
          name: m.name,
          number: m.number,
          relation: m.relation,
        })),
        instruction: `I found ${matches.length} contacts for '${contactNameRaw}': ${matches
          .map((m) => m.name)
          .join(' and ')}. Ask the user politely in their active language which one they would like to call.`,
      },
    };
  }

  // Case 2: Exactly one match -> initiate call!
  if (matches.length === 1) {
    const targetContact = matches[0];
    const callResult = executeMakeCall(targetContact.number);

    const logItem: ActionLogItem = {
      id: 'act_' + Date.now(),
      timestamp: new Date(),
      type: 'contact_call',
      title: `Calling ${targetContact.name}`,
      target: `${targetContact.name} (${targetContact.number})`,
      status: 'executed',
      platform: callResult.logItem.platform,
      details: `Found contact "${targetContact.name}" (${targetContact.relation || ''}). Initiating call to ${targetContact.number}.`,
      url: callResult.logItem.url,
      rawArgs: { contactName: contactNameRaw, matched: targetContact },
    };

    return {
      success: true,
      status: 'executed',
      message: `Calling ${targetContact.name} (${targetContact.number}).`,
      logItem,
      rawResponse: {
        status: 'calling',
        contactName: targetContact.name,
        phoneNumber: targetContact.number,
        relation: targetContact.relation,
        platform: callResult.rawResponse.platform,
        executed: true,
      },
    };
  }

  // Case 3: No matches found
  const logItem: ActionLogItem = {
    id: 'act_' + Date.now(),
    timestamp: new Date(),
    type: 'contact_call',
    title: `Contact Not Found: "${contactNameRaw}"`,
    target: contactNameRaw,
    status: 'failed',
    platform: isNativeBridgeAvailable()
      ? 'Android Native Bridge'
      : 'Web Deep-Link',
    details: `Could not find any contact matching '${contactNameRaw}' in device contacts.`,
  };

  return {
    success: false,
    status: 'failed',
    message: `Contact '${contactNameRaw}' was not found in your contacts list.`,
    logItem,
    rawResponse: {
      status: 'not_found',
      contactQuery: contactNameRaw,
      executed: false,
      message: `Contact '${contactNameRaw}' was not found in the address book. Please inform the user gracefully.`,
    },
  };
}
