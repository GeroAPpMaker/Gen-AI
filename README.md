# Gemini AI for Educators

An interactive static website teaching teachers to use Google's Gemini AI tools,
with per-module quizzes, an 80% pass gate, sequential module unlocking, and a
Gemini Flash Study Buddy chatbot.

---

## Project structure

```
├── index.html                  Home page (learning path, module cards, progress tracker)
├── pages/
│   ├── prompt-engineering.html Module 1 — full lesson + quiz + chatbot
│   ├── gemini-chat.html        Module 2 — stub + quiz + chatbot
│   ├── canvas.html             Module 3 — stub + quiz + chatbot
│   ├── gems.html               Module 4 — stub + quiz + chatbot
│   ├── notebook-lm.html        Module 5 — stub + quiz + chatbot
│   └── nano.html               Module 6 — stub + quiz + chatbot
├── css/
│   ├── style.css               Global styles
│   ├── modules.css             Shared module, quiz, chat, and lock styles
│   └── prompt-eng.css          Prompt Engineering page-specific styles
├── js/
│   ├── app.js                  Progress tracker, lock logic, markModuleComplete
│   ├── quiz.js                 Reusable quiz component (shuffle, 80% gate, localStorage)
│   ├── chat.js                 Study Buddy floating chat widget
│   └── prompt-module.js        CRAFT builder, step navigation, prompt analyzer
├── data/
│   └── quiz-data.js            All 6 × 6–8 quiz questions (plain JS, works on file://)
├── server/
│   ├── server.js               Node/Express proxy — keeps API key server-side
│   └── package.json            Express + express-rate-limit + dotenv
├── .env.example                Environment variable template (copy → .env)
├── .gitignore                  Excludes .env and node_modules
└── README.md                   This file
```

---

## Local setup (without chatbot)

The site is static HTML/CSS/JS. Open any page directly in a browser:

```
open index.html
```

> **Note:** The Study Buddy chatbot requires the proxy server running on `localhost:3000`
> (see below). Without it, clicking "Send" will return a network error — everything else works.

---

## Local setup (with chatbot proxy)

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Your Gemini API key — never commit this
GEMINI_API_KEY=your_api_key_here

# Gemini Flash model ID
# TODO: replace with the confirmed Flash model ID when known
GEMINI_MODEL=gemini-1.5-flash

# Set to true to test the UI without a real API key
MOCK_CHAT=false

PORT=3000
```

### 3. Start the proxy server

```bash
npm start
```

The server runs at `http://localhost:3000` and also **serves the static site**,
so open `http://localhost:3000` in your browser — not the HTML file directly.

### 4. Mock mode (no API key needed)

To test the full UI flow without calling Gemini:

```bash
MOCK_CHAT=true npm start
```

Or append `?mockchat=1` to any module page URL in the browser.

---

## Changing the Gemini model ID

The model ID is controlled in **one place** in `server/server.js`:

```js
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'; // ← CHANGE HERE
```

Or set it in `.env`:

```env
GEMINI_MODEL=gemini-2.0-flash-exp
```

No other files need to change.

---

## Changing the pass threshold

The 80% pass threshold is defined in **one constant** in [`js/quiz.js`](js/quiz.js):

```js
const PASS_THRESHOLD = 0.8;   // 80%
```

Change this value to adjust the pass mark for all modules simultaneously.

---

## Adding or editing quiz questions

All questions live in [`data/quiz-data.js`](data/quiz-data.js).

Each question object:

```js
{
  id: 'pe-7',               // unique across all modules
  module: 'prompt',         // must match the module id used in Quiz.init()
  text: 'Question text here',
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 1,          // 0-based index into options[]
  explanation: 'One-sentence explanation shown after submission.'
}
```

**Rules:**
- `id` must be unique across the entire file.
- `correctIndex` refers to the **original** `options[]` order — `quiz.js` shuffles at runtime.
- Each option must be unambiguous and have exactly one correct answer.
- Avoid "all of the above" or "none of the above".

After adding questions, reload the page — no build step required.

---

## Module IDs

