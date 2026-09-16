// Nav dropdown toggle
const navBtn = document.getElementById('navMenuBtn');
const navDropdown = document.getElementById('navDropdown');
navBtn.addEventListener('click', () => {
  navDropdown.classList.toggle('open');
});
document.addEventListener('click', (e) => {
  if (!navBtn.contains(e.target) && !navDropdown.contains(e.target)) {
    navDropdown.classList.remove('open');
  }
});

// Wrap words in the statement section for scroll-reveal highlight
const statementEl = document.getElementById('statementText');
const words = statementEl.textContent.trim().split(/\s+/);
statementEl.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
const wordSpans = statementEl.querySelectorAll('.word');

function updateStatementHighlight() {
  const rect = statementEl.getBoundingClientRect();
  const vh = window.innerHeight;
  // progress: 0 when section bottom hits viewport bottom, 1 when section top hits viewport top
  const start = vh * 0.85;
  const end = vh * 0.25;
  const total = rect.top - end;
  const range = start - end;
  let progress = 1 - (rect.top - end) / (start - end);
  progress = Math.max(0, Math.min(1, progress));
  const activeCount = Math.round(progress * wordSpans.length);
  wordSpans.forEach((span, i) => {
    span.classList.toggle('active', i < activeCount);
  });
}

window.addEventListener('scroll', updateStatementHighlight, { passive: true });
window.addEventListener('resize', updateStatementHighlight);
updateStatementHighlight();
