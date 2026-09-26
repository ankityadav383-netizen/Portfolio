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

// Stan: a Thoughts card steps the real onboarding recording through 3 chapters on "Next", with a lightning flash timed exactly to the character reveal
// LOCKED 2026-09-23: card shows a "Coming Soon" tag and isn't clickable. Flip this to false to reopen it -- everything
// below is otherwise untouched and should still work as-is.
(() => {
  const LOCKED = true;
  if (LOCKED) return;
  const open = document.getElementById('stanOpen'), modal = document.getElementById('stanModal');
  if (!open || !modal) return;
  const MAIL = 'ankit.yadav383@gmail.com';
  const REVEAL_TIME = 25.4;   // seconds into onboarding.mp4 where the Skull Thorn character + its lightning bolt are fully visible (re-sampled per recording -- this timestamp is specific to the current video file)
  const STEPS = [
    { seek: 0, title: 'Sign-up asked for too much', caption: 'The old onboarding needed a form before anyone reached the app.' },
    { seek: 16.5, title: 'Truecaller cut it to one tap', caption: 'Swapped the form for Truecaller sign-in and trimmed the home screen down to what a first-time user actually needs.' },
    { seek: 21.0, title: 'A reason to come back', caption: 'Tap-to-unlock a character adds a small game loop that pulls first-timers back.', reveal: true },
  ];
  const video = document.getElementById('stanVideo'), next = document.getElementById('stanNext'), lightning = document.getElementById('stanLightning');
  const play = document.getElementById('stanPlay'), form = document.getElementById('stanForm');
  const stepTitle = document.getElementById('stanTitle'), caption = document.getElementById('stanCaption'), stepLabel = document.getElementById('stanStepLabel'), dotsWrap = document.getElementById('stanDots');
  const stars = document.getElementById('stanStars'), msg = document.getElementById('stanMsg'), send = document.getElementById('stanSend'), mail = document.getElementById('stanMail');
  let rating = 0, lastFocus = null, stepIndex = -1, revealArmed = false;

  STEPS.forEach(() => { const d = document.createElement('span'); d.className = 'stan-dot'; dotsWrap.appendChild(d); });
  const dots = dotsWrap.querySelectorAll('.stan-dot');

  function flashLightning() {
    lightning.classList.remove('flash'); void lightning.offsetWidth; lightning.classList.add('flash');
  }
  // which chapter a given playback position belongs to, so the caption tracks wherever the video actually
  // is -- not just wherever "Next" last sent it. Chapter boundaries are the same seek points Next jumps to,
  // so a manual jump and natural playback always agree on which chapter is showing.
  function stepForTime(t) {
    let idx = 0;
    for (let i = 0; i < STEPS.length; i++) if (t >= STEPS[i].seek) idx = i;
    return idx;
  }
  function renderStep(i) {
    if (i === stepIndex) return;
    stepIndex = i;
    const s = STEPS[i];
    stepTitle.textContent = s.title; caption.textContent = s.caption;
    stepLabel.textContent = (i + 1) + ' / ' + STEPS.length;
    dots.forEach((d, idx) => d.classList.toggle('on', idx === i));
    next.textContent = i === STEPS.length - 1 ? 'Rate it →' : 'Next →';
    if (s.reveal) revealArmed = true;   // arm the moment we enter this chapter, by jump or by natural playback
  }
  // fires exactly once per arm, precisely when playback crosses REVEAL_TIME -- reliable because it's our own
  // local video (no network/embed-boot uncertainty), unlike the live Figma prototype this replaced
  video.addEventListener('timeupdate', () => {
    renderStep(stepForTime(video.currentTime));
    if (revealArmed && video.currentTime >= REVEAL_TIME) { revealArmed = false; flashLightning(); }
  });
  video.addEventListener('ended', () => { if (!play.hidden) show('form'); });
  function seekToStep(i) {
    video.currentTime = STEPS[i].seek;
    video.play().catch(() => {});
    renderStep(i);
  }
  function show(step) { play.hidden = step !== 'play'; form.hidden = step !== 'form'; const t = step === 'play' ? next : document.getElementById('stanExp'); if (t) t.focus({ preventScroll: true }); }
  function openModal(e) {
    e.preventDefault(); lastFocus = document.activeElement; modal.hidden = false; document.body.classList.add('stan-lock');
    seekToStep(0); show('play'); document.getElementById('stanClose').focus({ preventScroll: true });
  }
  function closeModal() {
    modal.hidden = true; document.body.classList.remove('stan-lock');
    video.pause(); revealArmed = false; stepIndex = -1;   // stop the video, next open starts fresh
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  // surprise card: teaser lines type themselves out, one after another (only while on screen, static if reduced motion)
  const typeEl = document.getElementById('stanType');
  if (typeEl && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const LINES = ['Help me build this better.', 'The real recording, lightning and all.', 'Sixty seconds. Real feedback.', 'See it, then tell me what you think.'];
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
  next.addEventListener('click', () => {
    if (stepIndex < STEPS.length - 1) seekToStep(stepIndex + 1); else show('form');
  });
  document.getElementById('stanBack').addEventListener('click', () => show('play'));

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

// Hero star & bolt: pick them up, throw them, and they bounce around the hero (which is a viewport-sized box).
(() => {
  const hero = document.querySelector('.hero');
  const toys = hero ? [...hero.querySelectorAll('.deco')] : [];
  if (!toys.length) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FRICTION = 1.6;     // share of velocity lost per second (exponential)
  const BOUNCE = 0.7;       // energy kept on hitting a wall or the other toy
  const STOP = 22;          // px/s below which a toy is at rest
  const REST_BOUNCE = 60;   // impacts slower than this don't bounce at all (kills endless micro-bounces)
  const MAX_V = 3400;
  const T = toys.map((el) => { el.draggable = false; return { el, x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, held: false, placed: false, s: [] }; });
  // fall into place when the page opens: hidden behind the loader, then dropped from above with a small bounce.
  // (CSS animation on translate/rotate only, so the drag physics below is untouched; grabbing a toy mid-fall cancels it.)
  hero.classList.add('toys-wait');
  const loaderEl = document.getElementById('lpLoader');
  const dropIn = () => {
    hero.classList.remove('toys-wait');
    if (reduceMotion) return;
    hero.classList.add('toys-drop');
    setTimeout(() => hero.classList.remove('toys-drop'), 2000);
  };
  if (loaderEl && !loaderEl.hidden) window.addEventListener('lp:done', dropIn, { once: true }); else dropIn();
  toys.forEach((el) => el.addEventListener('pointerdown', () => hero.classList.remove('toys-drop'), true));
  let raf = 0, last = 0;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const bounds = () => ({ W: hero.clientWidth, H: hero.clientHeight });
  const dpr = () => window.devicePixelRatio || 1;
  const render = (t) => {
    const d = dpr();   // whole device pixels, so a resting toy never shimmers between sub-pixel positions
    // the individual `translate` property (not `transform`): the hover/held `scale` must not multiply the position
    t.el.style.translate = `${Math.round(t.x * d) / d}px ${Math.round(t.y * d) / d}px`;
  };
  const fit = (t) => { const { W, H } = bounds(); t.x = clamp(t.x, 0, Math.max(0, W - t.w)); t.y = clamp(t.y, 0, Math.max(0, H - t.h)); };

  // switch a toy from its CSS-percentage spot to explicit pixel coordinates -- using layout metrics, so the
  // hover/held scale can't inflate the size or make the toy jump when it's first picked up
  function place(t) {
    if (t.placed) return;
    t.w = t.el.offsetWidth; t.h = t.el.offsetHeight; t.x = t.el.offsetLeft; t.y = t.el.offsetTop;
    Object.assign(t.el.style, { left: '0px', top: '0px', right: 'auto', bottom: 'auto' });
    t.placed = true; render(t);
  }

  // two free toys: push them apart (gradually, never a teleport) and bounce. Held toys pass straight through.
  function collide(a, b, dt) {
    const ra = Math.min(a.w, a.h) * 0.36, rb = Math.min(b.w, b.h) * 0.36;
    let dx = (b.x + b.w / 2) - (a.x + a.w / 2), dy = (b.y + b.h / 2) - (a.y + a.h / 2);
    const dist = Math.hypot(dx, dy) || 0.001, min = ra + rb;
    if (dist >= min) return false;
    const nx = dx / dist, ny = dy / dist;
    const push = Math.min(min - dist, 700 * dt + 0.5);     // limited per frame so separation reads as a shove, not a snap
    a.x -= nx * push / 2; a.y -= ny * push / 2; b.x += nx * push / 2; b.y += ny * push / 2;
    fit(a); fit(b);                                        // a toy against a wall can't give way...
    dx = (b.x + b.w / 2) - (a.x + a.w / 2); dy = (b.y + b.h / 2) - (a.y + a.h / 2);
    const left = min - (Math.hypot(dx, dy) || 0.001);
    if (left > 0) { const m = Math.min(left, 700 * dt); b.x += nx * m; b.y += ny * m; fit(b); }   // ...so the other one takes the rest
    const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;   // closing speed along the contact normal
    if (rel < 0) {
      const j = (Math.abs(rel) < REST_BOUNCE ? 1 : 1 + BOUNCE) * -rel / 2;
      a.vx -= j * nx; a.vy -= j * ny; b.vx += j * nx; b.vy += j * ny;
    }
    return true;
  }

  function step(now) {
    if (!last) last = now;
    const dt = clamp((now - last) / 1000, 0.001, 0.033); last = now;
    const { W, H } = bounds();
    let moving = false;
    T.forEach((t) => {
      if (!t.placed) return;
      if (t.held) { moving = true; return; }
      const damp = Math.exp(-FRICTION * dt);
      t.vx *= damp; t.vy *= damp;
      t.x += t.vx * dt; t.y += t.vy * dt;
      if (t.x < 0) { t.x = 0; t.vx = t.vx < -REST_BOUNCE ? -t.vx * BOUNCE : 0; }
      else if (t.x > W - t.w) { t.x = Math.max(0, W - t.w); t.vx = t.vx > REST_BOUNCE ? -t.vx * BOUNCE : 0; }
      if (t.y < 0) { t.y = 0; t.vy = t.vy < -REST_BOUNCE ? -t.vy * BOUNCE : 0; }
      else if (t.y > H - t.h) { t.y = Math.max(0, H - t.h); t.vy = t.vy > REST_BOUNCE ? -t.vy * BOUNCE : 0; }
      if (Math.hypot(t.vx, t.vy) < STOP) t.vx = t.vy = 0; else moving = true;
    });
    if (T.length > 1 && T[0].placed && T[1].placed && !T[0].held && !T[1].held) {
      if (collide(T[0], T[1], dt)) moving = true;
    }
    T.forEach((t) => { if (t.placed) { fit(t); render(t); } });
    raf = moving ? requestAnimationFrame(step) : 0;
  }
  const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(step); } };

  const drop = (t, e) => {
    if (!t.held) return;
    t.held = false; t.el.classList.remove('is-held');
    if (e) { try { t.el.releasePointerCapture(e.pointerId); } catch (_) {} }
    const a = t.s[0], b = t.s[t.s.length - 1], dtm = b.t - a.t;
    const still = e ? e.timeStamp - b.t > 90 : true;      // a pause before letting go means "just drop it", not a throw
    if (reduceMotion || still || dtm < 8) { t.vx = t.vy = 0; }
    else {
      t.vx = clamp((b.x - a.x) / dtm * 1000 * 1.1, -MAX_V, MAX_V);
      t.vy = clamp((b.y - a.y) / dtm * 1000 * 1.1, -MAX_V, MAX_V);
      if (Math.hypot(t.vx, t.vy) < STOP * 2) t.vx = t.vy = 0;
    }
    wake();
  };

  T.forEach((t) => {
    const el = t.el;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || t.held) return;
      e.preventDefault();
      T.forEach(place);    // every toy joins the physics at the first touch, so they always collide with each other
      el.setPointerCapture(e.pointerId);
      const h = hero.getBoundingClientRect();
      t.held = true; t.vx = t.vy = 0;
      t.ox = e.clientX - h.left - t.x; t.oy = e.clientY - h.top - t.y;
      t.s = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
      el.classList.add('is-held');
      wake();
    });
    el.addEventListener('pointermove', (e) => {
      if (!t.held) return;
      const h = hero.getBoundingClientRect();
      t.x = e.clientX - h.left - t.ox; t.y = e.clientY - h.top - t.oy; fit(t);
      t.s.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
      while (t.s.length > 2 && e.timeStamp - t.s[0].t > 110) t.s.shift();
      render(t);
    });
    el.addEventListener('pointerup', (e) => drop(t, e));
    el.addEventListener('pointercancel', (e) => drop(t, e));
    el.addEventListener('lostpointercapture', (e) => drop(t, e));
  });
  // never leave a toy stuck "held" if the pointer is released somewhere we can't see
  window.addEventListener('blur', () => T.forEach((t) => drop(t, null)));
  document.addEventListener('visibilitychange', () => { if (document.hidden) T.forEach((t) => drop(t, null)); });
  window.addEventListener('resize', () => { if (T.some((t) => t.placed)) wake(); });
})();

