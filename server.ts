import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    assistant: 'Arushi',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    name: 'Arushi AI Assistant',
    voice: 'Kore',
    sampleRateIn: 16000,
    sampleRateOut: 24000,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

// Function definitions for Arushi device actions
const ARUSHI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'openWhatsApp',
        description:
          "Opens the WhatsApp messaging application or web interface. Trigger when the user asks to open WhatsApp, e.g., 'Open WhatsApp', 'WhatsApp kholo', 'WhatsApp open karo', 'WhatsApp chalao', 'Can you open WhatsApp?'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: 'Optional draft message to prefill in WhatsApp chat.',
            },
            phoneNumber: {
              type: Type.STRING,
              description: 'Optional phone number with country code for direct chat.',
            },
          },
        },
      },
      {
        name: 'openApp',
        description:
          "Opens an installed application on the device or web, such as YouTube, Instagram, Chrome, Camera, Maps, Settings, Calculator, Spotify, etc. Trigger when user says 'Open YouTube', 'Open Instagram', 'Open Chrome', 'Open Settings', 'YouTube kholo', 'Instagram open karo', 'Settings kholo'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            appName: {
              type: Type.STRING,
              description:
                "Name of the application to open, e.g. 'youtube', 'instagram', 'chrome', 'settings', 'maps', 'camera', 'calculator', 'spotify'.",
            },
          },
          required: ['appName'],
        },
      },
      {
        name: 'openUrl',
        description:
          'Opens a specific website address or URL in the browser or WebView.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: 'The destination URL starting with http:// or https://.',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'makeCall',
        description:
          "Initiates a phone call to a given phone number directly or via phone dialer. Trigger when user says 'Call 9876543210', '9876543210 par call karo', 'Dial 9876543210'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            phoneNumber: {
              type: Type.STRING,
              description: 'The phone number string (with optional plus/country code).',
            },
          },
          required: ['phoneNumber'],
        },
      },
      {
        name: 'callContact',
        description:
          "Calls a person or contact from the address book by their name or relation. Trigger when user says 'Call Mom', 'Call Mummy', 'Call Rahul', 'Mummy ko call karo', 'Rahul ko call lagao', 'Call Dad', 'Call Priya'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            contactName: {
              type: Type.STRING,
              description:
                "Name, nickname, or relation of the contact (e.g., 'Mom', 'Mummy', 'Rahul', 'Dad', 'Priya').",
            },
          },
          required: ['contactName'],
        },
      },
    ],
  },
];

