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

// Hero "O": a green-screen vinyl disk video, chroma-keyed live on a small canvas (not baked into the
// video file) so it works everywhere -- VP9's alpha channel doesn't survive re-encoding/transcoding
// reliably across tools, but a plain green-background video always decodes fine in a <video> element.
(() => {
  const SIZE = 140;                    // internal render resolution; CSS scales the canvas up/down responsively
  const KEY = [0, 178, 37];            // the exact green from the source video
  const CORE = 70, SOFT = 150;         // squared-distance thresholds: solid cutoff, then a soft falloff band to hide fringing
  document.querySelectorAll('.lp-disk').forEach((wrap) => {
    const video = wrap.querySelector('.lp-disk-video'), canvas = wrap.querySelector('.lp-disk-canvas');
    if (!video || !canvas) return;
    canvas.width = SIZE; canvas.height = SIZE;
    video.playbackRate = 0.35;   // source footage spins much faster than feels right at this size
    const ctx = canvas.getContext('2d');
    const off = document.createElement('canvas'); off.width = SIZE; off.height = SIZE;
    const octx = off.getContext('2d', { willReadFrequently: true });
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function keyFrame() {
      octx.drawImage(video, 0, 0, SIZE, SIZE);
      const frame = octx.getImageData(0, 0, SIZE, SIZE);
      const d = frame.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const dr = r - KEY[0], dg = g - KEY[1], db = b - KEY[2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < CORE) d[i + 3] = 0;
        else if (dist < SOFT) d[i + 3] = Math.round(255 * (dist - CORE) / (SOFT - CORE));
        // spill suppression: green-screen edge pixels are a green/subject blend, so even once they're
        // past the alpha cutoff they still read visibly green -- clamp green to the red/blue average
        // (a no-op on true grays/blacks/reds, which is everything else in this footage) to kill the fringe
        const avgRB = (r + b) / 2;
        if (g > avgRB) d[i + 1] = avgRB;
      }
      ctx.putImageData(frame, 0, 0);
    }
    function loop() { if (video.readyState >= 2) keyFrame(); if (!reduceMotion) requestAnimationFrame(loop); }
    function start() { keyFrame(); if (!reduceMotion) requestAnimationFrame(loop); else video.pause(); }
    // autoplay can finish loading (and fire 'loadeddata') before this script even runs, so check
    // readyState directly instead of only listening for an event that may have already passed
    if (video.readyState >= 2) start();
    else video.addEventListener('loadeddata', start, { once: true });
    if (!reduceMotion) video.play().catch(() => {});

    // doubles as the loudspeaker's play/pause control once the loader hands off the track to it
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('aria-pressed', 'true');
    wrap.setAttribute('aria-label', 'O — pause the music');
    function toggle() {
      const audio = document.querySelector('[data-lp-audio]');
      if (!audio) return;
      if (audio.paused) {
        audio.play().catch(() => {});
        if (!reduceMotion) video.play().catch(() => {});
        wrap.setAttribute('aria-pressed', 'true');
        wrap.setAttribute('aria-label', 'O — pause the music');
      } else {
        audio.pause();
        video.pause();
        wrap.setAttribute('aria-pressed', 'false');
        wrap.setAttribute('aria-label', 'O — play the music');
      }
    }
    wrap.addEventListener('click', toggle);
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
})();

/* ============ LP LOADER: the site loads while the record spins.
 * The visitor drags the tonearm onto the vinyl to start it; the loader finishes
 * once the needle has played for MIN_SPIN_MS *and* the page has fully loaded.
 * Emits `lp:done` on window when it has faded out. ============ */
(function () {
  const root = document.getElementById('lpLoader');
  if (!root) return;

  const MIN_SPIN_MS = 3200;
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
      hint('Drag the needle onto the record');
    }
  }

  /* ---------- keyboard ---------- */
  keyBtn.addEventListener('click', () => {
    if (state !== 'idle') return;
    state = 'dragging';
    root.classList.add('has-touched');
    setArm(ENTER + 3, true);
    setTimeout(() => startPlay(ENTER + 3), reduceMotion ? 50 : 750);
  });

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
    try { audio.currentTime = 0; audio.volume = 0.55; } catch (_) {}
    const ap = audio.play();
    if (ap && ap.catch) ap.catch(() => {});
    ramp(0.1, 1, reduceMotion ? 1 : 900);
    t0 = performance.now();
    shown = 0;
    // let the drop transition settle before the arm starts tracking inward
    setTimeout(() => { if (state === 'playing') arm.classList.add('is-tracking'); }, 350);
    raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    const t = (now - t0) / MIN_SPIN_MS;
    const cap = pageLoaded ? 100 : 92;
    const goal = Math.min(cap, t * 100);
    shown += (goal - shown) * 0.12;
    if (goal >= 100 && shown > 99.4) shown = 100;
    setPct(shown);
    if (arm.classList.contains('is-tracking')) {
      setArm(dropAt + (Math.max(dropAt, MAX - 1.5) - dropAt) * (shown / 100), false);
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
    // needle stays in the groove and the record keeps spinning through the fade
    setTimeout(() => {
      root.classList.add('is-leaving');
      document.documentElement.classList.remove('lp-lock');
      setTimeout(() => {
        state = 'done';
        disc.pause();
        // audio keeps playing uninterrupted -- the hero disk takes over as its play/pause control
        root.hidden = true;
        window.dispatchEvent(new CustomEvent('lp:done'));
      }, 750);
    }, 1300);
  }

  function replay() {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(rampRaf);
    disc.pause();
    disc.currentTime = 0;
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.55;
    root.hidden = false;
    root.classList.remove('is-leaving', 'is-playing', 'has-touched');
    arm.classList.remove('is-tracking', 'is-dragging');
    document.documentElement.classList.add('lp-lock');
    setArm(REST, false);
    setPct(0);
    hint('Drag the needle onto the record');
    state = 'idle';
  }

  setArm(REST, false);
  window.LPLoader = { replay, get state() { return state; } };
})();
