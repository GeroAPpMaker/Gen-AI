// ================================================================
//  MODULE ORDER & LOCK LOGIC
// ================================================================
const MODULE_ORDER = ['prompt', 'gemini-chat', 'canvas', 'gems', 'notebooklm', 'nano'];

// Map from module id → page filename (used by lock guard on module pages)
const MODULE_PAGE = {
  'prompt':      'prompt-engineering.html',
  'gemini-chat': 'gemini-chat.html',
  'canvas':      'canvas.html',
  'gems':        'gems.html',
  'notebooklm':  'notebook-lm.html',
  'nano':        'nano.html'
};

// Map from page filename → module id (reverse lookup)
const PAGE_MODULE = Object.fromEntries(
  Object.entries(MODULE_PAGE).map(([k, v]) => [v, k])
);

/** Returns true if the module is unlocked (index 0 always unlocked). */
function isModuleUnlocked(moduleId) {
  const idx = MODULE_ORDER.indexOf(moduleId);
  if (idx <= 0) return true;
  const prevId = MODULE_ORDER[idx - 1];
  const results = _getQuizResults();
  return !!(results[prevId] && results[prevId].passed);
}

function _getQuizResults() {
  try { return JSON.parse(localStorage.getItem('geminiQuizResults')) || {}; } catch (_) { return {}; }
}

/**
 * Called on module pages. If the page is locked, hides the main content
 * and shows a friendly "Complete previous module first" message.
 */
function enforceModuleLock() {
  const filename = window.location.pathname.split('/').pop();
  const moduleId = PAGE_MODULE[filename];
  if (!moduleId) return;                    // unknown page — do nothing
  if (isModuleUnlocked(moduleId)) return;  // unlocked — do nothing

  const idx = MODULE_ORDER.indexOf(moduleId);
  const prevId = MODULE_ORDER[idx - 1];
  const prevPage = MODULE_PAGE[prevId];

  // Hide lesson content, show lock message
  const main = document.querySelector('main');
  if (main) main.style.display = 'none';

  const msg = document.createElement('div');
  msg.className = 'locked-page-message';
  msg.setAttribute('role', 'alert');
  msg.innerHTML = `
    <div class="lock-icon"><i class="fas fa-lock" aria-hidden="true"></i></div>
    <h2>Module Locked</h2>
    <p>Complete <strong>${_moduleLabel(prevId)}</strong> with a score of 80% or higher to unlock this module.</p>
    <a href="${prevPage}" class="btn-primary">
      Go to ${_moduleLabel(prevId)} <i class="fas fa-arrow-right" aria-hidden="true"></i>
    </a>`;
  document.body.appendChild(msg);
}

function _moduleLabel(id) {
  const labels = {
    'prompt':      'Prompt Engineering',
    'gemini-chat': 'Gemini Chat',
    'canvas':      'Canvas',
    'gems':        'Custom Gems',
    'notebooklm':  'NotebookLM',
    'nano':        'Gemini Nano'
  };
  return labels[id] || id;
}

// ================================
//   HAMBURGER MENU
// ================================
document.getElementById('hamburger').addEventListener('click', function () {
    document.getElementById('navLinks').classList.toggle('show');
});

// ================================
//   PROGRESS TRACKER
// ================================
function updateProgress() {
    const completed = JSON.parse(localStorage.getItem('geminiCompleted')) || [];
    const quizResults = _getQuizResults();
    const totalModules = 6;
    const percentage = Math.round((completed.length / totalModules) * 100);

    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
        document.getElementById('progressText').textContent = percentage + '% Complete';
    }

    document.querySelectorAll('.progress-module').forEach(mod => {
        const moduleName = mod.getAttribute('data-module');
        const icon = mod.querySelector('i');
        const scoreEl = mod.querySelector('.module-best-score');
        const result = quizResults[moduleName];

        if (completed.includes(moduleName)) {
            icon.className = 'fas fa-circle-check';
            icon.style.color = '#34A853';
        } else {
            icon.className = 'far fa-circle';
            icon.style.color = '';
        }

        // Show best score if available
        if (scoreEl && result && result.best > 0) {
            scoreEl.textContent = result.best + '%';
        }
    });

    // Lock/unlock module cards on home page
    document.querySelectorAll('.module-card[data-module]').forEach(card => {
        const moduleId = card.getAttribute('data-module');
        if (!moduleId) return;
        const unlocked = isModuleUnlocked(moduleId);
        const existingLock = card.querySelector('.module-lock-overlay');

        if (!unlocked) {
            card.classList.add('locked');
            card.removeAttribute('onclick');
            if (!existingLock) {
                const overlay = document.createElement('div');
                overlay.className = 'module-lock-overlay';
                overlay.setAttribute('aria-label', 'Locked');
                overlay.innerHTML = '<i class="fas fa-lock" aria-hidden="true"></i>';
                card.style.position = 'relative';
                card.appendChild(overlay);
            }
        } else {
            card.classList.remove('locked');
            if (existingLock) existingLock.remove();
        }
    });
}

function markModuleComplete(moduleName) {
    let completed = JSON.parse(localStorage.getItem('geminiCompleted')) || [];
    if (!completed.includes(moduleName)) {
        completed.push(moduleName);
        localStorage.setItem('geminiCompleted', JSON.stringify(completed));
    }
    updateProgress();
}

// ================================
//   SMOOTH SCROLL
// ================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ================================
//   SCROLL ANIMATIONS
// ================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function () {
    updateProgress();

    // Add scroll animations
    document.querySelectorAll('.module-card, .why-card, .path-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
});

// Animation class
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    </style>
`);