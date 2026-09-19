// Nav dropdown toggle (not present on slide-deck project pages)
const navPill = document.getElementById('navPill');
const navBtn = document.getElementById('navMenuBtn');
const navDropdown = document.getElementById('navDropdown');
if (navPill && navBtn && navDropdown) {
  navBtn.addEventListener('click', () => {
    navPill.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!navPill.contains(e.target)) {
      navPill.classList.remove('open');
    }
  });
  navDropdown.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navPill.classList.remove('open'));
  });
}

// Wrap words in the statement section for scroll-reveal highlight (homepage only)
const statementEl = document.getElementById('statementText');
if (statementEl) {
  const words = statementEl.textContent.trim().split(/\s+/);
  statementEl.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
  const wordSpans = statementEl.querySelectorAll('.word');

  function updateStatementHighlight() {
    const rect = statementEl.getBoundingClientRect();
    const vh = window.innerHeight;
    // progress: 0 when section bottom hits viewport bottom, 1 when section top hits viewport top
    const start = vh * 0.85;
    const end = vh * 0.25;
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
}

// Morph: the hero portrait flips (monochrome -> colour) and travels down
// into the About section's image slot as one continuous scroll animation.
// (homepage only)
const heroWrap = document.getElementById('heroWrap');
const morphCard = document.getElementById('morphCard');
const aboutSection = document.getElementById('about');

if (heroWrap && morphCard && aboutSection) {
  const heroPortraitBox = document.querySelector('.hero-portrait');
  const introImageBox = document.querySelector('.intro-image');
  const introColText = document.querySelector('.intro-col-text');
  const introColBody = document.querySelector('.intro-col-body');

  const lerp = (a, b, t) => a + (b - a) * t;

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
}

// Slide-deck controller (project case study pages)
const deck = document.querySelector('.deck');
if (deck) {
  const slides = [...deck.querySelectorAll('.slide')];
  const prevBtn = document.querySelector('.deck-prev');
  const nextBtn = document.querySelector('.deck-next');
  const counterEl = document.querySelector('.deck-counter');
  const progressBar = document.querySelector('.deck-progress-bar');
  let current = 0;

  // Figma-sourced decks (1920x1080 stage): scale the stage to fit the viewport
  // and swap the chrome between dark and light slides.
  const isFigmaDeck = deck.classList.contains('deck-fs');
  function fitStage() {
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    deck.style.setProperty('--s', s.toFixed(5));
  }
  if (isFigmaDeck) {
    fitStage();
    window.addEventListener('resize', fitStage);
  }

  function renderDeck() {
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    if (isFigmaDeck) {
      document.body.classList.toggle('deck-dark', slides[current].dataset.theme === 'dark');
    }
    if (counterEl) {
      counterEl.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    }
    if (progressBar) {
      progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
    }
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === slides.length - 1;
  }

  function goTo(i) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    renderDeck();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') goTo(current + 1);
    if (e.key === 'ArrowLeft') goTo(current - 1);
  });

  let touchStartX = null;
  deck.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  deck.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) goTo(dx < 0 ? current + 1 : current - 1);
    touchStartX = null;
  }, { passive: true });

  // Deep link: project-arivoo.html#slide-3
  const m = /^#slide-(\d+)$/.exec(window.location.hash);
  if (m) current = Math.max(0, Math.min(slides.length - 1, parseInt(m[1], 10) - 1));

  renderDeck();
}

// Interactive prototype slides: keep the left-hand step list in step with the embedded prototype (and vice versa)
document.querySelectorAll('[data-proto-steps]').forEach((list) => {
  const key = list.dataset.protoSteps;
  const frame = list.closest('.slide').querySelector('iframe');
  const btns = [...list.querySelectorAll('.fs-pstep')];
  const mark = (step) => btns.forEach((b) => {
    if (b.dataset.step === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!frame || e.source !== frame.contentWindow || !d || d.arivooProto !== key || typeof d.step !== 'string') return;
    mark(d.step);
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.fs-pstep');
    if (!b || !frame || !frame.contentWindow) return;
    mark(b.dataset.step);
    frame.contentWindow.postMessage({ arivooProto: key, goto: b.dataset.step }, '*');
  });
  // space / arrows on a focused step must not flip the slide
  list.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key.startsWith('Arrow')) e.stopPropagation(); });
});
