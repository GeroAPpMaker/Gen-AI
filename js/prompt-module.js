// ================================
//   STEP NAVIGATION
// ================================
let currentStep = 1;

function goToStep(step) {
    document.querySelectorAll('.step-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById('step-' + step).classList.add('active');

    document.querySelectorAll('.step-nav-item').forEach(item => {
        const itemStep = parseInt(item.getAttribute('data-step'));
        item.classList.remove('active');
        if (itemStep < step) item.classList.add('completed');
        if (itemStep === step) item.classList.add('active');
    });

    currentStep = step;
    document.querySelector('.step-content-area').scrollIntoView({
        behavior: 'smooth', block: 'start'
    });
}

// ================================
//   PRINCIPLE TOGGLE
// ================================
function togglePrinciple(card) {
    const wasExpanded = card.classList.contains('expanded');

    // Close all
    document.querySelectorAll('.principle-card').forEach(c => {
        c.classList.remove('expanded');
    });

    // Toggle current
    if (!wasExpanded) {
        card.classList.add('expanded');
    }
}

// ================================
//   CRAFT DETAIL HIGHLIGHT
// ================================
function showCraftDetail(letter) {
    const el = document.getElementById('craft-' + letter);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 3px rgba(66,133,244,0.3)';
        setTimeout(() => {
            el.style.boxShadow = '';
        }, 2000);
    }
}

// ================================
//   CRAFT PROMPT BUILDER
// ================================
function generateCraftPrompt() {
    const context = document.getElementById('craftC').value.trim();
    const role = document.getElementById('craftR').value.trim();
    const action = document.getElementById('craftA').value.trim();
    const format = document.getElementById('craftF').value.trim();
    const target = document.getElementById('craftT').value.trim();

    if (!context && !role && !action && !format && !target) {
        alert('Please fill in at least one CRAFT component to generate a prompt!');
        return;
    }

    let prompt = '';

    if (context) prompt += `## CONTEXT\n${context}\n\n`;
    if (role) prompt += `## ROLE\n${role}\n\n`;
    if (action) prompt += `## ACTION\n${action}\n\n`;
    if (format) prompt += `## FORMAT\n${format}\n\n`;
    if (target) prompt += `## TARGET AUDIENCE\n${target}`;

    document.getElementById('craftOutputText').textContent = prompt.trim();
    document.getElementById('craftOutput').style.display = 'block';

    document.getElementById('craftOutput').scrollIntoView({
        behavior: 'smooth', block: 'center'
    });
}

function copyCraftPrompt() {
    const text = document.getElementById('craftOutputText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.craft-output-actions .copy-btn');
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = '#34A853';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i> Copy Prompt';
            btn.style.background = '';
        }, 2000);
    });
}

function clearCraftBuilder() {
    document.getElementById('craftC').value = '';
    document.getElementById('craftR').value = '';
    document.getElementById('craftA').value = '';
    document.getElementById('craftF').value = '';
    document.getElementById('craftT').value = '';
    document.getElementById('craftOutput').style.display = 'none';
}

