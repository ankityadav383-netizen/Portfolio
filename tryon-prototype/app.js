/* Senco Virtual Try-on prototype. Screens are the Figma frames; [data-act] elements inside them are the live hotspots. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'tryon';
  const stage = $('#stage'), wrap = $('#stageWrap'), toast = $('#toast');
  const W = 1512, H = 941;

  /* screen -> { action: target }.  '@R' = the screen we came from (login / feedback overlays) */
  const T = {
    pdp:      { tryon: 'loading' },
    loading:  {},
    consent:  { accept: 's1', decline: 'pdp', close: 'pdp' },
    s1:       { add: 's2', cart: 'login', close: 'feedback', 'remove-earrings': 'empty' },
    s2:       { back: 's1', close: 'feedback', 'pick-necklace-1': 's3' },
    s3:       { done: 's4', back: 's2', 'pick-necklace-1': 's2', close: 'feedback' },
    s4:       { add: 's5', cart: 'login', close: 'feedback', 'remove-necklace': 's1' },
    s5:       { done: 's6', back: 's4', close: 'feedback' },
    s6:       { cart: 'login', close: 'feedback', 'remove-nosepin': 's4', 'tab-hand': 's7', live: 'live' },
    s7:       { done: 's8', back: 's6', 'tab-face': 's6', close: 'feedback' },
    s8:       { add: 's9', cart: 'login', close: 'feedback', 'tab-face': 's6', 'remove-bangle': 's6' },
    s9:       { done: 's10', back: 's8', 'tab-face': 's6', close: 'feedback' },
    s10:      { cart: 'login', close: 'feedback', live: 'nohand', 'tab-face': 's6', 'remove-ring': 's8' },
    live:     { model: 's6', cart: 'login', close: 'feedback' },
    nohand:   { model: 's10', cart: 'login', close: 'feedback' },
    empty:    { add: 's1', close: 'feedback' },
    login:    { 'login-close': '@R', otp: '@otp' },
    feedback: { stay: '@R', submit: 'pdp' },
  };
  /* the action that moves the designed story forward (gets the pulsing outline) */
  const NEXT = { pdp: 'tryon', consent: 'accept', s1: 'add', s2: 'pick-necklace-1', s3: 'done', s4: 'add', s5: 'done', s6: 'tab-hand', s7: 'done', s8: 'add', s9: 'done', s10: 'cart', live: 'model', nohand: 'model', empty: 'add', login: 'otp', feedback: 'submit' };
  const AUTO = { loading: { ms: 2400, go: 'consent' } };
  /* deck step -> [screen, screen to return to from login/feedback] */
  const ENTRY = { consent: ['consent', 's1'], look: ['s1', 's1'], add: ['s2', 's1'], set: ['s6', 's6'], hand: ['s10', 's10'], live: ['live', 's6'], cart: ['login', 's10'], feedback: ['feedback', 's10'] };
  const STEP_OF = { pdp: null, loading: 'consent', consent: 'consent', s1: 'look', empty: 'look', s2: 'add', s3: 'add', s4: 'set', s5: 'set', s6: 'set', s7: 'hand', s8: 'hand', s9: 'hand', s10: 'hand', live: 'live', nohand: 'live', login: 'cart', feedback: 'feedback' };
  const MSG = {
    swap: 'Swap Item is not part of the Figma flow', download: 'Download look is not part of the Figma flow', tab: 'Add three pieces first, then the Hand tab opens',
    cat: 'Only the designed picks are live: follow the outline', pick: 'Only the outlined card is designed as a pick', add: 'Not part of the Figma flow', remove: 'Not part of the Figma flow',
    live: 'Live view opens from the three-piece look', model: 'Already on the model view', comment: '', close: '', cart: 'Add to cart is not available yet', done: 'Pick a piece first', back: '', accept: '', decline: '', default: 'Not part of the Figma flow',
  };

  let cur = null, R = 's1', timer = 0, hintTimer = 0, rating = 4;
  const screens = Object.fromEntries($$('.scr', stage).map((s) => [s.id.replace('scr-', ''), s]));
  const say = (m) => { if (!m) return; toast.textContent = m; toast.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('on'), 1800); };

  function markStep(id) {
    const k = STEP_OF[id];
    $$('#steps button').forEach((b) => (b.dataset.step === k ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    if (window.parent !== window && k) window.parent.postMessage({ arivooProto: KEY, step: k }, '*');
  }
  function prep(id) {
    const sc = screens[id], map = T[id] || {};
    $$('[data-act]', sc).forEach((el) => {
      const a = el.dataset.act, on = a in map;
      el.classList.toggle('live', on); el.classList.toggle('inert', !on);
      el.classList.remove('hint-ring');
      if (!el.matches('button,input,textarea,a')) { el.setAttribute('role', 'button'); if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', (el.textContent || el.querySelector('img')?.alt || a).trim()); }
      el.tabIndex = on || /^(star|chip)/.test(a) ? 0 : -1;
    });
    $$('.hs', sc).forEach((h) => { h.tabIndex = h.dataset.act in map ? 0 : -1; });
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { const n = NEXT[id] && $(`[data-act="${NEXT[id]}"]`, sc); if (n && cur === id && !n.matches('input,textarea')) n.classList.add('hint-ring'); }, 1400);
  }
  function go(id, o = {}) {
    if (!screens[id]) return;
    clearTimeout(timer);
    if (cur) screens[cur].classList.remove('active');
    if (o.ret) R = o.ret; else if (id === 'login' || id === 'feedback') { if (cur && cur !== 'login' && cur !== 'feedback') R = cur; }
    cur = id; screens[id].classList.add('active'); prep(id); markStep(id);
    if (AUTO[id]) timer = setTimeout(() => { if (cur === id) go(AUTO[id].go); }, AUTO[id].ms);
    if (id === 'feedback') { rating = 4; stars(); $$('.chp', screens.feedback).forEach((c) => c.classList.remove('on')); const t = $('.fb-cm', screens.feedback); if (t) t.value = ''; }
    if (id === 'login') { const i = $('.lg-in', screens.login); i.value = ''; i.classList.remove('filled'); }
    toast.classList.remove('on');
  }
  function stars() {
    $$('.star', screens.feedback).forEach((b, i) => {
      const on = i < rating, img = $('img', b);
      b.classList.toggle('off', !on); img.src = 'assets/' + (on ? 'i-star-1.svg' : 'i-star-off.svg');
      img.setAttribute('alt', `${i + 1} star${i ? 's' : ''}`);
      b.style.left = (72.03 * i + (on ? 0 : 1.02)) + 'px'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function act(el) {
    const a = el.dataset.act, map = T[cur] || {};
    if (cur === 'feedback' && /^star-(\d)$/.test(a)) { rating = +a.split('-')[1]; stars(); return; }
    if (cur === 'feedback' && a === 'chip') { el.classList.toggle('on'); el.setAttribute('aria-pressed', el.classList.contains('on')); return; }
    if (!(a in map)) { const k = a.split('-')[0]; say(MSG[k] !== undefined ? MSG[k] : MSG.default); return; }
    let to = map[a];
    if (to === '@R') to = R;
    if (to === '@otp') {
      const i = $('.lg-in', screens.login), v = i.value.replace(/\D/g, '');
      if (v.length !== 10) { say('Enter a 10-digit mobile number'); i.focus(); return; }
      to = 'feedback';
    }
    go(to);
  }
  stage.addEventListener('click', (e) => { const el = e.target.closest('[data-act]'); if (el && stage.contains(el)) act(el); });
  stage.addEventListener('keydown', (e) => {
    if (e.target.matches('input,textarea')) { if (e.key === 'Enter' && e.target.classList.contains('lg-in')) { e.preventDefault(); act($('.lg-otp', screens.login)); } return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act]')) { e.preventDefault(); act(e.target); }
  });
  stage.addEventListener('input', (e) => {
    if (!e.target.classList.contains('lg-in')) return;
    e.target.value = e.target.value.replace(/\D/g, ''); e.target.classList.toggle('filled', !!e.target.value);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cur && T[cur] && 'close' in T[cur]) act($('[data-act="close"]', screens[cur])); });

  /* ---------- guide ---------- */
  $$('#steps button').forEach((b) => b.addEventListener('click', () => { const t = ENTRY[b.dataset.step]; if (t) { R = t[1]; go(t[0], { ret: t[1] }); } }));
  $('#restart').addEventListener('click', () => { R = 's1'; go('pdp'); });
  addEventListener('message', (e) => {
    const d = e.data;
    if (window.parent === window || e.source !== window.parent || !d || d.arivooProto !== KEY || !d.goto) return;
    const t = ENTRY[d.goto]; if (t) go(t[0], { ret: t[1] });
  });

  /* ---------- fit ---------- */
  function fit() {
    const embed = document.documentElement.classList.contains('embed');
    const narrow = innerWidth <= 860 && !embed;
    const side = embed || narrow ? 0 : 308, mv = narrow ? 0 : embed ? 64 : 72, mh = narrow ? 0 : embed ? 64 : 52;   // room for the frame
    const s = Math.min(embed ? 10 : 1, (innerHeight - mv) / H, (innerWidth - side - mh) / W);
    stage.style.transform = `scale(${s})`; wrap.style.width = W * s + 'px'; wrap.style.height = H * s + 'px';
  }
  addEventListener('resize', fit); fit();
  go('pdp');
})();
