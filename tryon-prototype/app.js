/* Senco Virtual Try-on prototype. The plugin is rendered from state (engine.js); every control does what it says. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'tryon', W = 1512, H = 941;
  const E = window.TryonEngine, { CHIP_ORDER, MAXN } = E;
  const stage = $('#stage'), wrap = $('#stageWrap'), toast = $('#toast'), plugin = $('#scr-plugin');
  const screens = Object.fromEntries($$('.scr', stage).map((s) => [s.id.replace('scr-', ''), s]));

  const fresh = () => ({ tab: 'face', face: [{ c: 'earrings', v: 0 }], hand: [], mode: 'info', focus: 0, cat: null, pick: null, off: {}, live: false, swap: false });
  let S = fresh(), view = 'pdp', loggedIn = false, rating = 4, timer = 0, hintTimer = 0;
  const list = () => S[S.tab], other = () => (S.tab === 'face' ? 'hand' : 'face'), count = () => S.face.length + S.hand.length;

  const say = (m) => { toast.textContent = m; toast.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('on'), 1900); };

  /* ---------- state helpers ---------- */
  const firstFree = (tab) => CHIP_ORDER[tab].find((c) => !S[tab].some((p) => p.c === c)) || CHIP_ORDER[tab][0];
  function enterAdd(cat, pick = null, swap = false) { S.mode = 'add'; S.cat = cat; S.pick = pick; S.swap = swap; }
  function emptyOrAdd() { if (count() === 0) { S.tab = 'face'; S.mode = 'empty'; } else enterAdd(firstFree(S.tab)); }
  function toInfo(i) { const l = list(); if (!l.length) return emptyOrAdd(); S.mode = 'info'; S.swap = false; S.pick = null; S.focus = Math.max(0, Math.min(i == null ? l.length - 1 : i, l.length - 1)); }

  const PLUGIN = {
    'tab-face': () => setTab('face'), 'tab-hand': () => setTab('hand'),
    add: () => enterAdd(firstFree(S.tab)),
    swap: () => { const p = list()[S.focus]; enterAdd(p.c, p.v, true); },
    done: () => {
      if (S.pick == null) return;
      const l = list(), at = l.findIndex((p) => p.c === S.cat);
      if (at >= 0) { l[at].v = S.pick; S.focus = at; } else { l.push({ c: S.cat, v: S.pick }); S.focus = l.length - 1; }
      S.mode = 'info'; S.swap = false; S.pick = null;
    },
    back: () => { S.pick = null; S.swap = false; if (list().length) toInfo(S.focus); else if (count() === 0) emptyOrAdd(); else { S.tab = other(); toInfo(); } },
    live: () => { S.live = true; }, model: () => { S.live = false; },
    prev: () => { S.off[S.cat] = (S.off[S.cat] || 0) - 1; }, next: () => { S.off[S.cat] = (S.off[S.cat] || 0) + 1; },
    cart: () => { if (!count()) return; if (loggedIn) { go('feedback'); say('Added to cart'); } else go('login'); },
    download: () => say('Look saved (simulated in the prototype)'), pd: () => say('Opens the product page on the Senco store'),
    close: () => go('feedback'), scrim: () => go('feedback'),
  };
  function setTab(t) { if (S.tab === t) return; S.tab = t; if (S[t].length) toInfo(); else enterAdd(firstFree(t)); }
  function pluginAct(a) {
    let m;
    if ((m = /^focus-(\d+)$/.exec(a))) return toInfo(+m[1]);
    if ((m = /^remove-(\d+)$/.exec(a))) { const i = +m[1]; list().splice(i, 1); S.pick = null; S.swap = false; return list().length ? toInfo(Math.min(i, list().length - 1)) : emptyOrAdd(); }
    if ((m = /^cat-(\w+)$/.exec(a))) { const ex = list().find((p) => p.c === m[1]); S.cat = m[1]; S.pick = ex ? ex.v : null; S.swap = !!ex; return; }
    if ((m = /^pick-(\d+)$/.exec(a))) { S.pick = S.pick === +m[1] ? null : +m[1]; return; }
    if (PLUGIN[a]) return PLUGIN[a]();
  }

  /* ---------- views ---------- */
  const NEXT = () => {
    if (view === 'pdp') return '.tryon-hs'; if (view === 'consent') return '[data-act="accept"]'; if (view === 'login') return '[data-act="otp"]'; if (view === 'feedback') return '[data-act="submit"]';
    if (view !== 'plugin' || S.live) return null;
    if (S.mode === 'empty') return '[data-act="add"]';
    if (S.mode === 'add') return S.pick == null ? '[data-act="pick-1"]' : '[data-act="done"]';
    if (S.tab === 'face') return S.face.length < 3 ? '[data-act="add"]' : (S.hand.length ? '[data-act="cart"]' : '[data-act="tab-hand"]');
    return S.hand.length < 2 ? '[data-act="add"]' : '[data-act="cart"]';
  };
  function stepKey() {
    if (view === 'pdp') return null;
    if (view === 'loading' || view === 'consent') return 'consent';
    if (view === 'login') return 'cart'; if (view === 'feedback') return 'feedback';
    if (S.live) return 'live'; if (S.tab === 'hand') return 'hand'; if (S.mode === 'add') return 'add';
    return S.face.length >= 2 ? 'set' : 'look';
  }
  function markStep() {
    const k = stepKey();
    $$('#steps button').forEach((b) => (b.dataset.step === k ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    if (window.parent !== window && k) window.parent.postMessage({ arivooProto: KEY, step: k }, '*');
  }
  function prep(scr) {
    $$('[data-act]', scr).forEach((el) => {
      const a = el.dataset.act; if (a === 'scrim') return;
      if (!el.matches('button,input,textarea,a')) { el.setAttribute('role', 'button'); if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', (el.textContent || el.querySelector('img')?.alt || a).trim()); }
      const dis = el.classList.contains('dis'); el.tabIndex = dis ? -1 : 0; if (dis) el.setAttribute('aria-disabled', 'true');
    });
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { const s = NEXT(), n = s && $(s, scr); if (n && !n.classList.contains('dis')) n.classList.add('hint-ring'); }, 1500);
  }
  function paint() {
    const ae = document.activeElement, had = ae && plugin.contains(ae) && ae.closest('[data-act]');
    const key = had ? had.dataset.act : null;
    plugin.innerHTML = E.render(S);
    if (key) { const n = $(`[data-act="${key}"]`, plugin); if (n) n.focus({ preventScroll: true }); }
    prep(plugin); markStep();
  }
  function go(v) {
    clearTimeout(timer); toast.classList.remove('on');
    view = v; $$('.scr', stage).forEach((s) => s.classList.toggle('active', s.id === 'scr-' + v));
    if (v === 'plugin') paint(); else { prep(screens[v]); markStep(); }
    if (v === 'loading') timer = setTimeout(() => { if (view === 'loading') go('consent'); }, 2400);
    if (v === 'feedback') { rating = 4; stars(); $$('.chp', screens.feedback).forEach((c) => c.classList.remove('on')); const t = $('.fb-cm', screens.feedback); if (t) t.value = ''; }
    if (v === 'login') { const i = $('.lg-in', screens.login); i.value = ''; i.classList.remove('filled'); }
  }
  function stars() {
    $$('.star', screens.feedback).forEach((b, i) => {
      const on = i < rating, img = $('img', b);
      b.classList.toggle('off', !on); img.src = 'assets/' + (on ? 'i-star-1.svg' : 'i-star-off.svg'); img.alt = `${i + 1} star${i ? 's' : ''}`;
      b.style.left = (72.03 * i + (on ? 0 : 1.02)) + 'px'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function act(el) {
    const a = el.dataset.act;
    if (view === 'pdp') { if (a === 'tryon') { S = fresh(); go('loading'); } return; }
    if (view === 'loading') { if (a === 'scrim') go('pdp'); return; }
    if (view === 'consent') { if (a === 'accept') go('plugin'); else if (a === 'decline' || a === 'close' || a === 'scrim') go('pdp'); return; }
    if (view === 'login') {
      if (a === 'login-close' || a === 'scrim') return go('plugin');
      if (a === 'otp') { const i = $('.lg-in', screens.login), v = i.value.replace(/\D/g, ''); if (v.length !== 10) { say('Enter a 10-digit mobile number'); i.focus(); return; } loggedIn = true; go('feedback'); }
      return;
    }
    if (view === 'feedback') {
      let m;
      if ((m = /^star-(\d)$/.exec(a))) { rating = +m[1]; return stars(); }
      if (a === 'chip') { el.classList.toggle('on'); el.setAttribute('aria-pressed', el.classList.contains('on')); return; }
      if (a === 'stay' || a === 'scrim') return go('plugin');
      if (a === 'submit') { S = fresh(); return go('pdp'); }
      return;
    }
    pluginAct(a); if (view === 'plugin') paint();
  }
  stage.addEventListener('click', (e) => {
    if (e.target.closest('.sp')) { e.stopPropagation(); }
    let el = e.target.closest('[data-act]');
    if (!el && (e.target.classList.contains('scrim') || e.target.classList.contains('bd'))) el = { dataset: { act: 'scrim' }, classList: { toggle() {}, contains: () => false }, setAttribute() {} };
    if (el && (el.dataset.act === 'scrim' || stage.contains(el))) { if (el.classList && el.classList.contains && el.classList.contains('dis')) return; act(el); }
  });
  stage.addEventListener('keydown', (e) => {
    if (e.target.matches('input,textarea')) { if (e.key === 'Enter' && e.target.classList.contains('lg-in')) { e.preventDefault(); act($('.lg-otp', screens.login)); } return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act]')) { e.preventDefault(); if (!e.target.classList.contains('dis')) act(e.target); }
  });
  stage.addEventListener('input', (e) => { if (!e.target.classList.contains('lg-in')) return; e.target.value = e.target.value.replace(/\D/g, ''); e.target.classList.toggle('filled', !!e.target.value); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (view === 'plugin' || view === 'consent' || view === 'login' || view === 'feedback' || view === 'loading') act({ dataset: { act: view === 'login' ? 'login-close' : view === 'feedback' ? 'stay' : view === 'consent' ? 'decline' : view === 'loading' ? 'scrim' : 'close' }, classList: { contains: () => false, toggle() {} }, setAttribute() {} });
  });

  /* ---------- guide (deck steps) ---------- */
  const setFace = () => { S = fresh(); S.face = [{ c: 'earrings', v: 0 }, { c: 'necklace', v: 1 }, { c: 'nosepin', v: 1 }]; S.focus = 2; };
  const setHand = () => { setFace(); S.hand = [{ c: 'bangle', v: 1 }, { c: 'ring', v: 1 }]; S.tab = 'hand'; S.focus = 1; };
  const ENTRY = {
    consent: () => go('consent'),
    look: () => { S = fresh(); go('plugin'); },
    add: () => { S = fresh(); enterAdd('necklace'); go('plugin'); },
    set: () => { setFace(); go('plugin'); },
    hand: () => { setHand(); go('plugin'); },
    live: () => { setFace(); S.live = true; go('plugin'); },
    cart: () => { setHand(); loggedIn = false; go('plugin'); go('login'); },
    feedback: () => { setHand(); go('plugin'); go('feedback'); },
  };
  $$('#steps button').forEach((b) => b.addEventListener('click', () => { const f = ENTRY[b.dataset.step]; if (f) f(); }));
  $('#restart').addEventListener('click', () => { S = fresh(); loggedIn = false; go('pdp'); });
  addEventListener('message', (e) => {
    const d = e.data;
    if (window.parent === window || e.source !== window.parent || !d || d.arivooProto !== KEY || !d.goto) return;
    const f = ENTRY[d.goto]; if (f) f();
  });
  window.TRYON = { set(state, v) { S = Object.assign(fresh(), state); go(v || 'plugin'); }, get: () => S };   // used by the fidelity test

  /* ---------- fit ---------- */
  const laptop = $('#laptop'), FW = 1684, FH = 1027;
  function fit() {
    const embed = document.documentElement.classList.contains('embed'), narrow = innerWidth <= 860 && !embed, framed = !narrow;
    laptop.classList.toggle('frameless', !framed);
    const w = framed ? FW : W, h = framed ? FH : H;
    const side = embed || narrow ? 0 : 308, mv = narrow ? 0 : embed ? 40 : 56, mh = narrow ? 0 : embed ? 56 : 40;
    const s = Math.min(embed ? 10 : 1, (innerHeight - mv) / h, (innerWidth - side - mh) / w);
    laptop.style.transform = `scale(${s})`; wrap.style.width = w * s + 'px'; wrap.style.height = h * s + 'px';
  }
  addEventListener('resize', fit); fit();
  go('pdp');
})();