// ================================
//   PROMPT ANALYZER (Step 4)
// ================================
function analyzePrompt() {
    const prompt = document.getElementById('simPrompt').value.trim();

    if (!prompt) {
        alert('Please type a prompt to analyze!');
        return;
    }

    const lower = prompt.toLowerCase();

    // Score each CRAFT component
    const scores = {
        C: analyzeContext(lower),
        R: analyzeRole(lower),
        A: analyzeAction(lower),
        F: analyzeFormat(lower),
        T: analyzeTarget(lower)
    };

    // Calculate total
    const total = Object.values(scores).reduce((sum, s) => sum + s.score, 0);
    const maxScore = 100;

    // Determine grade
    let grade, gradeColor;
    if (total >= 85) { grade = '🏆 Expert Level!'; gradeColor = '#34A853'; }
    else if (total >= 70) { grade = '🌟 Professional!'; gradeColor = '#4285F4'; }
    else if (total >= 50) { grade = '👍 Good Start!'; gradeColor = '#FBBC04'; }
    else { grade = '📚 Needs Work'; gradeColor = '#EA4335'; }

    // Update score circle
    const scoreCircle = document.getElementById('scoreCircle');
    scoreCircle.style.borderColor = gradeColor;
    document.getElementById('scoreValue').textContent = total;
    const gradeEl = document.getElementById('scoreGrade');
    gradeEl.textContent = grade;
    gradeEl.style.color = gradeColor;

    // Build breakdown
    const colors = { C: '#4285F4', R: '#EA4335', A: '#FBBC04', F: '#34A853', T: '#9334E6' };
    const names = { C: 'Context', R: 'Role', A: 'Action', F: 'Format', T: 'Target' };

    let breakdownHTML = '';
    Object.keys(scores).forEach(key => {
        const s = scores[key];
        let statusClass, statusText;
        if (s.score >= 16) { statusClass = 'status-found'; statusText = '✅ Found'; }
        else if (s.score >= 8) { statusClass = 'status-partial'; statusText = '⚠️ Partial'; }
        else { statusClass = 'status-missing'; statusText = '❌ Missing'; }

        breakdownHTML += `
            <div class="craft-score-item">
                <div class="craft-score-letter" style="background:${colors[key]}">${key}</div>
                <span class="craft-score-name">${names[key]}</span>
                <span class="craft-score-status ${statusClass}">${statusText}</span>
            </div>
        `;
    });
    document.getElementById('analysisBreakdown').innerHTML = breakdownHTML;

    // Build suggestions
    let suggestionsHTML = '<h5 style="margin-bottom:10px;">💡 Suggestions to Improve:</h5>';
    Object.keys(scores).forEach(key => {
        if (scores[key].score < 16) {
            scores[key].suggestions.forEach(suggestion => {
                const icon = scores[key].score < 8 ? 'fa-exclamation-circle' : 'fa-info-circle';
                const iconColor = scores[key].score < 8 ? '#EA4335' : '#FBBC04';
                suggestionsHTML += `
                    <div class="suggestion-item">
                        <i class="fas ${icon}" style="color:${iconColor};"></i>
                        <span>${suggestion}</span>
                    </div>
                `;
            });
        }
    });

    if (total >= 85) {
        suggestionsHTML = `
            <div style="text-align:center; padding:15px;">
                <span style="font-size:2rem;">🎉</span>
                <p style="font-weight:600; margin-top:8px;">Excellent prompt! This follows professional prompt engineering best practices.</p>
            </div>
        `;
    }

    document.getElementById('analysisSuggestions').innerHTML = suggestionsHTML;

    // Show result
    document.getElementById('analysisResult').style.display = 'block';
    document.getElementById('analysisResult').scrollIntoView({
        behavior: 'smooth', block: 'center'
    });
}

function analyzeContext(prompt) {
    let score = 0;
    const suggestions = [];

    if (/grade|level|\d+(st|nd|rd|th)\s*grade|k-\d|kindergarten|elementary|middle|high school/i.test(prompt)) score += 5;
    else suggestions.push('Add a <strong>grade level</strong> (e.g., "5th grade", "high school")');

    if (/subject|math|science|english|reading|history|social studies|ela|stem/i.test(prompt)) score += 5;
    else suggestions.push('Mention the <strong>subject area</strong> (e.g., "math", "science")');

    if (/topic|about|unit|chapter|lesson on|covering|studying/i.test(prompt)) score += 5;
    else suggestions.push('Specify the <strong>topic</strong> you want the AI to address');

    if (/\d+\s*min|minutes|hour|period|class time|duration|session/i.test(prompt)) score += 3;
    else suggestions.push('Add <strong>time constraints</strong> (e.g., "45-minute class period")');

    if (/students?|learners?|class of|my class/i.test(prompt)) score += 2;
    else suggestions.push('Mention your <strong>students</strong> or class details');

    return { score: Math.min(score, 20), suggestions };
}