const ARUSHI_SYSTEM_INSTRUCTION = `You are Arushi, a warm, polite, intelligent, and highly expressive Indian AI voice assistant.
You possess native, effortless multi-language voice capabilities. You automatically detect the language spoken by the user and immediately respond in that exact language.
- If the user speaks Hindi ("Namaste Arushi", "Hindi mein baat karo", "Aap kaisi hain?"), respond in warm, fluent, natural Hindi.
- If the user speaks English ("Hello Arushi", "Talk to me in English"), respond in clear, friendly English.
- If the user speaks Hinglish ("Hinglish mein baat karo", "Kya chal raha hai, tell me"), respond naturally in authentic Hinglish with an Indian conversational tone.
- If the user speaks Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, or any other regional Indian language, respond fluently in that language.
- Automatically and seamlessly switch languages mid-conversation if the user switches languages, without commenting on the switch.
- Never use robotic speech or ask the user to pick a language.
- Keep your answers concise, clear, and natural, perfectly suited for real-time live voice conversation.

DEVICE APP CONTROL & ACTIONS:
You have direct tools to execute real device actions. Whenever the user asks to perform an action, you MUST invoke the appropriate tool immediately:
1. "openWhatsApp": Use when user asks to open WhatsApp ("WhatsApp kholo", "Open WhatsApp", "WhatsApp open karo", "WhatsApp chalao", "Can you open WhatsApp?").
2. "openApp": Use when user asks to open apps like YouTube, Instagram, Chrome, Settings, Maps, Camera, etc. ("Open YouTube", "Instagram open karo", "Open settings", "YouTube kholo").
3. "openUrl": Use when user wants to visit a specific website URL.
4. "makeCall": Use when user asks to call a specific phone number ("Call 9876543210", "9876543210 par call karo").
5. "callContact": Use when user asks to call someone by name or relation ("Call Mom", "Call Mummy", "Mummy ko call karo", "Call Rahul", "Rahul ko call lagao", "Call Dad", "Please call my mother").

CRITICAL RULES FOR CALLING & ACTIONS:
- Always call the tool first. DO NOT claim you executed an action without calling the tool.
- When you receive the tool response:
  - If the contact was found and call initiated: Confirm naturally in the active language (e.g., "Calling Mom now", "Mummy ko call laga rahi hoon").
  - If multiple contacts were found (e.g., multiple Rahuls): Politely ask for clarification (e.g., "I found two contacts for Rahul: Rahul Sharma and Rahul Verma. Which one should I call?", "Mujhe do Rahul mile hain: Rahul Sharma aur Rahul Verma. Aap kise call karna chahte hain?").
  - If the contact was not found: Inform the user gracefully (e.g., "I couldn't find that contact in your address book.", "Ye contact aapke phonebook mein nahi mila.").
  - If opening an app succeeded: Acknowledge briefly and warmly (e.g., "Opening WhatsApp", "WhatsApp khol rahi hoon").
  - If an action cannot be performed on the current platform: Explain honestly without pretending it succeeded.
- Never guess or fabricate phone numbers.`;

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Arushi Live] Client connected to WebSocket');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: 'GEMINI_API_KEY is not configured in environment variables.',
      })
    );
    return;
  }

  let session: any = null;
  let isClosed = false;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    session = await ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
        systemInstruction: ARUSHI_SYSTEM_INSTRUCTION,
        tools: ARUSHI_TOOLS,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (isClosed) return;

          // Check for audio chunks
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
              if (part.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'model_text',
                    text: part.text,
                  })
                );
              }
            }
          }

          // Check for interruption signal (user spoke while model was speaking)
          if (message.serverContent?.interrupted) {
            clientWs.send(
              JSON.stringify({
                type: 'interrupted',
              })
            );
          }

          // Check for tool call requests from model
          if (message.toolCall && message.toolCall.functionCalls) {
            console.log(
              '[Arushi Live] Received tool calls:',
              message.toolCall.functionCalls.map((fc) => fc.name)
            );
            clientWs.send(
              JSON.stringify({
                type: 'tool_call',
                functionCalls: message.toolCall.functionCalls,
              })
            );
          }

          // Turn complete
          if (message.serverContent?.turnComplete) {
            clientWs.send(
              JSON.stringify({
                type: 'turn_complete',
              })
            );
          }
        },
        onclose: () => {
          console.log('[Arushi Live] Gemini Live session closed');
          if (!isClosed) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
        onerror: (err) => {
          console.error('[Arushi Live] Gemini Live session error:', err);
          if (!isClosed) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                message: err instanceof Error ? err.message : String(err),
              })
            );
          }
        },
      },
    });

    console.log('[Arushi Live] Gemini Live session established');
    clientWs.send(
      JSON.stringify({
        type: 'session_ready',
        message: 'Arushi is ready and listening.',
      })
    );

    clientWs.on('message', (raw) => {
      if (isClosed || !session) return;
      try {
        const payload = JSON.parse(raw.toString());

        if (payload.type === 'audio' && payload.audio) {
          // Send 16kHz PCM audio chunk to Gemini Live
          session.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (payload.type === 'text' && payload.text) {
          // Send textual turn input to Gemini Live
          session.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: payload.text }],
              },
            ],
            turnComplete: true,
          });
        } else if (payload.type === 'tool_response' && payload.functionResponses) {
          // Send tool execution results back to Gemini Live
          console.log(
            '[Arushi Live] Sending tool response to Gemini Live:',
            payload.functionResponses.map((fr: any) => fr.name)
          );
          session.sendToolResponse({
            functionResponses: payload.functionResponses,
          });
        }
      } catch (e) {
        console.error('[Arushi Live] Error processing client message:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('[Arushi Live] Client WebSocket disconnected');
      isClosed = true;
      if (session) {
        try {
          session.close();
        } catch (_) {}
      }
    });

    clientWs.on('error', (err) => {
      console.error('[Arushi Live] Client WebSocket error:', err);
    });
  } catch (err) {
    console.error('[Arushi Live] Failed to connect to Gemini Live:', err);
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Could not connect to Gemini Live session',
      })
    );
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Arushi AI Assistant] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
