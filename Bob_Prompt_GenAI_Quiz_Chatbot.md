# Task for Bob: Add per-module quizzes, an 80% pass gate, and a Gemini Flash tutor chatbot

## 1. Project context

The project is "Gemini for Educators", a static website (HTML, CSS, vanilla JS, no framework, no build step) that teaches teachers to use Google's AI tools.

Current structure:
- `index.html`: home page with a learning path, six module cards and a progress tracker.
- `pages/prompt-engineering.html`: the only module page that exists. Five steps (`#step-1` to `#step-5`, shown and hidden by `goToStep()`); Step 5 is a quiz.
- The other five modules are linked from `index.html` but their pages do NOT exist yet: `gemini-chat.html`, `canvas.html`, `gems.html`, `notebook-lm.html`, `nano.html`.
- `js/app.js`: hamburger menu, home-page progress tracker, smooth scroll. Progress is stored in `localStorage` key `geminiCompleted`, an array of module ids: `prompt`, `gemini-chat`, `canvas`, `gems`, `notebooklm`, `nano`. `markModuleComplete(id)` already exists.
- `js/prompt-module.js`: step navigation and the CRAFT builder, plus the current quiz logic (`submitQuiz`, `retakeQuiz`, `completeModule`). The quiz has 6 hardcoded questions, and the correct answers sit in plain JS (`correctAnswers`, `answerExplanations`).
- CSS: `css/style.css` (global), `css/modules.css` (shared module and quiz styles), `css/prompt-eng.css` (page-specific).

Problems with the current state:
1. `completeModule()` can be clicked at ANY score, so there is no pass requirement.
2. The quiz is copy-pasted into one page and is not reusable for the other modules.
3. There is no AI assistance inside the modules.

## 2. Requirements

### R1. A quiz for every module
- Build ONE reusable quiz component (for example `js/quiz.js` plus a quiz block in `css/modules.css`), not six copies of the same code.
- Questions live in a data file, `data/quizzes.json` (or `js/quiz-data.js` if JSON fetch is a problem when opening files locally). Each question has: `id`, `module`, `text`, `options[]`, `correctIndex`, `explanation`.
- Each module has its own quiz: 6 to 10 multiple-choice questions that test what THAT module teaches. Draft the questions for all six modules, and use the topics on the `index.html` module cards as the source of truth:
  - Prompt Engineering: keep and migrate the existing 6 questions, and add more if needed so each question maps to a lesson.
  - Gemini Chat: multimodal input, image analysis, extensions, Workspace integration.
  - Canvas: document co-creation, code writing, inline editing, version history.
  - Custom Gems: custom instructions, lesson plan Gem, grading assistant, student tutor Gem.
  - NotebookLM: source analysis, audio summaries, study guides, FAQ generation.
  - Gemini Nano: on-device AI, offline access, Chrome built-in, privacy.
- Shuffle question order and option order on each attempt. The correct answer must be tracked by `id`, not by position.
- After submitting, show the score and percentage, and show per-question feedback with the explanation.

### R2. 80% pass gate
- Pass mark is 80%, held in one constant (`PASS_THRESHOLD = 0.8`). Compute it as `correct / total >= 0.8`, and handle total counts where 80% falls between whole numbers (for example 6 questions needs 5, since 4/6 is only 67%).
- The "Complete Module" button, the completion badge and `markModuleComplete(id)` are reachable ONLY when the score is at least 80%. Below 80%, show a "Not yet, you need 80% to pass" state, the score, and a Retake button. Retakes reshuffle, with no limit on attempts.
- Store the best score and the attempt count per module in `localStorage`, for example `geminiQuizResults = { "prompt": { best: 83, attempts: 2, passed: true } }`. Keep `geminiCompleted` working exactly as it does today so the home-page tracker is not broken.
- Sequential unlock: the next module is locked until the previous one is passed. Locked cards on `index.html` show a lock icon and explain why. Direct URL access to a locked page should show a friendly "Complete [previous module] first" message with a link, not a blank page. Module 1 is always open. (See open question Q1.)
- The home page progress tracker should also show the best quiz score per module.

### R3. Gemini Flash tutor chatbot
Interpretation (confirm in Q2): a "Study Buddy" chat widget is available on every module page and helps the learner until they pass that module's quiz at 80%. After passing, it switches to a "module complete" state (see Q2 for the alternative).