function analyzeRole(prompt) {
    let score = 0;
    const suggestions = [];

    if (/act as|you are|role of|pretend|assume the role|as a/i.test(prompt)) score += 10;
    else suggestions.push('Add a <strong>role assignment</strong> (e.g., "Act as an experienced 4th grade teacher")');

    if (/experienced|veteran|specialist|expert|certified|professional/i.test(prompt)) score += 5;
    else if (score > 0) suggestions.push('Make the role more <strong>specific</strong> (e.g., add "experienced" or "specialist in...")');

    if (/who specializes|trained in|with expertise|known for|focused on/i.test(prompt)) score += 5;
    else if (score > 0) suggestions.push('Add <strong>expertise details</strong> to the role');

    return { score: Math.min(score, 20), suggestions };
}

function analyzeAction(prompt) {
    let score = 0;
    const suggestions = [];

    const actionVerbs = /create|design|develop|write|build|generate|make|draft|produce|plan|outline|compose|prepare|craft|construct|analyze|evaluate|compare|assess|review/i;
    if (actionVerbs.test(prompt)) score += 10;
    else suggestions.push('Use a <strong>strong action verb</strong> (e.g., "Create", "Design", "Develop", "Analyze")');

    if (prompt.length > 100) score += 5;
    else suggestions.push('Add more <strong>detail about what you want</strong> — longer, specific prompts get better results');

    if (/include|with|containing|that has|featuring|incorporating|along with/i.test(prompt)) score += 5;
    else suggestions.push('Specify what to <strong>include</strong> in the output');

    return { score: Math.min(score, 20), suggestions };
}

function analyzeFormat(prompt) {
    let score = 0;
    const suggestions = [];

    if (/bullet|list|table|format|heading|section|column|numbered|step-by-step|organize/i.test(prompt)) score += 10;
    else suggestions.push('Specify a <strong>format</strong> (e.g., "Use bullet points", "Format as a table", "Include headings")');

    if (/\d+\s*(question|item|point|slide|paragraph|sentence|word|page)/i.test(prompt)) score += 5;
    else suggestions.push('Add <strong>quantity specifics</strong> (e.g., "10 questions", "5 bullet points")');

    if (/answer key|rubric|example|template|model|sample/i.test(prompt)) score += 5;
    else suggestions.push('Request <strong>supporting materials</strong> (e.g., "Include an answer key")');

    return { score: Math.min(score, 20), suggestions };
}

function analyzeTarget(prompt) {
    let score = 0;
    const suggestions = [];

    if (/student|learner|age|reading level|ell|esl|iep|special|gifted|struggling|beginner|advanced/i.test(prompt)) score += 10;
    else suggestions.push('Define the <strong>target audience</strong> (e.g., "for 3rd graders", "including ELL students")');

    if (/ell|esl|iep|504|special education|differentiat|accommodate|modify|scaffold/i.test(prompt)) score += 5;
    else suggestions.push('Consider adding <strong>differentiation needs</strong> (ELL, IEP, gifted learners)');

    if (/tone|language|voice|reading level|age.appropriate|kid.friendly|simple|professional/i.test(prompt)) score += 5;
    else suggestions.push('Specify the <strong>tone or language level</strong> for your audience');

    return { score: Math.min(score, 20), suggestions };
}

// ================================
//   TEMPLATE FILTER
// ================================
function filterTemplates(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.template-card').forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function copyTemplate(btn) {
    const templateText = btn.previousElementSibling.textContent.trim();
    navigator.clipboard.writeText(templateText).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i> Copy Template';
            btn.classList.remove('copied');
        }, 2000);
    });
}

// ================================
//   INIT
// ================================
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('hamburger').addEventListener('click', function () {
        document.getElementById('navLinks').classList.toggle('show');
    });
});