/**
 * server.js — Gemini Flash API proxy
 *
 * Keeps GEMINI_API_KEY server-side. The client calls POST /api/chat with
 * { moduleId, messages } and receives { reply }.
 *
 * Also serves the static site from ../  (the project root).
 *
 * Setup:
 *   cd server && npm install
 *   cp ../.env.example ../.env   # then fill in GEMINI_API_KEY
 *   npm start
 *
 * Mock mode (no API key needed):
 *   MOCK_CHAT=true npm start
 *   OR append ?mockchat=1 to any URL (checked server-side via referer header)
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express     = require('express');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const https       = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Config ──────────────────────────────────────────────────────────────────
// TODO: replace placeholder with the real Flash model ID when known
const GEMINI_MODEL    = process.env.GEMINI_MODEL || 'gemini-1.5-flash'; // ← CHANGE THIS
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY || '';
const MOCK_CHAT       = process.env.MOCK_CHAT === 'true';
const MAX_INPUT_CHARS = 2000;   // per message
const MAX_MESSAGES    = 10;     // conversation history window
const MAX_OUTPUT_TOKENS = 512;

// Allowed origins (add your deployed domain here)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
// In dev, allow localhost
if (ALLOWED_ORIGINS.length === 0) {
  ALLOWED_ORIGINS.push('http://localhost:' + PORT, 'http://127.0.0.1:' + PORT);
}

// ── Module system prompts ───────────────────────────────────────────────────
const MODULE_SYSTEM_PROMPTS = {
  'prompt': `You are a friendly, concise Study Buddy helping teachers learn Professional Prompt Engineering.
Topics: CRAFT framework (Context, Role, Action, Format, Target), Chain-of-Thought prompting, Few-Shot Learning, Constraint Prompting, Role Prompting, specificity principles.
Your role: explain concepts clearly, give classroom examples, offer hints, use Socratic questioning.
IMPORTANT: Never reveal quiz answers or hint at which option is correct for specific quiz questions. If asked about a specific quiz answer, explain the underlying concept instead.`,

  'gemini-chat': `You are a friendly, concise Study Buddy helping teachers learn Gemini Chat.
Topics: multimodal input (text, image, audio, video), image analysis, Gemini Extensions, Google Workspace integration, conversation context, content creation.
Your role: explain concepts clearly, give classroom examples, offer hints, use Socratic questioning.
IMPORTANT: Never reveal quiz answers or hint at which option is correct for specific quiz questions. Explain underlying concepts instead.`,

  'canvas': `You are a friendly, concise Study Buddy helping teachers learn Gemini Canvas.
Topics: document co-creation, code writing assistance, inline editing, version history, side-by-side AI workspace, collaborative editing workflow.
Your role: explain concepts clearly, give classroom examples, offer hints, use Socratic questioning.
IMPORTANT: Never reveal quiz answers or hint at which option is correct for specific quiz questions. Explain underlying concepts instead.`,

  'gems': `You are a friendly, concise Study Buddy helping teachers learn Custom Gems in Gemini.
Topics: custom instructions, building a Lesson Plan Gem, Grading Assistant Gem, Student Tutor Gem, Gemini Advanced requirements, writing effective Gem instructions.
Your role: explain concepts clearly, give classroom examples, offer hints, use Socratic questioning.
IMPORTANT: Never reveal quiz answers or hint at which option is correct for specific quiz questions. Explain underlying concepts instead.`,

  'notebooklm': `You are a friendly, concise Study Buddy helping teachers learn NotebookLM.
Topics: source-grounded AI, uploading documents, audio summaries (Audio Overview), study guide generation, FAQ generation, inline citations.
Your role: explain concepts clearly, give classroom examples, offer hints, use Socratic questioning.
IMPORTANT: Never reveal quiz answers or hint at which option is correct for specific quiz questions. Explain underlying concepts instead.`,

  'nano': `You are a friendly, concise Study Buddy helping teachers learn Gemini Nano.
Topics: on-device AI, offline access, Chrome 131+ built-in features, Android/Pixel/Samsung support, privacy benefits, capability trade-offs vs cloud models.
Your role: explain concepts clearly, give classroom examples, offer hints, use Socratic questioning.
IMPORTANT: Never reveal quiz answers or hint at which option is correct for specific quiz questions. Explain underlying concepts instead.`
};

const DEFAULT_SYSTEM_PROMPT = `You are a friendly Study Buddy for a Gemini AI for Educators course. Help teachers understand Google's AI tools. Never reveal quiz answers.`;

// ── Canned mock replies ──────────────────────────────────────────────────────
const MOCK_REPLIES = [
  "Great question! Let me explain that concept with a classroom example. [Mock mode — no API call made]",
  "Think about it this way: how would you explain this to your students? [Mock mode]",
  "That's a key concept! Here's a hint to point you in the right direction. [Mock mode]",
  "Let's break this down step by step. [Mock mode — set MOCK_CHAT=false and add GEMINI_API_KEY for real responses]"
];
let mockIdx = 0;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '32kb' }));

// CORS / origin check
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limit: 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment.' }
});
app.use('/api/', limiter);

// Serve static files from project root
app.use(express.static(path.join(__dirname, '..')));

// ── POST /api/chat ────────────────────────────────────────────────────────────
app.post('/api/chat', (req, res) => {
  const { moduleId, messages } = req.body || {};

  // Validate
  if (!moduleId || typeof moduleId !== 'string') {
    return res.status(400).json({ error: 'moduleId is required' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Sanitise & cap the conversation window
  const safeMessages = messages
    .slice(-MAX_MESSAGES)
    .filter(m => m && typeof m.role === 'string' && typeof m.text === 'string')
    .map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      text: String(m.text).slice(0, MAX_INPUT_CHARS)
    }));

  if (safeMessages.length === 0) {
    return res.status(400).json({ error: 'No valid messages provided' });
  }

  // Mock mode — return canned reply without calling Gemini
  if (MOCK_CHAT) {
    const reply = MOCK_REPLIES[mockIdx % MOCK_REPLIES.length];
    mockIdx++;
    return res.json({ reply, mock: true });
  }

  // No API key
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured. Set it in .env or use MOCK_CHAT=true.' });
  }

  // Build system prompt from moduleId (client cannot override this)
  const systemPrompt = MODULE_SYSTEM_PROMPTS[moduleId] || DEFAULT_SYSTEM_PROMPT;

  // Build Gemini request body
  const geminiBody = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: safeMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(geminiBody)
    }
  };

  const proxyReq = https.request(options, proxyRes => {
    let data = '';
    proxyRes.on('data', chunk => { data += chunk; });
    proxyRes.on('end', () => {
      // Rate-limited by Gemini
      if (proxyRes.statusCode === 429) {
        return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
      }
      if (proxyRes.statusCode !== 200) {
        return res.status(502).json({ error: 'Upstream AI service error. Please try again.' });
      }
      try {
        const parsed = JSON.parse(data);
        const candidate = parsed.candidates && parsed.candidates[0];
        if (!candidate) {
          return res.status(502).json({ error: 'No response from AI. Please try again.' });
        }
        // Safety block
        if (candidate.finishReason === 'SAFETY') {
          return res.json({ reply: "I can't respond to that, but I'm happy to help with the course topics!", safetyBlocked: true });
        }
        const text = candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;
        if (!text) {
          return res.status(502).json({ error: 'Empty response from AI.' });
        }
        return res.json({ reply: text });
      } catch (_) {
        return res.status(502).json({ error: 'Failed to parse AI response.' });
      }
    });
  });

  proxyReq.on('error', () => {
    res.status(503).json({ error: 'Network error contacting AI service. Check your connection.' });
  });

  proxyReq.write(geminiBody);
  proxyReq.end();
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Gemini Educators proxy running at http://localhost:${PORT}`);
  console.log(`Model: ${GEMINI_MODEL}`);
  console.log(`Mock mode: ${MOCK_CHAT}`);
  if (!GEMINI_API_KEY && !MOCK_CHAT) {
    console.warn('WARNING: GEMINI_API_KEY is not set. Set it in .env or use MOCK_CHAT=true.');
  }
});
