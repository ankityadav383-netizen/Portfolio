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

// Pinned hero: scroll-linked grayscale portrait + copyright reveal
const heroWrap = document.getElementById('heroWrap');
const heroPortrait = document.getElementById('heroPortrait');
const heroCopyright = document.getElementById('heroCopyright');

function updateHero() {
  const rect = heroWrap.getBoundingClientRect();
  const vh = window.innerHeight;
  const scrolled = -rect.top;
  const range = rect.height - vh;
  let progress = range > 0 ? scrolled / range : 0;
  progress = Math.max(0, Math.min(1, progress));

  heroPortrait.style.filter = `grayscale(${Math.min(1, progress * 1.6) * 100}%)`;

  const copyProgress = Math.max(0, Math.min(1, (progress - 0.25) / 0.5));
  heroCopyright.style.opacity = copyProgress;
  heroCopyright.style.transform = `translateY(${16 * (1 - copyProgress)}px)`;
}

window.addEventListener('scroll', updateHero, { passive: true });
window.addEventListener('resize', updateHero);
updateHero();
