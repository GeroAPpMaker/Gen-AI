// ================================================================
//  CHAT.JS — Study Buddy floating chat widget
//
//  Usage: include this script on any module page AFTER app.js.
//  The widget reads window.CHAT_MODULE_ID (set inline on the page)
//  to know which module context to use.
//
//  API: POST /api/chat  { moduleId, messages }  → { reply }
//  Mock: appends ?mockchat=1 to the URL to get canned replies.
// ================================================================

(function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────────
  const API_ENDPOINT   = '/api/chat';
  const MAX_HISTORY    = 10;    // messages kept in context (configurable)
  const MOCK_PARAM     = 'mockchat';

  // ── Starter chips per module ────────────────────────────────────
  const STARTER_CHIPS = {
    'prompt': [
      'Explain the CRAFT framework with a classroom example',
      'What is Chain-of-Thought prompting?',
      'How do I use Few-Shot Learning?',
      'What does the "T" in CRAFT stand for?'
    ],
    'gemini-chat': [
      'How does multimodal input work in Gemini?',
      'What can Gemini Extensions do for teachers?',
      'How does Gemini integrate with Google Workspace?',
      'What\'s the difference between Gemini Chat and NotebookLM?'
    ],
    'canvas': [
      'How is Canvas different from regular Gemini Chat?',
      'How does inline editing work in Canvas?',
      'Can Canvas help me write code for a classroom activity?',
      'What is Version History in Canvas?'
    ],
    'gems': [
      'What is a Custom Gem and how do I create one?',
      'How do I write good custom instructions for a Gem?',
      'Give me an example of a Grading Assistant Gem',
      'What does a Student Tutor Gem do differently?'
    ],
    'notebooklm': [
      'How is NotebookLM different from Gemini Chat?',
      'What is the Audio Overview feature?',
      'How do I create a study guide with NotebookLM?',
      'How does NotebookLM cite its sources?'
    ],
    'nano': [
      'What makes Gemini Nano different from other models?',
      'Why is Nano more private than cloud-based AI?',
      'What can Nano do that other Gemini models can\'t?',
      'Which devices support Gemini Nano?'
    ]
  };

  // ── State ───────────────────────────────────────────────────────
  let _moduleId   = null;
  let _messages   = [];   // { role: 'user'|'model', text: string }
  let _isOpen     = false;
  let _isLoading  = false;
  let _completed  = false;

  // ── Init ────────────────────────────────────────────────────────
  function init() {
    _moduleId = window.CHAT_MODULE_ID || null;
    if (!_moduleId) return;  // no module id — don't mount

    _injectCSS();
    _buildWidget();
    _bindEvents();

    // Listen for quiz events
    document.addEventListener('moduleCompleted', e => {
      if (e.detail && e.detail.moduleId === _moduleId) _onModuleComplete();
    });
    document.addEventListener('studyBuddyMissed', e => {
      if (e.detail && e.detail.moduleId === _moduleId) _onMissedTopics();
    });
  }

  // ── Build DOM ───────────────────────────────────────────────────
  function _buildWidget() {
    const chips = (STARTER_CHIPS[_moduleId] || []).map(c =>
      `<button class="chat-chip" type="button">${_esc(c)}</button>`
    ).join('');

    const html = `
      <div id="chat-widget" aria-label="Study Buddy chat widget">
        <!-- Toggle button -->
        <button id="chat-toggle-btn" type="button" aria-expanded="false"
                aria-controls="chat-panel" title="Open Study Buddy">
          <i class="fas fa-comment-dots" aria-hidden="true"></i>
          <span class="sr-only">Study Buddy</span>
        </button>

        <!-- Panel -->
        <div id="chat-panel" role="dialog" aria-modal="true"
             aria-label="Study Buddy" hidden>
          <div id="chat-header">
            <span>
              <i class="fas fa-robot" aria-hidden="true"></i>
              Study Buddy
            </span>
            <div class="chat-header-actions">
              <button id="chat-clear-btn" type="button" title="Clear chat history">
                <i class="fas fa-trash-alt" aria-hidden="true"></i>
                <span class="sr-only">Clear chat</span>
              </button>
              <button id="chat-close-btn" type="button" aria-label="Close chat">
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div id="chat-disclaimer">
            <i class="fas fa-info-circle" aria-hidden="true"></i>
            AI can make mistakes. Check important facts.
          </div>

          <div id="chat-messages" aria-live="polite" aria-atomic="false"></div>

          <!-- Starter chips -->
          <div id="chat-chips">${chips}</div>

          <!-- Completed state overlay -->
          <div id="chat-complete-banner" hidden>
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            Module complete! Great work.
          </div>

          <form id="chat-form" autocomplete="off">
            <label for="chat-input" class="sr-only">Your message</label>
            <textarea id="chat-input" rows="2"
                      placeholder="Ask Study Buddy anything about this module…"
                      maxlength="500" aria-label="Your message"></textarea>
            <button type="submit" id="chat-send-btn" aria-label="Send message">
              <i class="fas fa-paper-plane" aria-hidden="true"></i>
            </button>
          </form>
        </div>
      </div>`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper.firstElementChild);
  }

  // ── Events ──────────────────────────────────────────────────────
  function _bindEvents() {
    document.getElementById('chat-toggle-btn').addEventListener('click', _toggle);
    document.getElementById('chat-close-btn').addEventListener('click', _close);
    document.getElementById('chat-clear-btn').addEventListener('click', _clearHistory);
    document.getElementById('chat-form').addEventListener('submit', _handleSend);

    // Starter chips
    document.getElementById('chat-chips').addEventListener('click', e => {
      const chip = e.target.closest('.chat-chip');
      if (chip) _sendMessage(chip.textContent.trim());
    });

    // Keyboard: Esc closes, Enter submits (without Shift)
    document.getElementById('chat-panel').addEventListener('keydown', e => {
      if (e.key === 'Escape') _close();
    });
    document.getElementById('chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        _handleSend(e);
      }
    });

    // Focus trap
    document.getElementById('chat-panel').addEventListener('keydown', _trapFocus);
  }

  function _trapFocus(e) {
    if (e.key !== 'Tab') return;
    const panel     = document.getElementById('chat-panel');
    const focusable = Array.from(panel.querySelectorAll(
      'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function _toggle() {
    _isOpen ? _close() : _open();
  }

  function _open() {
    _isOpen = true;
    const panel = document.getElementById('chat-panel');
    const btn   = document.getElementById('chat-toggle-btn');
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    if (_messages.length === 0) _addWelcome();
    // Focus input
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) input.focus();
    }, 50);
  }

  function _close() {
    _isOpen = false;
    const panel = document.getElementById('chat-panel');
    const btn   = document.getElementById('chat-toggle-btn');
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }

  function _addWelcome() {
    const labels = {
      'prompt':      'Prompt Engineering',
      'gemini-chat': 'Gemini Chat',
      'canvas':      'Canvas',
      'gems':        'Custom Gems',
      'notebooklm':  'NotebookLM',
      'nano':        'Gemini Nano'
    };
    const name = labels[_moduleId] || _moduleId;
    _appendMessage('model',
      `Hi! I'm your Study Buddy for the <strong>${_esc(name)}</strong> module. ` +
      `I can explain concepts, give examples, and offer hints. ` +
      `What would you like to know?`
    , true);
  }

  function _clearHistory() {
    _messages = [];
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    document.getElementById('chat-chips').hidden = false;
    _addWelcome();
  }

  // ── Messaging ───────────────────────────────────────────────────
  function _handleSend(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('chat-input');
    const text  = input.value.trim();
    if (!text || _isLoading) return;
    input.value = '';
    _sendMessage(text);
  }

  function _sendMessage(text) {
    // Hide chips after first message
    document.getElementById('chat-chips').hidden = true;

    _appendMessage('user', _esc(text));
    _messages.push({ role: 'user', text });

    // Keep history within limit
    if (_messages.length > MAX_HISTORY) {
      _messages = _messages.slice(-MAX_HISTORY);
    }

    _setLoading(true);
    _callAPI(text);
  }

  function _callAPI() {
    const isMock = new URLSearchParams(window.location.search).has(MOCK_PARAM);
    const url    = isMock ? `${API_ENDPOINT}?${MOCK_PARAM}=1` : API_ENDPOINT;

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId: _moduleId, messages: _messages })
    })
      .then(res => {
        if (res.status === 429) throw new Error('rate_limit');
        // Read body regardless of status so we can surface the error message
        return res.json().then(data => ({ ok: res.ok, data }));
      })
      .then(({ ok, data }) => {
        _setLoading(false);
        if (!ok || data.error) {
          const msg = data.error || 'Server error. Please try again.';
          _appendMessage('model', _esc(msg), false, true);
          return;
        }
        const reply = data.reply || 'Sorry, I didn\'t get a response. Please try again.';
        _appendMessage('model', _safeMd(reply));
        _messages.push({ role: 'model', text: reply });
        if (_messages.length > MAX_HISTORY) {
          _messages = _messages.slice(-MAX_HISTORY);
        }
      })
      .catch(err => {
        _setLoading(false);
        let msg = 'Something went wrong. Please try again.';
        if (err.message === 'rate_limit') msg = 'You\'re sending messages too fast. Please wait a moment.';
        else if (err.message === 'Failed to fetch') msg = 'Network error — check your connection and that the server is running.';
        else msg = _esc(err.message) || msg;
        _appendMessage('model', msg, false, true);
      });
  }

  function _setLoading(state) {
    _isLoading = state;
    const sendBtn  = document.getElementById('chat-send-btn');
    const input    = document.getElementById('chat-input');
    const existing = document.getElementById('chat-typing');

    if (state) {
      sendBtn.disabled = true;
      input.disabled   = true;
      if (!existing) {
        const dots = document.createElement('div');
        dots.id = 'chat-typing';
        dots.className = 'chat-typing';
        dots.setAttribute('aria-label', 'Study Buddy is typing');
        dots.innerHTML = '<span></span><span></span><span></span>';
        document.getElementById('chat-messages').appendChild(dots);
        dots.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      sendBtn.disabled = false;
      input.disabled   = false;
      if (existing) existing.remove();
    }
  }

  function _appendMessage(role, html, raw, isError) {
    const container = document.getElementById('chat-messages');
    const bubble    = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-' + role + (isError ? ' chat-bubble-error' : '');
    if (raw) {
      bubble.innerHTML = html;
    } else {
      bubble.innerHTML = html;
    }
    container.appendChild(bubble);
    bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Module complete callback ─────────────────────────────────────
  function _onModuleComplete() {
    _completed = true;
    const banner = document.getElementById('chat-complete-banner');
    if (banner) banner.hidden = false;
    // Optionally send a congratulatory message
    _appendMessage('model', '🎉 Congratulations on passing the quiz! Well done!');
  }

  // ── Missed topics callback ───────────────────────────────────────
  function _onMissedTopics() {
    let missed = [];
    try {
      missed = JSON.parse(sessionStorage.getItem('quizMissedTopics') || '[]');
    } catch (_) { /* ignore */ }

    if (!missed.length) return;

    _open();
    const topicList = missed.slice(0, 5).map(t => `• ${_esc(t)}`).join('\n');
    const msg = `I just took the quiz and I need help with these topics:\n${topicList}\n\nCan you help me understand them better?`;
    setTimeout(() => _sendMessage(msg), 400);
  }

  // ── Utilities ────────────────────────────────────────────────────
  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Minimal safe markdown: bold, line breaks only. No innerHTML from user. */
  function _safeMd(text) {
    return _esc(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // ── Inject CSS ───────────────────────────────────────────────────
  function _injectCSS() {
    if (document.getElementById('chat-widget-css')) return;
    const style = document.createElement('style');
    style.id = 'chat-widget-css';
    style.textContent = `
/* ── Widget container ─────────────────────── */
#chat-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10000;
  font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
}

/* ── Toggle button ───────────────────────── */
#chat-toggle-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #4285F4;
  color: white;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(66,133,244,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.2s;
}
#chat-toggle-btn:hover { background: #3367D6; transform: scale(1.05); }
#chat-toggle-btn:focus-visible { outline: 3px solid #FBBC04; outline-offset: 3px; }

/* ── Panel ───────────────────────────────── */
#chat-panel {
  position: absolute;
  bottom: 68px;
  right: 0;
  width: 340px;
  max-width: calc(100vw - 32px);
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 70vh;
}
#chat-panel[hidden] { display: none; }

/* ── Header ──────────────────────────────── */
#chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #4285F4;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
}
#chat-header span {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-header-actions {
  display: flex;
  gap: 4px;
}
#chat-clear-btn, #chat-close-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: color 0.2s, background 0.2s;
}
#chat-clear-btn:hover, #chat-close-btn:hover {
  color: white;
  background: rgba(255,255,255,0.15);
}
#chat-clear-btn:focus-visible, #chat-close-btn:focus-visible {
  outline: 2px solid white;
}

/* ── Disclaimer ──────────────────────────── */
#chat-disclaimer {
  font-size: 0.75rem;
  color: #57606A;
  background: #F7F8FA;
  padding: 6px 12px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  gap: 6px;
  align-items: center;
}

/* ── Messages ────────────────────────────── */
#chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
}
.chat-bubble {
  max-width: 88%;
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 0.88rem;
  line-height: 1.55;
  word-wrap: break-word;
}
.chat-bubble-user {
  align-self: flex-end;
  background: #4285F4;
  color: white;
  border-bottom-right-radius: 4px;
}
.chat-bubble-model {
  align-self: flex-start;
  background: #F1F3F4;
  color: #1F2328;
  border-bottom-left-radius: 4px;
}
.chat-bubble-error {
  background: #FEF2F2;
  color: #B91C1C;
  border: 1px solid #FECACA;
}

/* ── Typing indicator ────────────────────── */
.chat-typing {
  align-self: flex-start;
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: #F1F3F4;
  border-radius: 14px;
  border-bottom-left-radius: 4px;
}
.chat-typing span {
  width: 7px;
  height: 7px;
  background: #9CA3AF;
  border-radius: 50%;
  animation: chatBounce 1.4s infinite ease-in-out;
}
.chat-typing span:nth-child(2) { animation-delay: 0.2s; }
.chat-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes chatBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── Starter chips ───────────────────────── */
#chat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid #E5E7EB;
}
#chat-chips[hidden] { display: none; }
.chat-chip {
  padding: 5px 11px;
  font-size: 0.78rem;
  background: #EEF2FF;
  color: #3B82D4;
  border: 1px solid #C7D2FE;
  border-radius: 50px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  white-space: normal;
  text-align: left;
}
.chat-chip:hover { background: #4285F4; color: white; border-color: #4285F4; }
.chat-chip:focus-visible { outline: 2px solid #4285F4; outline-offset: 2px; }

/* ── Complete banner ─────────────────────── */
#chat-complete-banner {
  background: #D1FAE5;
  color: #065F46;
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  gap: 7px;
  align-items: center;
  border-top: 1px solid #A7F3D0;
}
#chat-complete-banner[hidden] { display: none; }

/* ── Input form ──────────────────────────── */
#chat-form {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #E5E7EB;
  background: #fff;
  align-items: flex-end;
}
#chat-input {
  flex: 1;
  resize: none;
  border: 1px solid #D1D5DB;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.88rem;
  font-family: inherit;
  line-height: 1.4;
  max-height: 100px;
  overflow-y: auto;
  transition: border-color 0.2s;
}
#chat-input:focus { outline: none; border-color: #4285F4; }
#chat-input:disabled { background: #F3F4F6; }
#chat-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4285F4;
  color: white;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
#chat-send-btn:hover { background: #3367D6; }
#chat-send-btn:disabled { background: #9CA3AF; cursor: not-allowed; }
#chat-send-btn:focus-visible { outline: 2px solid #4285F4; outline-offset: 2px; }

/* ── Screen-reader only ──────────────────── */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* ── Responsive ──────────────────────────── */
@media (max-width: 400px) {
  #chat-widget { right: 12px; bottom: 12px; }
  #chat-panel { width: calc(100vw - 24px); bottom: 72px; right: 0; }
}
    `;
    document.head.appendChild(style);
  }

  // ── Auto-init on DOMContentLoaded ────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