// Hero "O": the same vinyl clip the loader uses, played directly -- no chroma-key canvas needed
// here since the disk fills the frame edge-to-edge and the container's circular clip hides the
// green corners outside it. Sharper than the old low-res chroma-keyed canvas, especially on retina.
(() => {
  document.querySelectorAll('.lp-disk').forEach((wrap) => {
    const video = wrap.querySelector('.lp-disk-video');
    if (!video) return;
    video.playbackRate = 0.35;   // source footage spins much faster than feels right at this size
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // the loader fully covers the hero, so decoding this video underneath it only steals frames from the
    // loader (halved its frame rate) -- hold it until the record lands
    const loader = document.getElementById('lpLoader');
    if (reduceMotion) video.pause();
    else if (loader && !loader.hidden) window.addEventListener('lp:done', () => video.play().catch(() => {}), { once: true });
    else video.play().catch(() => {});

    // doubles as the loudspeaker's play/pause control once the loader hands off the track to it
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('aria-pressed', 'true');
    wrap.setAttribute('aria-label', 'O — pause the music');
    function toggle() {
      const audio = document.querySelector('[data-lp-audio]');
      if (!audio) return;
      if (audio.paused || audio.muted) {
        delete audio.dataset.userPaused;
        audio.muted = false;
        audio.play().catch(() => {});
        if (!reduceMotion) video.play().catch(() => {});
        wrap.setAttribute('aria-pressed', 'true');
        wrap.setAttribute('aria-label', 'O — pause the music');
        wrap.title = 'Pause music'; wrap.classList.remove('is-paused');
      } else {
        audio.dataset.userPaused = '1';
        audio.pause();
        video.pause();
        wrap.setAttribute('aria-pressed', 'false');
        wrap.setAttribute('aria-label', 'O — play the music');
        wrap.title = 'Play music'; wrap.classList.add('is-paused');
      }
    }
    wrap.addEventListener('click', toggle);
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
    wrap.title = 'Play music';
    // keep the disk's label/state honest: it reflects whether sound is actually playing (it may be blocked by the browser)
    const audioEl = document.querySelector('[data-lp-audio]');
    if (audioEl) {
      const sync = () => {
        const paused = audioEl.paused || audioEl.muted;
        wrap.classList.toggle('is-paused', paused);
        wrap.setAttribute('aria-pressed', String(!paused));
        wrap.setAttribute('aria-label', 'O \u2014 ' + (paused ? 'play' : 'pause') + ' the music');
        wrap.title = paused ? 'Play music' : 'Pause music';
      };
      audioEl.addEventListener('play', sync); audioEl.addEventListener('pause', sync); audioEl.addEventListener('playing', sync);
      sync();
    }

    /* Scroll-linked dock: past a little scroll, the "O" leaves the headline and travels to a fixed spot in the
       bottom-right corner, so the music can be stopped from anywhere; scrolling back up sends it home again.
       The disk follows a *smoothed* scroll position (time-based damping) rather than the raw one, so wheel notches
       and flicks glide instead of jumping, and its geometry is cached so nothing forces layout every frame. */
    const spacer = document.createElement('span');          // holds the O's place in the headline while the disk is away
    spacer.className = 'lp-disk-spacer'; spacer.hidden = true;
    wrap.before(spacer);
    const DOCK = 68, MARGIN = 24, TAU = 0.075;              // TAU: smoothing time constant, seconds
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    let docked = false, natural = 0, homeLeft = 0, homeTop = 0;   // homeLeft/homeTop: the O's slot in *document* coordinates
    let tgtY = window.scrollY, sy = tgtY, raf = 0, last = 0;
    const zone = () => { const vh = window.innerHeight; return [vh * 0.13, vh * 0.58]; };

    function measureHome() {
      const r = spacer.hidden ? wrap.getBoundingClientRect() : spacer.getBoundingClientRect();
      homeLeft = r.left + window.scrollX; homeTop = r.top + window.scrollY; return r;
    }
    function startDock() {
      const r = measureHome(); natural = r.width;
      spacer.style.width = r.width + 'px'; spacer.style.height = r.height + 'px'; spacer.hidden = false;
      wrap.classList.add('is-docked');
      wrap.style.width = r.width + 'px'; wrap.style.height = r.height + 'px';
      document.body.appendChild(wrap);                      // out of the hero's stacking context so nothing scrolls over it
      docked = true;
    }
    function undock() {
      if (!docked) return;
      docked = false;
      spacer.before(wrap);                                  // back into the headline (moved, not cloned: the video keeps playing)
      wrap.classList.remove('is-docked', 'is-far');
      wrap.style.cssText = '';
      spacer.hidden = true;
    }
    function place(p) {
      const e = ease(p), vh = window.innerHeight, cw = document.documentElement.clientWidth;
      const tx = cw - MARGIN - DOCK, ty = vh - MARGIN - DOCK;
      const hx = homeLeft - window.scrollX, hy = homeTop - sy;     // where the O would be at the smoothed scroll position
      const x = hx + (tx - hx) * e, y = hy + (ty - hy) * e;
      wrap.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${1 + (DOCK / natural - 1) * e})`;
      wrap.classList.toggle('is-far', e > 0.4);
    }
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
      sy += (tgtY - sy) * (reduceMotion ? 1 : 1 - Math.exp(-dt / TAU));
      if (Math.abs(tgtY - sy) < 0.4) sy = tgtY;
      const [S0, S1] = zone(), p = clamp((sy - S0) / (S1 - S0), 0, 1);
      if (!docked && (p > 0 || tgtY > S0)) startDock();
      if (docked) {
        if (p <= 0 && sy === tgtY) { undock(); last = 0; return; }   // fully home and settled: seamless hand-back to the headline
        place(p);
      }
      if (sy !== tgtY) raf = requestAnimationFrame(frame); else last = 0;
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    window.addEventListener('scroll', () => {
      tgtY = window.scrollY;
      if (!docked && tgtY <= zone()[0]) { sy = tgtY; return; }       // still in the headline: nothing to animate
      kick();
    }, { passive: true });
    window.addEventListener('resize', () => { if (docked) measureHome(); tgtY = window.scrollY; kick(); });
    if (tgtY > zone()[0]) { sy = tgtY; kick(); }                     // page reloaded part-way down: dock straight away
  });
})();

/* ============ LP LOADER: the site loads while the record spins.
 * The visitor drags the tonearm onto the vinyl to start it; the loader finishes
 * once the needle has played for MIN_SPIN_MS *and* the page has fully loaded.
 * Emits `lp:done` on window when it has faded out. ============ */
(function () {
  const root = document.getElementById('lpLoader');
  if (!root) return;

  const MIN_SPIN_MS = 1400;
  const PIVOT = { x: 858, y: 137 };  // deck units (svg viewBox 0..1000)
  const CENTER = { x: 500, y: 500 };
  const ARM_LEN = 648;               // pivot -> stylus
  const DRAWN_AT = 19;               // angle the arm is drawn at in the svg
  const REST = -3;                   // parked on the cradle
  const R_OUTER = 395;               // first groove
  const R_INNER = 165;               // just outside the label

  const svg = root.querySelector('.lp-arm-svg');
  const arm = root.querySelector('[data-lp-arm]');
  const disc = root.querySelector('[data-lp-disc]');
  const audio = root.querySelector('[data-lp-audio]');
  const pctEl = root.querySelector('[data-lp-pct]');
  const hintEl = root.querySelector('[data-lp-hint-text]');
  const keyBtn = root.querySelector('[data-lp-key]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- intro: reveal only once everything it shows is ready, so nothing pops in piecemeal ---------- */
  (function intro() {
    const decode = (src) => new Promise((res) => {
      const im = new Image();
      im.src = src;
      (im.decode ? im.decode() : new Promise((r) => { im.onload = r; im.onerror = r; })).then(res, res);
    });
    const wide = matchMedia('(min-width: 900px)').matches;
    const font = document.fonts && document.fonts.load ? document.fonts.load('600 14px "Manrope"').catch(() => {}) : 0;
    const loaded = document.readyState === 'complete' ? 0 : new Promise((r) => window.addEventListener('load', r, { once: true }));
    const assets = Promise.all([decode('assets/loader/lp-poster.jpg?v=navy'), wide ? decode('assets/loader/desk-bg.webp') : 0, font, loaded]);
    // never hold the screen hostage on a slow connection
    Promise.race([assets, new Promise((r) => setTimeout(r, 1800))])
      .then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        root.classList.add('is-ready');
      })));
  })();

  // distance from record centre to the stylus at a given arm angle
  const stylusDist = (deg) => {
    const r = (deg * Math.PI) / 180;
    return Math.hypot(PIVOT.x - ARM_LEN * Math.sin(r) - CENTER.x, PIVOT.y + ARM_LEN * Math.cos(r) - CENTER.y);
  };
  let ENTER = 0, INNER = 0;
  for (let a = 0; a < 60; a += 0.1) {
    const d = stylusDist(a);
    if (!ENTER && d <= R_OUTER) ENTER = a;
    if (d <= R_INNER) { INNER = a; break; }
  }
  const MAX = INNER;


  let state = 'idle';     // idle | dragging | playing | finishing | done
  let quick = false;      // scroll path: the whole hand-off runs in about a second (dragging keeps its slower, more ceremonial timing)
  let angle = REST;
  let grabOffset = 0;
  let pageLoaded = document.readyState === 'complete';
  window.addEventListener('load', () => { pageLoaded = true; });

  function setArm(deg, lifted) {
    angle = deg;
    arm.style.transform = `rotate(${deg - DRAWN_AT}deg)` + (lifted ? ' scale(1.025)' : '');
    arm.setAttribute('filter', lifted ? 'url(#lpShadowLift)' : 'url(#lpShadow)');
  }
  const hint = (t) => { if (hintEl.textContent !== t) hintEl.textContent = t; };
  const setPct = (p) => { if (pctEl) pctEl.textContent = String(Math.round(p)).padStart(2, '0'); };

  function pointerAngle(e) {
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return (Math.atan2(-(pt.x - PIVOT.x), pt.y - PIVOT.y) * 180) / Math.PI;
  }

  // playbackRate ramp = motor spin-up / spin-down
  let rampRaf = 0;
  function ramp(from, to, ms, done) {
    cancelAnimationFrame(rampRaf);
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      try { disc.playbackRate = Math.max(0.1, from + (to - from) * e); } catch (_) {}
      if (k < 1) rampRaf = requestAnimationFrame(step); else if (done) done();
    };
    rampRaf = requestAnimationFrame(step);
  }

  /* ---------- drag ---------- */
  root.querySelectorAll('.lp-arm-hit').forEach((el) => el.addEventListener('pointerdown', onDown));

  function onDown(e) {
    if (state !== 'idle') return;
    e.preventDefault();
    state = 'dragging';
    root.classList.add('has-touched');
    arm.classList.add('is-dragging');
    grabOffset = angle - pointerAngle(e);
    setArm(angle, true);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  function onMove(e) {
    const a = Math.min(MAX, Math.max(REST, pointerAngle(e) + grabOffset));
    setArm(a, true);
    hint(a >= ENTER ? 'Release to drop the needle' : 'Keep going — onto the vinyl');
  }

  function onUp() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    arm.classList.remove('is-dragging');
    if (angle >= ENTER) {
      startPlay(angle);
    } else {
      state = 'idle';
      setArm(REST, false);
      prog = shownProg = 0;
      hint(HINT_IDLE);
    }
  }

  /* ---------- scroll: scrolling (or swiping up) sweeps the needle onto the record ---------- */
  const SCROLL_END = ENTER + 3;                 // arm angle with the stylus over the groove
  const coarse = matchMedia('(pointer: coarse)').matches;
  const HINT_IDLE = coarse ? 'Drag the needle \u00b7 or swipe up' : 'Drag the needle onto the record \u00b7 or scroll';
  const HINT_ALMOST = 'Keep going \u2014 almost on the record';
  let prog = 0, shownProg = 0, sweepRaf = 0;
  const ready = () => root.classList.contains('is-ready');

  function addProg(d) {
    if (state !== 'idle' || !ready()) return;
    prog = Math.min(1, Math.max(0, prog + d));
    root.classList.add('has-touched');
    if (!active() && prompt.hidden) { setChip('early'); showPrompt(true); }   // scrolling can't unlock sound: ask for one click now
    arm.classList.add('is-dragging');          // no CSS easing: the scroll itself is the animation
    if (!sweepRaf) sweepRaf = requestAnimationFrame(sweep);
  }
  function sweep() {
    sweepRaf = 0;
    if (state !== 'idle') return;
    shownProg += (prog - shownProg) * (reduceMotion ? 1 : 0.5);
    if (Math.abs(prog - shownProg) < 0.002) shownProg = prog;
    setArm(REST + (SCROLL_END - REST) * shownProg, shownProg < 1);
    hint(shownProg > 0.55 ? HINT_ALMOST : HINT_IDLE);
    if (shownProg >= 1) {                       // needle is on the groove: drop it and start the record
      arm.classList.remove('is-dragging');
      state = 'dragging';
      quick = true;
      startPlay(SCROLL_END);
      return;
    }
    if (shownProg !== prog) sweepRaf = requestAnimationFrame(sweep);
  }
  window.addEventListener('wheel', (e) => {
    if (state !== 'idle') return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? 600 : 1;   // lines / pages -> px
    addProg((e.deltaY * unit) / 110);
  }, { passive: false });
  let touchY = null;
  window.addEventListener('touchstart', (e) => { touchY = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (touchY === null || state !== 'idle') return;
    const y = e.touches[0].clientY;
    addProg((touchY - y) / 70);                // finger up = forward
    touchY = y;
  }, { passive: true });
  window.addEventListener('touchend', () => { touchY = null; }, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (state !== 'idle') return;
    const step = { ArrowDown: 0.4, ArrowUp: -0.4, PageDown: 1, PageUp: -1, ' ': 1 }[e.key];
    if (e.key === ' ' && e.target && e.target.closest && e.target.closest('button')) return;
    if (step) { e.preventDefault(); addProg(step); }
  });

  /* ---------- keyboard ---------- */
  keyBtn.addEventListener('click', () => {
    if (state !== 'idle') return;
    state = 'dragging';
    root.classList.add('has-touched');
    setArm(ENTER + 3, true);
    setTimeout(() => startPlay(ENTER + 3), reduceMotion ? 50 : 750);
  });

  /* ---------- music: browsers only allow sound after a real click / tap / key press (scrolling with a wheel or
     trackpad is deliberately NOT one of them). So: ask for one click early, unlock on the first qualifying input,
     and if a start is still refused, retry on the next one. ---------- */
  let wantMusic = false, primed = false;
  const verb = coarse ? 'Tap' : 'Click';
  const active = () => !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
  const prompt = document.createElement('button');
  prompt.type = 'button'; prompt.className = 'lp-sound-toast'; prompt.hidden = true;
  prompt.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6v4h2.6L9 12.8V3.2L5.1 6zM11.5 5.4a3.6 3.6 0 0 1 0 5.2"/></svg><span></span>';
  const chipText = prompt.querySelector('span');
  const setChip = (kind) => { chipText.textContent = verb + (kind === 'blocked' ? ' anywhere to play the music' : ' anywhere to turn the sound on'); };
  setChip('early');
  const showPrompt = () => {};   // the "click for sound" pill is gone from the loader: the next click / key press still unlocks and starts the music quietly in the background
  // Safari (and friends) unlock an audio element when play() is called inside a gesture; a muted, immediately-paused
  // play does that without any sound, so the later programmatic start (after scrolling) is allowed.
  function prime() {
    if (primed || wantMusic || !audio.paused) return;
    primed = true; audio.muted = true;
    const pr = audio.play();
    const settle = () => { audio.muted = false; };
    if (pr && pr.then) pr.then(() => { if (!wantMusic) { audio.pause(); audio.currentTime = 0; } settle(); }).catch(settle); else settle();
  }
  function playMusic() {
    wantMusic = true;
    audio.muted = false;
    try { audio.currentTime = 0; audio.volume = 0.275; } catch (_) {}
    const pr = audio.play();
    if (pr && pr.catch) pr.catch(() => { if (wantMusic && audio.paused) { setChip('blocked'); showPrompt(true); } });
  }
  audio.addEventListener('playing', () => { if (wantMusic) showPrompt(false); });
  ['pointerdown', 'pointerup', 'mousedown', 'keydown', 'touchend', 'click'].forEach((type) => window.addEventListener(type, (e) => {
    const onDisk = !!(e.target && e.target.closest && e.target.closest('.lp-disk, .lp-platter'));   // the hero disk / the record on the phone screen toggle the music themselves
    if (active()) { if (!wantMusic) showPrompt(false); if (!onDisk) prime(); }   // the sound is unlocked: drop the "click for sound" chip
    if (onDisk || !wantMusic || !audio.paused || audio.dataset.userPaused) return;
    const pr = audio.play();
    if (pr && pr.then) pr.then(() => showPrompt(false)).catch(() => {});
  }, { capture: true, passive: true }));

  /* ---------- play / load ---------- */
  let raf = 0, t0 = 0, shown = 0, dropAt = 0;

  function startPlay(at) {
    state = 'playing';
    dropAt = at;
    setArm(at, false);            // needle drops (shadow tightens)
    root.classList.add('is-playing');
    hint('Loading — spinning up');
    try { disc.playbackRate = 0.1; } catch (_) {}
    const p = disc.play();
    if (p && p.catch) p.catch(() => {});
    playMusic();
    ramp(0.1, 1, reduceMotion ? 1 : (quick ? 160 : 450));
    t0 = performance.now();
    shown = 0;
    // let the drop transition settle before the arm starts tracking inward
    setTimeout(() => { if (state === 'playing') arm.classList.add('is-tracking'); }, quick ? 60 : 350);
    raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    const t = (now - t0) / (quick ? 140 : MIN_SPIN_MS);
    const cap = pageLoaded ? 100 : 92;
    const goal = Math.min(cap, t * 100);
    shown += (goal - shown) * (quick ? 0.7 : 0.2);
    if (goal >= 100 && shown > 99.4) shown = 100;
    setPct(shown);
    if (arm.classList.contains('is-tracking')) {
      setArm(dropAt + (Math.max(dropAt, MAX - 1.5) - dropAt) * 0.28 * (shown / 100), false);   // a short creep, not all the way to the label
    }
    if (shown < 60) hint('Loading — spinning up');
    else if (shown < 100) hint(pageLoaded ? 'Almost there' : 'Waiting for the page');
    if (shown >= 100) return finish();
    raf = requestAnimationFrame(tick);
  }

  function finish() {
    state = 'finishing';
    setPct(100);
    hint('Enjoy the record');
    // needle stays in the groove and the record keeps spinning, then it lifts off and lands in the hero "O"
    setTimeout(() => { if (gateMode) showGate(); else if (!flyToHero()) fadeOut(); }, quick ? 40 : 350);
  }

  /* ---------- phones: stay on the record + music, and ask them to open it on a laptop ---------- */
  const PORTFOLIO_URL = 'https://bluesdesign.lol/';
  const gateEl = root.querySelector('[data-lp-gate]');
  const copyBtn = root.querySelector('[data-lp-copy]');
  const copyLabel = root.querySelector('[data-lp-copy-label]');
  const platterEl = root.querySelector('.lp-platter');
  const tipEl = root.querySelector('.lp-gate-tip');
  // phones (and any narrow window) get the "made for desktop" screen straight away -- no intro, no autoplayed music
  const gateMode = !!gateEl && (matchMedia('(max-width: 899px)').matches || /Android|iPhone|iPod|Mobi/i.test(navigator.userAgent));

  const musicOn = () => !audio.paused && !audio.muted;
  const updateTip = () => { const paused = !musicOn(); if (tipEl) tipEl.textContent = paused ? (audio.dataset.userPaused ? 'Paused \u2014 tap the record to play' : 'Tap the record to play the music') : 'Tap the record to stop the music'; root.classList.toggle('is-muted', paused); };
  audio.addEventListener('playing', updateTip); audio.addEventListener('pause', updateTip);
  audio.addEventListener('ended', () => { if (state === 'gate') { stopRecord(); updateTip(); } });
  function enterGateDirect() {
    state = 'gate';
    root.classList.add('has-touched', 'is-gate');                  // small deck from the first paint; no drag cue
    keyBtn.hidden = true;
    setArm(REST, false);                                           // needle parked on its cradle
    disc.pause();                                                  // the record is still until the visitor starts it
    hint('');
    updateTip();
  }
  // the phone screen's record is a manual player: needle down + spinning + music, or needle up + still + silent
  function startRecord() {
    root.classList.add('is-playing');
    setArm(ENTER + 3, false);
    try { disc.playbackRate = 0.1; } catch (_) {}
    const p = disc.play(); if (p && p.catch) p.catch(() => {});
    ramp(0.1, 1, reduceMotion ? 1 : 600);
  }
  function stopRecord() {
    root.classList.remove('is-playing');
    setArm(REST, false);
    disc.pause();
  }
  function showGate() {
    state = 'gate';
    updateTip();
    hint('');
    root.classList.add('is-gate');
  }
  function copyFallback() {
    const ta = document.createElement('textarea');
    ta.value = PORTFOLIO_URL; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove(); return ok;
  }
  if (gateEl) {
    copyBtn.addEventListener('click', async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(PORTFOLIO_URL); ok = true; } catch (_) { ok = copyFallback(); }
      copyLabel.textContent = ok ? 'Link copied — see you on desktop' : PORTFOLIO_URL;
      copyBtn.classList.toggle('is-done', ok);
      setTimeout(() => { copyLabel.textContent = 'Copy link'; copyBtn.classList.remove('is-done'); }, 2600);
    });
    platterEl.addEventListener('click', () => {
      if (state !== 'gate') return;
      if (!musicOn()) { delete audio.dataset.userPaused; audio.muted = false; audio.play().catch(() => {}); startRecord(); }
      else { audio.dataset.userPaused = '1'; audio.pause(); stopRecord(); }
    });
  }

  function done() {
    state = 'done';
    disc.pause();
    // audio keeps playing uninterrupted -- the hero disk takes over as its play/pause control
    root.hidden = true;
    document.documentElement.classList.remove('lp-lock');
    window.dispatchEvent(new CustomEvent('lp:done'));
  }

  function fadeOut() {
    root.classList.add('is-leaving');
    document.documentElement.classList.remove('lp-lock');
    setTimeout(done, 750);
  }

  // The record leaves the deck and shrinks/moves into the hero "O" (measured live so it lands exactly)
  function flyToHero() {
    const heroDisk = document.querySelector('.lp-disk');
    const heroVideo = heroDisk && heroDisk.querySelector('.lp-disk-video');
    const platter = root.querySelector('.lp-platter');
    const label = root.querySelector('.lp-label');
    const spindle = root.querySelector('.lp-spindle');
    if (reduceMotion || !heroVideo || !platter || !label || !spindle) return false;
    const from = platter.getBoundingClientRect();
    const first = heroDisk.getBoundingClientRect();
    if (!first.width || first.bottom < 0 || first.top > innerHeight) return false;

    const deck = platter.parentNode, spindleNext = spindle.nextSibling;
    const fly = document.createElement('div');
    fly.className = 'lp-fly';
    Object.assign(fly.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' });
    // moving (not cloning) the live nodes keeps the video playing without a restart
    fly.append(disc, label, spindle);
    spindle.style.width = '6%';
    document.body.appendChild(fly);

    const html = document.documentElement;
    // unlock scroll now, behind the still-opaque loader: the scrollbar's layout shift and repaint happen where
    // nobody can see them, and the flight then tracks the hero's final position live
    html.classList.remove('lp-lock');
    html.classList.add('lp-flying');
    root.classList.add('is-flying', 'is-leaving');
    arm.classList.remove('is-tracking');
    setArm(REST, false);            // needle lifts back to its cradle

    const DUR = quick ? 440 : 800, START_RATE = disc.playbackRate || 1, END_RATE = heroVideo.playbackRate || 0.35;
    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const t0f = performance.now();
    let synced = false;

    function land() {
      // hero takes over via a short crossfade so any leftover phase difference between the two videos never shows as a pop
      if (Math.abs(heroVideo.currentTime - disc.currentTime) > 0.05) heroVideo.currentTime = disc.currentTime;
      heroVideo.play().catch(() => {});
      html.classList.remove('lp-flying');
      fly.style.transition = quick ? 'opacity .12s ease' : 'opacity .22s ease';
      fly.style.opacity = '0';
      setTimeout(() => {
        platter.append(disc, label);
        deck.insertBefore(spindle, spindleNext);
        spindle.style.width = '';
        spindle.style.opacity = '';
        fly.remove();
        done();
      }, quick ? 130 : 240);
    }
    function step(now) {
      const k = Math.min(1, (now - t0f) / DUR), e = ease(k);
      const to = heroDisk.getBoundingClientRect();
      const x = from.left + (to.left - from.left) * e;
      const y = from.top + (to.top - from.top) * e;
      const s = (from.width + (to.width - from.width) * e) / from.width;
      fly.style.transform = `translate(${x - from.left}px, ${y - from.top}px) scale(${s})`;
      const lift = Math.sin(Math.PI * e);
      fly.style.boxShadow = `0 ${8 + 26 * lift}px ${18 + 30 * lift}px -6px rgba(0,0,0,${(0.45 * (1 - e) + 0.3 * lift).toFixed(3)})`;
      spindle.style.opacity = String(1 - e);
      try { disc.playbackRate = START_RATE + (END_RATE - START_RATE) * e; } catch (_) {}
      if (!synced && k > 0.6) { heroVideo.currentTime = disc.currentTime; heroVideo.play().catch(() => {}); synced = true; }
      if (k < 1) requestAnimationFrame(step); else land();
    }
    requestAnimationFrame(step);
    return true;
  }

  function replay() {
    quick = false;
    cancelAnimationFrame(raf);
    cancelAnimationFrame(rampRaf);
    disc.pause();
    disc.currentTime = 0;
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.275;
    wantMusic = false; showPrompt(false); delete audio.dataset.userPaused;
    root.hidden = false;
    root.classList.remove('is-leaving', 'is-flying', 'is-playing', 'has-touched');
    arm.classList.remove('is-tracking', 'is-dragging');
    document.documentElement.classList.add('lp-lock');
    setArm(REST, false);
    setPct(0);
    prog = shownProg = 0; cancelAnimationFrame(sweepRaf); sweepRaf = 0;
    hint(HINT_IDLE);
    state = 'idle';
  }

  setArm(REST, false);
  hint(HINT_IDLE);
  if (gateMode) enterGateDirect();
  window.LPLoader = { replay, get state() { return state; } };
})();
