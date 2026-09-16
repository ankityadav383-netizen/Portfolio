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

// Pinned hero: scroll-linked copyright reveal (portrait stays monochrome)
const heroWrap = document.getElementById('heroWrap');
const heroCopyright = document.getElementById('heroCopyright');

function updateHero() {
  const rect = heroWrap.getBoundingClientRect();
  const vh = window.innerHeight;
  const scrolled = -rect.top;
  const range = rect.height - vh;
  let progress = range > 0 ? scrolled / range : 0;
  progress = Math.max(0, Math.min(1, progress));

  const copyProgress = Math.max(0, Math.min(1, (progress - 0.25) / 0.5));
  heroCopyright.style.opacity = copyProgress;
  heroCopyright.style.transform = `translateY(${16 * (1 - copyProgress)}px)`;
}

window.addEventListener('scroll', updateHero, { passive: true });
window.addEventListener('resize', updateHero);
updateHero();

// Morph: the hero portrait flips (monochrome -> colour) and travels down
// into the About section's image slot as one continuous scroll animation.
const morphCard = document.getElementById('morphCard');
const heroPortraitBox = document.querySelector('.hero-portrait');
const introImageBox = document.querySelector('.intro-image');
const aboutSection = document.getElementById('about');
const introColText = document.querySelector('.intro-col-text');
const introColBody = document.querySelector('.intro-col-body');

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function updateMorph() {
  const vh = window.innerHeight;
  const morphStart = heroWrap.offsetTop + heroWrap.offsetHeight - vh;
  const morphEnd = aboutSection.offsetTop;
  let progress = (window.scrollY - morphStart) / (morphEnd - morphStart);
  progress = Math.max(0, Math.min(1, progress));

  const inMorph = progress > 0 && progress < 1;
  heroPortraitBox.style.visibility = inMorph ? 'hidden' : 'visible';
  introImageBox.style.visibility = inMorph ? 'hidden' : 'visible';
  morphCard.style.opacity = inMorph ? '1' : '0';

  if (inMorph) {
    const heroRect = heroPortraitBox.getBoundingClientRect();
    const aboutRect = introImageBox.getBoundingClientRect();
    morphCard.style.left = `${lerp(heroRect.left, aboutRect.left, progress)}px`;
    morphCard.style.top = `${lerp(heroRect.top, aboutRect.top, progress)}px`;
    morphCard.style.width = `${lerp(heroRect.width, aboutRect.width, progress)}px`;
    morphCard.style.height = `${lerp(heroRect.height, aboutRect.height, progress)}px`;
    const heroRadius = parseFloat(getComputedStyle(heroPortraitBox).borderRadius) || 16;
    const aboutRadius = parseFloat(getComputedStyle(introImageBox).borderRadius) || 20;
    morphCard.style.borderRadius = `${lerp(heroRadius, aboutRadius, progress)}px`;
    morphCard.style.transform = `perspective(1600px) rotateY(${progress * 180}deg)`;
  }

  [introColText, introColBody].forEach((el) => {
    if (!el) return;
    el.style.opacity = progress;
    el.style.transform = `translateY(${(1 - progress) * 20}px)`;
  });
}

window.addEventListener('scroll', updateMorph, { passive: true });
window.addEventListener('resize', updateMorph);
updateMorph();
