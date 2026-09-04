/**
 * Arushi AI Assistant
 * Multilingual Real-Time Voice-to-Voice Assistant with Android Action Bridge
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VoiceSphere } from './components/VoiceSphere';
import { ActionCard } from './components/ActionCard';
import { QuickPrompts } from './components/QuickPrompts';
import { ContactsManager } from './components/ContactsManager';
import { BridgeInspector } from './components/BridgeInspector';
import {
  Contact,
  ActionLogItem,
  ConversationTurn,
  PlatformMode,
} from './types';
import {
  DEFAULT_CONTACTS,
  isNativeBridgeAvailable,
  isSimulatedBridge,
  setSimulatedBridge,
  executeOpenWhatsApp,
  executeOpenApp,
  executeOpenUrl,
  executeMakeCall,
  executeCallContact,
  ActionResult,
} from './services/androidBridge';
import { AudioPipeline } from './services/audioPipeline';
import {
  MessageSquare,
  Sparkles,
  PhoneCall,
  Radio,
  Volume2,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  // Connection and Audio States
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [statusText, setStatusText] = useState('Tap "Start Voice Conversation" to talk to Arushi');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio energy meters
  const [inputEnergy, setInputEnergy] = useState(0);
  const [outputEnergy, setOutputEnergy] = useState(0);

  // Assistant & Platform States
  const [detectedLanguage, setDetectedLanguage] = useState('Hindi / English / Hinglish');
  const [platformMode, setPlatformMode] = useState<PlatformMode>('browser');
  const [isSimulated, setIsSimulated] = useState(false);

  // Data collections
  const [contacts, setContacts] = useState<Contact[]>(DEFAULT_CONTACTS);
  const [actionLogs, setActionLogs] = useState<ActionLogItem[]>([]);
  const [latestAction, setLatestAction] = useState<ActionLogItem | null>(null);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);

  // Drawer Modals
  const [showContacts, setShowContacts] = useState(false);
  const [showBridgeLogs, setShowBridgeLogs] = useState(false);

  // Refs for persistent instances and closures
  const wsRef = useRef<WebSocket | null>(null);
  const audioPipelineRef = useRef<AudioPipeline | null>(null);
  const contactsRef = useRef<Contact[]>(contacts);
  contactsRef.current = contacts;

  // Initialize Platform Detection
  useEffect(() => {
    const checkBridge = () => {
      const native = isNativeBridgeAvailable();
      setPlatformMode(native ? 'native' : 'browser');
    };
    checkBridge();
  }, [isSimulated]);

  // Animation frame loop for energy levels
  useEffect(() => {
    let animFrame: number;
    const updateEnergy = () => {
      if (audioPipelineRef.current) {
        const levels = audioPipelineRef.current.getEnergyLevels();
        setInputEnergy(levels.inputEnergy);
        setOutputEnergy(levels.outputEnergy);

        const playing = audioPipelineRef.current.getIsPlaying();
        setIsModelSpeaking(playing);
      }
      animFrame = requestAnimationFrame(updateEnergy);
    };
    animFrame = requestAnimationFrame(updateEnergy);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Connect to Gemini Live WebSocket
  const connectLiveSession = async (): Promise<WebSocket> => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    setIsConnecting(true);
    setErrorMessage(null);
    setStatusText('Connecting to Arushi voice server...');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;
    const ws = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        console.log('[App] WebSocket opened to /live');
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'session_ready') {
            setIsConnected(true);
            setIsConnecting(false);
            setStatusText('Arushi is listening. Speak in Hindi, English, or Hinglish.');
            resolve(ws);
          } else if (msg.type === 'audio' && msg.audio) {
            // Received 24kHz audio from Gemini Live
            if (audioPipelineRef.current) {
              audioPipelineRef.current.enqueueAudioChunk(msg.audio);
              setIsModelSpeaking(true);
              setStatusText('Arushi is speaking...');
            }
          } else if (msg.type === 'model_text' && msg.text) {
            detectLanguageFromText(msg.text);
            addMessageToFeed('arushi', msg.text);
          } else if (msg.type === 'interrupted') {
            // User interrupted model while speaking
            console.log('[App] Interruption signal received');
            if (audioPipelineRef.current) {
              audioPipelineRef.current.stopPlayback();
            }
            setIsModelSpeaking(false);
            setStatusText('Listening to you...');
          } else if (msg.type === 'tool_call' && msg.functionCalls) {
            // Gemini Live tool execution request
            handleToolCalls(msg.functionCalls);
          } else if (msg.type === 'turn_complete') {
            setIsProcessing(false);
            if (!audioPipelineRef.current?.getIsPlaying()) {
              setStatusText('Listening to you...');
            }
          } else if (msg.type === 'error') {
            setErrorMessage(msg.message);
            setIsConnecting(false);
            setStatusText('Connection error');
          }
        } catch (e) {
          console.error('[App] Error handling WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        console.log('[App] WebSocket closed');
        setIsConnected(false);
        setIsConnecting(false);
        setIsRecording(false);
        setIsModelSpeaking(false);
        setStatusText('Disconnected. Tap to reconnect.');
      };

      ws.onerror = (err) => {
        console.error('[App] WebSocket error:', err);
        setIsConnecting(false);
        setErrorMessage('Failed to connect to Gemini Live voice server.');
        reject(err);
      };

      wsRef.current = ws;
    });
  };

  // Detect and update language tag
  const detectLanguageFromText = (text: string) => {
    // Check Devanagari Unicode range
    if (/[\u0900-\u097F]/.test(text)) {
      setDetectedLanguage('Hindi (à¤¹à¤¿à¤¨à¥à¤¦à¥)');
      return;
    }
    // Check common Hinglish markers
    const hinglishMarkers = [
      'karo',
      'kholo',
      'rahi hoon',
      'raha hoon',
      'mein',
      'kya',
      'hai',
      'aap',
      'mera',
      'meri',
      'kaise',
      'chalo',
      'bataye',
      'lagao',
    ];
    const lower = text.toLowerCase();
    const isHinglish = hinglishMarkers.some((m) => lower.includes(m));
    if (isHinglish) {
      setDetectedLanguage('Hinglish');
    } else if (/[a-zA-Z]/.test(text)) {
      setDetectedLanguage('English');
    }
  };

  // Handle Tool Calls dispatched by Gemini Live
  const handleToolCalls = async (functionCalls: any[]) => {
    setIsExecutingAction(true);
    setStatusText('Executing device action...');

    const functionResponses = [];

    for (const call of functionCalls) {
      const { id, name, args } = call;
      console.log(`[App] Executing tool '${name}' with args:`, args);

      let result: ActionResult;

      if (name === 'openWhatsApp') {
        result = executeOpenWhatsApp(args);
      } else if (name === 'openApp') {
        result = executeOpenApp(args.appName);
      } else if (name === 'openUrl') {
        result = executeOpenUrl(args.url);
      } else if (name === 'makeCall') {
        result = executeMakeCall(args.phoneNumber);
      } else if (name === 'callContact') {
        result = executeCallContact(args.contactName, contactsRef.current);
      } else {
        result = {
          success: false,
          status: 'failed',
          message: `Unknown function '${name}'`,
          logItem: {
            id: 'act_' + Date.now(),
            timestamp: new Date(),
            type: 'app',
            title: `Unknown Tool: ${name}`,
            target: name,
            status: 'failed',
            platform: 'Web Deep-Link',
            details: `Unrecognized function call '${name}'.`,
          },
          rawResponse: { error: `Function '${name}' is not supported.` },
        };
      }

      // Update Action Logs & Latest Action
      setActionLogs((prev) => [result.logItem, ...prev]);
      setLatestAction(result.logItem);

      // Add conversation note
      setConversation((prev) => [
        {
          id: 'turn_' + Date.now(),
          role: 'system',
          text: `[Action] ${result.logItem.title}: ${result.logItem.details}`,
          actionItem: result.logItem,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      functionResponses.push({
        id,
        name,
        response: result.rawResponse,
      });
    }

    // Send function execution response back to Gemini Live
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'tool_response',
          functionResponses,
        })
      );
    }

    setIsExecutingAction(false);
  };

  // Toggle Microphone
  const handleToggleMic = async () => {
    try {
      if (isRecording) {
        // Stop recording
        if (audioPipelineRef.current) {
          audioPipelineRef.current.stopRecording();
        }
        setIsRecording(false);
        setStatusText('Microphone muted. Tap to talk.');
      } else {
        // Ensure WebSocket is connected
        let ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          ws = await connectLiveSession();
        }

        if (!audioPipelineRef.current) {
          audioPipelineRef.current = new AudioPipeline();
        }

        setStatusText('Starting microphone...');
        await audioPipelineRef.current.startRecording((chunkBase64) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'audio',
                audio: chunkBase64,
              })
            );
          }
        });

        setIsRecording(true);
        setStatusText('Listening to you... Speak naturally.');
      }
    } catch (err) {
      console.error('[App] Failed to toggle mic:', err);
      setErrorMessage(
        'Could not access microphone. Please check microphone permissions.'
      );
      setIsRecording(false);
      setStatusText('Microphone permission required');
    }
  };

  // Interrupt Arushi's speech manually or via UI
  const handleInterrupt = () => {
    if (audioPipelineRef.current) {
      audioPipelineRef.current.stopPlayback();
    }
    setIsModelSpeaking(false);
    setStatusText('Listening to you...');
  };

  // Send Text Prompt (from test chips or text input)
  const handleSendPrompt = async (textPrompt: string) => {
    detectLanguageFromText(textPrompt);
    addMessageToFeed('user', textPrompt);
    setIsProcessing(true);
    setStatusText(`Processing: "${textPrompt}"...`);

    try {
      let ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        ws = await connectLiveSession();
      }

      ws.send(
        JSON.stringify({
          type: 'text',
          text: textPrompt,
        })
      );
    } catch (err) {
      console.error('[App] Failed to send prompt:', err);
      setErrorMessage('Could not send prompt to Arushi.');
      setIsProcessing(false);
    }
  };

  // Disambiguation selection (e.g. Rahul Sharma vs Rahul Verma)
  const handleSelectDisambiguation = (name: string, number: string) => {
    const callResult = executeMakeCall(number);
    setActionLogs((prev) => [callResult.logItem, ...prev]);
    setLatestAction(callResult.logItem);

    // Inform Arushi
    handleSendPrompt(`Call ${name} at ${number}`);
  };

  const addMessageToFeed = (role: 'user' | 'arushi', text: string) => {
    setConversation((prev) => [
      {
        id: 'turn_' + Date.now(),
        role,
        text,
        timestamp: new Date(),
      },
      ...prev,
    ]);
  };

  // Toggle Simulated Bridge
  const handleToggleSimulated = () => {
    const nextState = !isSimulated;
    setIsSimulated(nextState);
    setSimulatedBridge(nextState);
    setPlatformMode(nextState ? 'native' : 'browser');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        isConnected={isConnected}
        isConnecting={isConnecting}
        platformMode={platformMode}
        detectedLanguage={detectedLanguage}
        onToggleContacts={() => setShowContacts(true)}
        onToggleBridge={() => setShowBridgeLogs(true)}
        isSimulated={isSimulated}
        onToggleSimulated={handleToggleSimulated}
      />

      {/* Main Assistant Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto flex flex-col items-center justify-start p-4 sm:p-6 pb-20">
        {/* Error Notification */}
        {errorMessage && (
          <div className="w-full max-w-lg mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 text-xs"
            >
              âœ•
            </button>
          </div>
        )}

        {/* Central Voice Sphere */}
        <VoiceSphere
          isRecording={isRecording}
          isConnected={isConnected}
          isConnecting={isConnecting}
          isModelSpeaking={isModelSpeaking}
          isProcessing={isProcessing}
          isExecutingAction={isExecutingAction}
          inputEnergy={inputEnergy}
          outputEnergy={outputEnergy}
          onToggleMic={handleToggleMic}
          onInterrupt={handleInterrupt}
          onSendText={handleSendPrompt}
          statusText={statusText}
        />

        {/* Highlight Action Banner if action executed */}
        <ActionCard
          action={latestAction}
          onSelectDisambiguation={handleSelectDisambiguation}
          onDismiss={() => setLatestAction(null)}
        />

        {/* Specification Test Prompts Horizontal Bar */}
        <QuickPrompts
          onSelectPrompt={handleSendPrompt}
          disabled={isConnecting}
        />

        {/* Live Conversation & Activity Feed */}
        <section className="w-full max-w-2xl mt-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Live Conversation & Action Log
            </span>
            <span className="text-[11px] text-slate-500">
              {conversation.length} turn{conversation.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {conversation.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl text-xs leading-relaxed flex flex-col gap-1 ${
                  item.role === 'user'
                    ? 'bg-slate-800/90 text-slate-100 ml-6 border border-slate-700/60'
                    : item.role === 'arushi'
                      ? 'bg-gradient-to-r from-rose-950/40 to-slate-900 text-rose-100 mr-6 border border-rose-900/40'
                      : 'bg-indigo-950/30 text-indigo-200 border border-indigo-900/30 text-[11px]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="capitalize font-semibold text-slate-300">
                    {item.role === 'arushi'
                      ? 'Arushi'
                      : item.role === 'user'
                        ? 'You'
                        : 'Action Bridge'}
                  </span>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <div>{item.text}</div>
              </div>
            ))}

            {conversation.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-500 flex flex-col items-center gap-1">
                <Radio className="w-5 h-5 text-slate-600 mb-1" />
                <span>No conversation turns yet.</span>
                <span>Click "Start Voice Conversation" or click a prompt above.</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Slide-in Drawers */}
      <ContactsManager
        contacts={contacts}
        isOpen={showContacts}
        onClose={() => setShowContacts(false)}
        onAddContact={(newContact) => setContacts((prev) => [...prev, newContact])}
        onDeleteContact={(id) =>
          setContacts((prev) => prev.filter((c) => c.id !== id))
        }
        onDirectCall={(name) => {
          setShowContacts(false);
          handleSendPrompt(`Call ${name}`);
        }}
      />

      <BridgeInspector
        isOpen={showBridgeLogs}
        onClose={() => setShowBridgeLogs(false)}
        platformMode={platformMode}
        isSimulated={isSimulated}
        onToggleSimulated={handleToggleSimulated}
        logs={actionLogs}
        onClearLogs={() => setActionLogs([])}
      />
    </div>
  );
}
