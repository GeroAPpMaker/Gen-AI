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
        if (completed.includes(moduleName)) {
            icon.className = 'fas fa-circle-check';
            icon.style.color = '#34A853';
        } else {
            icon.className = 'far fa-circle';
            icon.style.color = '';
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