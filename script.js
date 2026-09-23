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

// Statement section: pinned (position:sticky) while the words fill in one by one on scroll,
// then releases back to normal scrolling. Scrolling back up empties it out the same way, since
// the fill is driven purely by scroll position, not by a direction/step counter.
const statementEl = document.getElementById('statementText');
const statementSection = document.getElementById('statementSection');
if (statementEl && statementSection) {
  const words = statementEl.textContent.trim().split(/\s+/);
  statementEl.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
  const wordSpans = statementEl.querySelectorAll('.word');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateStatementHighlight() {
    let progress;
    if (reduceMotion) {
      // no pin/scroll-jack for reduced motion: fill in as the (normal-height) section passes through
      const rect = statementEl.getBoundingClientRect();
      const vh = window.innerHeight;
      progress = 1 - (rect.top - vh * 0.25) / (vh * 0.85 - vh * 0.25);
    } else {
      const rect = statementSection.getBoundingClientRect();
      const scrollable = statementSection.offsetHeight - window.innerHeight;
      progress = scrollable > 0 ? -rect.top / scrollable : (rect.top < window.innerHeight / 2 ? 1 : 0);
    }
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

  /* Media in later slides is deferred (data-src) so a case study opens with two slides' worth of assets, not all of them.
     Images load for the current and next slide; prototype iframes only for the slide on screen. */
  function hydrate(slide, withFrames) {
    if (!slide) return;
    slide.querySelectorAll('[data-src]').forEach((n) => {
      if (n.tagName === 'IFRAME' && !withFrames) return;
      n.src = n.getAttribute('data-src'); n.removeAttribute('data-src');
    });
  }

  function renderDeck() {
    hydrate(slides[current], true); hydrate(slides[current + 1], false);
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
  const shots = [...list.closest('.slide').querySelectorAll('.fs-panel [data-shot]')];
  const btns = [...list.querySelectorAll('.fs-pstep')];
  const mark = (step) => {
    btns.forEach((b) => {
      if (b.dataset.step === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    shots.forEach((n) => n.classList.toggle('on', n.dataset.shot === step));
  };
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!frame || e.source !== frame.contentWindow || !d || d.arivooProto !== key || typeof d.step !== 'string') return;
    mark(d.step);
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.fs-pstep');
    if (!b) return;
    mark(b.dataset.step);
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ arivooProto: key, goto: b.dataset.step }, '*');
  });
  // space / arrows on a focused step must not flip the slide
  list.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key.startsWith('Arrow')) e.stopPropagation(); });
});

// Stan: a Thoughts card opens the real onboarding recording full-screen, then asks for quick feedback by email
(() => {
  const open = document.getElementById('stanOpen'), modal = document.getElementById('stanModal');
  if (!open || !modal) return;
  const MAIL = 'ankit.yadav383@gmail.com';
  const video = document.getElementById('stanVideo'), skip = document.getElementById('stanNext');
  const playScreen = document.getElementById('stanPlay'), formPanel = document.getElementById('stanFormPanel'), form = document.getElementById('stanForm');
  const stars = document.getElementById('stanStars'), msg = document.getElementById('stanMsg'), send = document.getElementById('stanSend'), mail = document.getElementById('stanMail');
  let rating = 0, lastFocus = null;

  function show(step) {
    playScreen.hidden = step !== 'play'; formPanel.hidden = step !== 'form';
    if (step === 'play') skip.focus({ preventScroll: true });
    else document.getElementById('stanExp').focus({ preventScroll: true });
  }
  function openModal(e) {
    e.preventDefault(); lastFocus = document.activeElement; modal.hidden = false; document.body.classList.add('stan-lock');
    show('play'); video.currentTime = 0; video.play().catch(() => {});
    document.getElementById('stanClose').focus({ preventScroll: true });
  }
  function closeModal() {
    modal.hidden = true; document.body.classList.remove('stan-lock');
    video.pause(); video.currentTime = 0;   // stop the video, next open starts fresh
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  video.addEventListener('ended', () => show('form'));
  skip.addEventListener('click', () => { video.pause(); show('form'); });
  document.getElementById('stanBack').addEventListener('click', () => { show('play'); video.currentTime = 0; video.play().catch(() => {}); });
  // surprise card: teaser lines type themselves out, one after another (only while on screen, static if reduced motion)
  const typeEl = document.getElementById('stanType');
  if (typeEl && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const LINES = ['Help me build this better.', 'Watch the whole onboarding.', 'Sixty seconds. Real feedback.', 'See it, then tell me what you think.'];
    let li = 0, ci = 0, dir = 1, tm = 0, run = false;
    const tick = () => {
      const line = LINES[li];
      ci += dir; typeEl.textContent = line.slice(0, ci);
      let wait = dir > 0 ? 55 + Math.random() * 45 : 22;
      if (dir > 0 && ci === line.length) { dir = -1; wait = 1900; }
      else if (dir < 0 && ci === 0) { dir = 1; li = (li + 1) % LINES.length; wait = 350; }
      tm = setTimeout(tick, wait);
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !run) { run = true; tick(); } else if (!e.isIntersecting && run) { run = false; clearTimeout(tm); } }, { threshold: .3 });
    io.observe(open);
  }
  open.addEventListener('click', openModal);
  open.addEventListener('keydown', (e) => { if (e.key === ' ') openModal(e); });
  document.getElementById('stanClose').addEventListener('click', closeModal);
  modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  for (let i = 1; i <= 5; i++) {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false'); b.setAttribute('aria-label', i + (i === 1 ? ' star' : ' stars')); b.dataset.v = i;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>'; stars.appendChild(b);
  }
  stars.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; rating = +b.dataset.v;
    stars.querySelectorAll('button').forEach((x) => { x.classList.toggle('on', +x.dataset.v <= rating); x.setAttribute('aria-checked', +x.dataset.v === rating ? 'true' : 'false'); });
  });
  const val = (id) => document.getElementById(id).value.trim();
  const payload = () => ({ rating: rating ? rating + ' / 5' : 'not given', feedback: val('stanExp') || '(none)', reply_email: val('stanEmail') || '(none)', source: 'Portfolio: Stan prototype card' });
  const mailto = () => 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Stan prototype feedback') + '&body=' + encodeURIComponent(Object.entries(payload()).map(([k, v]) => k.replace(/_/g, ' ') + ': ' + v).join('\n'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); msg.className = 'stan-msg'; mail.hidden = true;
    if (!rating && !val('stanExp')) { msg.className = 'stan-msg err'; msg.textContent = 'Add a rating or a line of feedback first.'; return; }
    if (document.getElementById('stanHoney').value) return;
    const em = val('stanEmail'); if (em && !/^\S+@\S+\.\S+$/.test(em)) { msg.className = 'stan-msg err'; msg.textContent = 'That email does not look right. Leave it empty if you prefer.'; return; }
    send.disabled = true; send.textContent = 'Sending...'; msg.textContent = '';
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + MAIL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: 'Stan prototype feedback', _template: 'table', _captcha: 'false', ...(em ? { _replyto: em } : {}), ...payload() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === 'false') throw new Error(data.message || 'failed');
      form.classList.add('sent'); msg.className = 'stan-msg ok'; msg.textContent = 'Sent. Thank you, this lands straight in my inbox.'; send.hidden = true;
    } catch (err) {
      msg.className = 'stan-msg err'; msg.textContent = 'Could not send it from here. Email it instead, nothing is lost.'; mail.href = mailto(); mail.hidden = false; send.disabled = false; send.textContent = 'Try again';
    }
  });
})();
