/**
 * api/chat.js — Vercel Serverless Function
 *
 * Vercel automatically routes POST /api/chat to this file.
 * The Gemini API key is read from an environment variable set
 * in the Vercel project dashboard — never from client code.
 *
 * Environment variables (set in Vercel dashboard):
 *   GEMINI_API_KEY   — required for real responses
 *   GEMINI_MODEL     — optional, defaults to gemini-1.5-flash
 *   MOCK_CHAT        — set to "true" to return canned replies
 *   ALLOWED_ORIGINS  — comma-separated allowed origins
 */

'use strict';

const https = require('https');

// ── Config ───────────────────────────────────────────────────────────────────
// TODO: replace placeholder with the confirmed Flash model ID when known
const GEMINI_MODEL    = process.env.GEMINI_MODEL || 'gemini-1.5-flash'; // ← CHANGE THIS
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY || '';
const MOCK_CHAT       = process.env.MOCK_CHAT === 'true';
const MAX_INPUT_CHARS = 2000;
const MAX_MESSAGES    = 10;
const MAX_OUTPUT_TOKENS = 512;

// ── Allowed origins ──────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.length === 0) return true; // allow all if not configured
  return ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o));
}

// ── Simple in-memory rate limit (per cold-start instance, best-effort) ───────
const ipHits = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW_MS) {
    entry.count = 1; entry.start = now;
  } else {
    entry.count++;
  }
  ipHits.set(ip, entry);
  return entry.count <= RATE_MAX;
}

// ── Module system prompts ────────────────────────────────────────────────────
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

// ── Mock replies ─────────────────────────────────────────────────────────────
const MOCK_REPLIES = [
  "Great question! Let me explain that concept with a classroom example. [Mock mode — no API call made]",
  "Think about it this way: how would you explain this to your students? [Mock mode]",
  "That's a key concept! Here's a hint to point you in the right direction. [Mock mode]",
  "Let's break this down step by step. [Mock mode — set MOCK_CHAT=false and add GEMINI_API_KEY for real responses]"
];
let mockIdx = 0;

// ── Helper: call Gemini via native https ─────────────────────────────────────
function callGemini(systemPrompt, safeMessages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
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
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main handler ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';

  // CORS preflight
  if (req.method === 'OPTIONS') {
    if (isOriginAllowed(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // Body size guard (Vercel's default limit is 4 MB, but we enforce smaller)
  const rawBody = req.body;
  if (!rawBody || typeof rawBody !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { moduleId, messages } = rawBody;

  if (!moduleId || typeof moduleId !== 'string') {
    return res.status(400).json({ error: 'moduleId is required' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Sanitise messages
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

  // Mock mode
  if (MOCK_CHAT) {
    const reply = MOCK_REPLIES[mockIdx % MOCK_REPLIES.length];
    mockIdx++;
    return res.status(200).json({ reply, mock: true });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on the server.' });
  }

  // Build system prompt server-side — client cannot override
  const systemPrompt = MODULE_SYSTEM_PROMPTS[moduleId] || DEFAULT_SYSTEM_PROMPT;

  try {
    const { status, body } = await callGemini(systemPrompt, safeMessages);

    if (status === 429) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
    }
    if (status !== 200) {
      let detail = '';
      try { detail = JSON.parse(body)?.error?.message || ''; } catch (_) { detail = ''; }
      return res.status(502).json({ error: `Gemini API error (HTTP ${status})${detail ? ': ' + detail : ''}` });
    }

    const parsed = JSON.parse(body);
    const candidate = parsed.candidates && parsed.candidates[0];

    if (!candidate) {
      return res.status(502).json({ error: 'No response from AI. Please try again.' });
    }
    if (candidate.finishReason === 'SAFETY') {
      return res.status(200).json({
        reply: "I can't respond to that, but I'm happy to help with the course topics!",
        safetyBlocked: true
      });
    }

    const text = candidate.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(502).json({ error: 'Empty response from AI.' });
    }

    return res.status(200).json({ reply: text });

  } catch (_) {
    return res.status(503).json({ error: 'Network error contacting AI service.' });
  }
};
