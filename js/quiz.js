// ================================================================
//  QUIZ.JS — Reusable quiz component
//
//  Usage (on any module page):
//    Quiz.init('prompt');   // pass the module id
//
//  Requires:
//    - data/quiz-data.js loaded first (defines QUIZ_DATA)
//    - js/app.js loaded (defines markModuleComplete)
//    - A mount point in the HTML:
//        <div id="quiz-mount"></div>
//    - css/modules.css for quiz styles
// ================================================================

const Quiz = (() => {

  // ── Config ───────────────────────────────────────────────────
  const PASS_THRESHOLD = 0.8;        // 80 %
  const STORAGE_KEY    = 'geminiQuizResults';

  // ── State ─────────────────────────────────────────────────────
  let _moduleId   = null;
  let _questions  = [];   // shuffled question objects (each has shuffledOptions, mappedCorrect)
  let _submitted  = false;

  // ── Public API ────────────────────────────────────────────────
  function init(moduleId) {
    _moduleId = moduleId;
    const rawQuestions = (QUIZ_DATA[moduleId] || []).slice();
    if (!rawQuestions.length) {
      console.error('[Quiz] No questions found for module:', moduleId);
      return;
    }
    _start(rawQuestions);
  }

  // ── Private helpers ───────────────────────────────────────────

  function _shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Shuffle question order and option order. Track correct answer by id. */
  function _prepareQuestions(raw) {
    return _shuffle(raw).map(q => {
      const correctText = q.options[q.correctIndex];
      const shuffledOptions = _shuffle(q.options);
      return {
        ...q,
        shuffledOptions,
        mappedCorrect: shuffledOptions.indexOf(correctText)
      };
    });
  }

  function _start(raw) {
    _questions = _prepareQuestions(raw);
    _submitted = false;
    _render();
  }

  function _escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _render() {
    const mount = document.getElementById('quiz-mount');
    if (!mount) return;

    const total = _questions.length;
    let questionsHTML = '';

    _questions.forEach((q, qi) => {
      const fieldsetId = `quiz-q-${qi}`;
      let optionsHTML = '';
      q.shuffledOptions.forEach((opt, oi) => {
        const inputId = `${fieldsetId}-opt-${oi}`;
        optionsHTML += `
          <label class="quiz-option" for="${inputId}">
            <input type="radio" id="${inputId}" name="${fieldsetId}" value="${oi}">
            <span class="option-text">${_escape(opt)}</span>
          </label>`;
      });

      questionsHTML += `
        <div class="quiz-question" id="${fieldsetId}-wrap">
          <fieldset>
            <legend>
              <span class="question-number">Question ${qi + 1} of ${total}</span>
              <span class="question-text">${_escape(q.text)}</span>
            </legend>
            <div class="quiz-options" role="radiogroup">
              ${optionsHTML}
            </div>
          </fieldset>
        </div>`;
    });

    mount.innerHTML = `
      <div class="quiz-container" id="quiz-container" aria-live="polite">
        <form id="quiz-form" novalidate>
          ${questionsHTML}
          <button type="button" class="submit-quiz-btn" id="quiz-submit-btn" onclick="Quiz._handleSubmit()">
            <i class="fas fa-check-circle" aria-hidden="true"></i> Submit Answers
          </button>
        </form>

        <div class="quiz-results hidden" id="quiz-results" aria-live="assertive">
          <div class="results-icon" id="quiz-results-icon" aria-hidden="true"></div>
          <h3 id="quiz-results-title"></h3>
          <p id="quiz-results-text"></p>
          <div class="results-score" id="quiz-results-score"></div>
          <div class="results-review" id="quiz-results-review"></div>
          <div class="results-actions" id="quiz-results-actions"></div>
        </div>

        <div class="completion-badge hidden" id="quiz-completion-badge">
          <div class="badge-animation">
            <div class="badge-circle" style="background: linear-gradient(135deg, #4285F4, #34A853);">
              <i class="fas fa-award" aria-hidden="true"></i>
            </div>
            <h2>🎓 Module Complete!</h2>
            <p id="quiz-badge-text"></p>
            <div class="badge-stars">⭐⭐⭐</div>
            <div class="badge-actions" id="quiz-badge-actions"></div>
          </div>
        </div>
      </div>`;
  }

  function _handleSubmit() {
    if (_submitted) return;
    _submitted = true;

    let correct = 0;
    const missedTopics = [];

    _questions.forEach((q, qi) => {
      const fieldsetId = `quiz-q-${qi}`;
      const selected = document.querySelector(`input[name="${fieldsetId}"]:checked`);
      const userIndex = selected ? parseInt(selected.value, 10) : -1;
      const isCorrect = userIndex === q.mappedCorrect;

      if (isCorrect) {
        correct++;
      } else {
        missedTopics.push(q.text);
      }

      // Visual feedback
      q.shuffledOptions.forEach((_, oi) => {
        const inputId = `${fieldsetId}-opt-${oi}`;
        const input = document.getElementById(inputId);
        const label = input ? input.closest('.quiz-option') : null;
        if (!label) return;
        if (oi === q.mappedCorrect) {
          label.classList.add('correct');
          label.setAttribute('aria-label', label.textContent.trim() + ' — correct answer');
        } else if (oi === userIndex && !isCorrect) {
          label.classList.add('incorrect');
          label.setAttribute('aria-label', label.textContent.trim() + ' — incorrect');
        }
      });

      // Disable all inputs for this question
      document.querySelectorAll(`input[name="${fieldsetId}"]`).forEach(inp => { inp.disabled = true; });
    });

    // Build review HTML
    let reviewHTML = '';
    _questions.forEach((q, qi) => {
      const fieldsetId = `quiz-q-${qi}`;
      const selected = document.querySelector(`input[name="${fieldsetId}"]:checked`);
      const userIndex = selected ? parseInt(selected.value, 10) : -1;
      const isCorrect = userIndex === q.mappedCorrect;
      const icon = isCorrect ? 'fa-check-circle' : 'fa-times-circle';
      const cls  = isCorrect ? 'review-correct' : 'review-incorrect';
      reviewHTML += `
        <div class="review-item ${cls}">
          <i class="fas ${icon}" aria-hidden="true"></i>
          <span><strong>Q${qi + 1}:</strong> ${_escape(q.explanation)}</span>
        </div>`;
    });

    const total      = _questions.length;
    const pct        = correct / total;
    const passed     = pct >= PASS_THRESHOLD;
    const pctDisplay = Math.round(pct * 100);

    // Persist results
    _saveResult(pctDisplay, passed);

    // Show result panel
    document.getElementById('quiz-submit-btn').style.display = 'none';
    const resultsDiv = document.getElementById('quiz-results');
    resultsDiv.classList.remove('hidden');
    document.getElementById('quiz-results-score').textContent = `${correct} / ${total} (${pctDisplay}%)`;
    document.getElementById('quiz-results-review').innerHTML = reviewHTML;

    if (passed) {
      document.getElementById('quiz-results-icon').textContent = '🏆';
      document.getElementById('quiz-results-title').textContent = 'Excellent work!';
      document.getElementById('quiz-results-text').textContent = `You scored ${pctDisplay}% — module passed!`;
      document.getElementById('quiz-results-actions').innerHTML = `
        <button class="btn-secondary" onclick="Quiz._handleRetake()">
          <i class="fas fa-redo" aria-hidden="true"></i> Retake
        </button>
        <button class="btn-primary" id="quiz-complete-btn" onclick="Quiz._handleComplete()">
          <i class="fas fa-trophy" aria-hidden="true"></i> Complete Module
        </button>`;
    } else {
      document.getElementById('quiz-results-icon').textContent = '📚';
      document.getElementById('quiz-results-title').textContent = 'Not quite — you need 80% to pass';
      document.getElementById('quiz-results-text').textContent = `You scored ${pctDisplay}% (${correct}/${total}). Review the explanations and try again.`;
      document.getElementById('quiz-results-actions').innerHTML = `
        <button class="btn-primary" onclick="Quiz._handleRetake()">
          <i class="fas fa-redo" aria-hidden="true"></i> Retake Quiz
        </button>
        ${_buildStudyBuddyBtn(missedTopics)}`;
    }

    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function _buildStudyBuddyBtn(missedTopics) {
    if (!missedTopics.length) return '';
    // Store missed topics for chat.js to pick up
    try {
      sessionStorage.setItem('quizMissedTopics', JSON.stringify(missedTopics));
    } catch (_) { /* ignore */ }
    return `
      <button class="btn-secondary" onclick="Quiz._openStudyBuddy()">
        <i class="fas fa-comment-dots" aria-hidden="true"></i> Ask Study Buddy about missed topics
      </button>`;
  }

  function _openStudyBuddy() {
    // Chat widget listens for this event
    document.dispatchEvent(new CustomEvent('studyBuddyMissed', {
      detail: { moduleId: _moduleId }
    }));
    // Also open the chat panel if it exists
    const toggle = document.getElementById('chat-toggle-btn');
    if (toggle) toggle.click();
  }

  function _handleRetake() {
    const rawQuestions = (QUIZ_DATA[_moduleId] || []).slice();
    _start(rawQuestions);
  }

  function _handleComplete() {
    if (typeof markModuleComplete === 'function') {
      markModuleComplete(_moduleId);
    }
    document.getElementById('quiz-container').style.display = 'none';

    const badge    = document.getElementById('quiz-completion-badge');
    const badgeText = document.getElementById('quiz-badge-text');
    const badgeActions = document.getElementById('quiz-badge-actions');

    // Module metadata for badge
    const meta = {
      prompt:       { name: 'Professional Prompt Engineering', next: 'gemini-chat.html',  nextLabel: 'Gemini Chat' },
      'gemini-chat':{ name: 'Gemini Chat',                    next: 'canvas.html',        nextLabel: 'Canvas' },
      canvas:       { name: 'Gemini Canvas',                  next: 'gems.html',          nextLabel: 'Custom Gems' },
      gems:         { name: 'Custom Gems',                    next: 'notebook-lm.html',   nextLabel: 'NotebookLM' },
      notebooklm:   { name: 'NotebookLM',                     next: 'nano.html',          nextLabel: 'Gemini Nano' },
      nano:         { name: 'Gemini Nano',                    next: '../index.html',      nextLabel: 'Home' }
    };
    const m = meta[_moduleId] || { name: _moduleId, next: '../index.html', nextLabel: 'Home' };

    badgeText.innerHTML = `You've mastered <strong>${_escape(m.name)}</strong>!`;
    badgeActions.innerHTML = `
      <a href="${m.next}" class="btn-primary">
        Next: ${_escape(m.nextLabel)} <i class="fas fa-arrow-right" aria-hidden="true"></i>
      </a>
      <a href="../index.html" class="btn-secondary">
        <i class="fas fa-home" aria-hidden="true"></i> Back to Home
      </a>`;

    badge.classList.remove('hidden');
    badge.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Notify chat widget that module is complete
    document.dispatchEvent(new CustomEvent('moduleCompleted', { detail: { moduleId: _moduleId } }));
  }

  function _saveResult(pctDisplay, passed) {
    let results = {};
    try { results = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (_) { /* ignore */ }
    const prev = results[_moduleId] || { best: 0, attempts: 0, passed: false };
    results[_moduleId] = {
      best:     Math.max(prev.best, pctDisplay),
      attempts: prev.attempts + 1,
      passed:   prev.passed || passed
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(results)); } catch (_) { /* ignore */ }
  }

  // Expose internal handlers (called from inline onclick — must be on the global object)
  return { init, _handleSubmit, _handleRetake, _handleComplete, _openStudyBuddy };

})();