- Floating chat button (bottom right) that opens a panel. It must work on mobile and be keyboard accessible, with focus trapped in the panel while open, Esc to close, and `aria-live` for new messages.
- Powered by a Gemini Flash model. Put the model ID in ONE config constant (`GEMINI_MODEL`) so it can be changed in one place, and do not scatter it through the code. I will tell you which Flash model ID to use; if it is not given, leave a clearly marked placeholder and a TODO.
- The system prompt is built per module from that module's topics: tutor for teachers, friendly, concise, explains concepts and gives hints and examples tied to the current module's content.
- Pedagogy guardrail: the chatbot must NOT reveal quiz answers. If asked "what's the answer to question 3?", it explains the underlying concept and nudges instead. The correct answers must never be sent to the model. Send only the module topic and lesson content summary, not `correctIndex`.
- Keep the last N messages as conversation context (N configurable, for example 10). Add a "Clear chat" button, a typing indicator, error handling for network, rate-limit (429) and safety-blocked responses, and a visible disclaimer: "AI can make mistakes. Check important facts."
- Suggested starter chips per module, for example "Explain CRAFT with a classroom example" or "Quiz me on the part I missed".
- After a failed attempt, offer a one-click "Ask Study Buddy about the questions I missed", which sends the TOPICS of the missed questions (not the answers) as context.

### R4. API key security (important)
- This is a static site. NEVER put the Gemini API key in client-side JS, HTML, or the git repo.
- Build a minimal server-side proxy (a single serverless function or small Node/Express endpoint, whichever fits best; see Q3 for hosting) with these properties:
  - The key is read from an environment variable (`GEMINI_API_KEY`).
  - The client calls `/api/chat` with `{ moduleId, messages }`; the proxy calls Gemini and returns the reply.
  - Basic abuse protection: request body size limit, a message length cap, a per-IP rate limit, an allowed-origin check, and a cap on output tokens.
  - The proxy builds the system prompt from `moduleId` itself, so the client cannot override it.
- Provide `.env.example`, add `.env` to `.gitignore`, and document setup in the README.
- Include a mock mode (`?mockchat=1` or an env flag) that returns canned replies without calling Gemini, so the UI can be developed and tested without a key.

### R5. UI, accessibility, quality
- Match the existing look and feel (Google colors, current card style, existing CSS variables and classes). Reuse `modules.css` classes; do not restyle existing pages.
- The quiz must be keyboard and screen-reader accessible: radio groups with `fieldset` and `legend`, a visible focus state, and results announced via `aria-live`. Do not rely on color alone for correct and incorrect; include icons and text.
- Responsive from 360px wide up.
- No new frameworks. Vanilla JS only. Escape any user or model text before inserting it into the DOM, to avoid XSS (render model output as text or via a safe minimal markdown renderer).
- Keep the existing CRAFT builder and step navigation working.

## 3. Out of scope for now
- User accounts or a backend database. Progress stays in `localStorage`.
- Writing the full lesson content for the five missing module pages. Create the page shells ONLY if needed to host the quiz and chatbot, and flag clearly where lesson content still needs writing. (See Q4.)

## 4. How I want you to work

1. First, read the code and reply with a SHORT plan: files to create, files to change, and your answers or assumptions for the open questions below. Wait for my go-ahead only if something blocks you; otherwise proceed with the stated assumptions.
2. Work in small steps and commit after each: (a) reusable quiz component and data, migrating the Prompt Engineering quiz; (b) the 80% gate and the unlock logic; (c) the server-side proxy; (d) the chat widget; (e) the other five modules' quizzes; (f) the home-page progress changes; (g) the README.
3. Do not break existing behavior. After each step, open the page and verify it in a browser, not just by reading the code.
4. Write the question bank carefully. Every question must be unambiguous, with exactly one correct answer, plausible distractors, and a one-sentence explanation. Avoid "all of the above".

## 5. Acceptance criteria

- [ ] Each of the six modules has its own quiz drawn from `quizzes.json` and rendered by the same component.
- [ ] Scoring below 80% blocks "Complete Module" and the badge; scoring 80% or above unlocks them, and `geminiCompleted` is updated only then.
- [ ] Retake works, reshuffles questions and options, and keeps the best score and attempt count.
- [ ] The next module stays locked until the previous quiz is passed, on both the home page and direct URL access.
- [ ] The chat widget opens on every module page, answers in the context of that module, and refuses to reveal quiz answers.
- [ ] No API key appears anywhere in the client code or the repo; the proxy enforces rate limits and size limits.
- [ ] Mock mode lets the whole flow be tested without a key.
- [ ] Keyboard-only use works for the quiz and the chat; layout works at 360px.
- [ ] The README explains local setup, the environment variable, how to change the model ID, the pass threshold, and how to add questions.

## 6. Open questions (state your assumption if I have not answered)

- **Q1.** Should modules unlock strictly in order (assumed: yes), or may learners open any module and only the completion is gated by the quiz?
- **Q2.** Should the chatbot be available only until the quiz is passed (assumed), or should it stay available after passing and just stop helping with that quiz?
- **Q3.** Where will this be hosted (Vercel, Netlify, Cloudflare, Railway, other)? This decides the proxy format. If unknown, use a small Node/Express server that also serves the static files.
- **Q4.** Should I create stub pages for the five missing modules so every quiz and chat can be tested, or only add the quiz and chat to the page that exists?