| Module            | ID            | Page                    |
|-------------------|---------------|-------------------------|
| Prompt Engineering | `prompt`     | `prompt-engineering.html` |
| Gemini Chat       | `gemini-chat` | `gemini-chat.html`      |
| Canvas            | `canvas`      | `canvas.html`           |
| Custom Gems       | `gems`        | `gems.html`             |
| NotebookLM        | `notebooklm`  | `notebook-lm.html`      |
| Gemini Nano       | `nano`        | `nano.html`             |

---

## localStorage keys

| Key                | Contents                                                        |
|--------------------|-----------------------------------------------------------------|
| `geminiCompleted`  | `["prompt", "gemini-chat", ...]` — modules marked complete      |
| `geminiQuizResults`| `{ "prompt": { best: 87, attempts: 2, passed: true }, ... }`   |

The home-page progress tracker reads both keys. `geminiCompleted` is only written
when a quiz is passed at ≥ 80% (via `markModuleComplete(id)` in `quiz.js`).

---

## Sequential unlock

Modules unlock in order: Prompt → Chat → Canvas → Gems → NotebookLM → Nano.

- Module 1 is always open.
- Each subsequent module unlocks when the previous quiz has `passed: true` in `geminiQuizResults`.
- Home-page cards show a lock icon for locked modules.
- Direct URL access to a locked page shows a "Complete [previous module] first" message.

The lock logic lives in [`js/app.js`](js/app.js) — `isModuleUnlocked()` and `enforceModuleLock()`.

---

## API security

- The Gemini API key is **never** in client-side JS, HTML, or the git repo.
- The proxy (`server/server.js`) reads it from the `GEMINI_API_KEY` environment variable.
- The system prompt is built server-side from `moduleId`; the client cannot override it.
- **Correct answers are never sent to the model** — `quiz-data.js` is loaded only in the browser,
  and the proxy's system prompts contain only topic summaries.
- The proxy enforces: 30 req/min per IP, 32 KB body limit, 2000-char per message cap,
  512 output token cap, CORS origin check.

---

## Hosting on Vercel

The project is pre-configured for Vercel. `api/chat.js` is the serverless function;
`vercel.json` wires up routing. The static site is served from the project root.

### Deploy steps

1. **Push to GitHub** (`.env` is already in `.gitignore`).

2. **Import the repo in Vercel**
   - Go to [vercel.com](https://vercel.com) → New Project → import your repo.
   - Framework Preset: **Other** (no build step needed).
   - Root directory: leave as `/`.

3. **Set environment variables** in the Vercel dashboard under
   *Project → Settings → Environment Variables*:

   | Name | Value |
   |------|-------|
   | `GEMINI_API_KEY` | your Gemini API key |
   | `GEMINI_MODEL` | `gemini-1.5-flash` (or confirmed model ID) |
   | `MOCK_CHAT` | `false` |
   | `ALLOWED_ORIGINS` | `https://your-project.vercel.app` |

4. **Deploy** — Vercel auto-deploys on every push to `main`.

### Local dev with Vercel CLI

```bash
npm install -g vercel
vercel dev          # serves site + function at http://localhost:3000
```

Or use the Express fallback in `server/` without installing the CLI:

```bash
cd server && npm install
MOCK_CHAT=true npm start
```

### Note on rate limiting

The serverless function uses an in-memory rate-limit map (30 req/min per IP).
Resets on cold start. For high-traffic production use, swap it for
Vercel KV or Upstash Redis.

---

## Accessibility

- Quiz uses `<fieldset>` + `<legend>` for each question (screen reader groups).
- Results announced via `aria-live="assertive"`.
- Correct/incorrect uses color + icon + text (not color alone).
- Chat widget: focus trapped while open, Esc to close, `aria-live` on messages.
- All interactive elements have visible focus states.

---

## Content status

| Module             | Lesson content | Quiz | Chatbot |
|--------------------|---------------|------|---------|
| Prompt Engineering | ✅ Complete    | ✅   | ✅      |
| Gemini Chat        | ⚠️ Stub only  | ✅   | ✅      |
| Canvas             | ⚠️ Stub only  | ✅   | ✅      |
| Custom Gems        | ⚠️ Stub only  | ✅   | ✅      |
| NotebookLM         | ⚠️ Stub only  | ✅   | ✅      |
| Gemini Nano        | ⚠️ Stub only  | ✅   | ✅      |

Stub pages display a yellow "Lesson Content Coming Soon" notice — replace it with real content when ready.
