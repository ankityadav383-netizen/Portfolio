/* NABC prototype engine. Screens are Figma renders (window.NABC.screens); this file adds hotspots, real inputs, a slider and the step guide.
   Coordinates in the config are image pixels of the Figma frame. */
(() => {
  const C = window.NABC;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const W = C.stage.w, H = C.stage.h;
  const stage = $('#stage'), wrap = $('#stageWrap'), live = $('#live');
  stage.style.width = W + 'px'; stage.style.height = H + 'px';
  const el = (cls, tag = 'div') => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const announce = (m) => { live.textContent = ''; setTimeout(() => (live.textContent = m), 30); };
  const S = { email: '', otp: ['', '', '', ''], packets: 1 };
  let cur = null, timer = 0, hist = [];
  const screens = {}, actions = {};

  function place(node, o, dy = 0) {
    node.style.left = o.x + 'px'; node.style.top = (o.y - dy) + 'px'; node.style.width = o.w + 'px'; node.style.height = o.h + 'px';
  }

  /* ---------- build every screen ---------- */
  Object.entries(C.screens).forEach(([id, s]) => {
    const sc = el('scr'); sc.dataset.screen = id; sc.setAttribute('aria-label', s.label || id);
    const pin = s.pin || 0, navH = pin ? s.h - pin : 0, bodyH = H - navH;
    sc.style.background = s.bg || '#fff';
    const body = el('body'); body.style.height = bodyH + 'px';
    const inner = el('inner'); inner.style.height = (pin || s.h) + 'px'; inner.style.background = s.bg || '#fff';
    body.style.overflowY = (pin || s.h) > bodyH ? 'auto' : 'hidden';
    const dx = (W - s.w) / 2;
    const img = new Image(); img.alt = ''; img.src = C.base + s.img; img.style.cssText = `left:${dx}px;top:0;width:${s.w}px;height:${s.h}px`;
    inner.appendChild(img); body.appendChild(inner); sc.appendChild(body);
    let nav = null;
    if (pin) {
      nav = el('pin'); nav.style.height = navH + 'px';
      const ni = new Image(); ni.alt = ''; ni.src = C.base + s.img; ni.style.cssText = `left:${dx}px;top:${-pin}px;width:${s.w}px;height:${s.h}px`;
      nav.appendChild(ni); sc.appendChild(nav);
    }
    const host = (y) => (pin && y >= pin ? { p: nav, dy: pin } : { p: inner, dy: 0 });
    (s.covers || []).forEach((c) => { const d = el('cover'); place(d, c); d.style.background = c.bg || '#fff'; inner.appendChild(d); });
    (s.hot || []).forEach((h) => {
      const t = host(h.y), b = el('hs', 'button'); b.type = 'button'; b.setAttribute('aria-label', h.label || h.go || h.act);
      place(b, { x: h.x + dx, y: h.y, w: h.w, h: h.h }, t.dy);
      b.addEventListener('click', () => { if (h.act) act(h.act, h); else if (h.go) go(h.go); });
      t.p.appendChild(b);
    });
    (s.inputs || []).forEach((i) => {
      const t = host(i.y);
      if (i.kind === 'otp') {
        const n = el('otp' + (i.err ? ' err' : ''), 'input'); n.inputMode = 'numeric'; n.maxLength = 1; n.autocomplete = 'off'; n.dataset.i = i.i;
        n.setAttribute('aria-label', 'Code digit ' + (i.i + 1)); n.value = S.otp[i.i]; place(n, { x: i.x + dx, y: i.y, w: i.w, h: i.h }, t.dy);
        n.addEventListener('input', () => otpInput(id, n)); n.addEventListener('keydown', (e) => otpKey(e, id, n)); n.addEventListener('paste', (e) => otpPaste(e, id));
        t.p.appendChild(n);
      } else {
        const n = el('fld', 'input'); n.type = 'text'; n.placeholder = i.ph || ''; n.autocomplete = 'off'; n.spellcheck = false; n.dataset.email = '1';
        n.setAttribute('aria-label', i.label || 'Email or user name'); place(n, { x: i.x + dx, y: i.y, w: i.w, h: i.h }, t.dy); n.style.fontSize = (i.fs || 16) + 'px';
        n.addEventListener('input', () => { S.email = n.value; $$('[data-email]').forEach((o) => { if (o !== n) o.value = S.email; }); });
        n.addEventListener('keydown', (e) => { if (e.key === 'Enter') act('continue'); });
        if (i.opens) n.addEventListener('focus', () => { if (cur === id) go(i.opens, { focus: '[data-email]' }); });
        t.p.appendChild(n);
      }
    });
    (s.btns || []).forEach((o) => {
      const b = el('xbtn' + (o.cls ? ' ' + o.cls : ''), 'button'); b.type = 'button'; b.textContent = o.text; place(b, { x: o.x + dx, y: o.y, w: o.w, h: o.h });
      b.addEventListener('click', () => { if (o.act) act(o.act, o); else if (o.go) go(o.go); }); inner.appendChild(b);
    });
    if (s.slider) buildSlider(inner, s.slider, dx);
    if (s.swipe) swipe(sc, id, s.swipe);
    stage.appendChild(sc); screens[id] = sc;
  });

  /* ---------- OTP ---------- */
  const otpBoxes = (id) => $$('.otp', screens[id]);
  const otpSync = () => $$('.otp').forEach((n) => { n.value = S.otp[+n.dataset.i]; });
  function otpInput(id, n) {
    n.value = n.value.replace(/\D/g, '').slice(-1); S.otp[+n.dataset.i] = n.value; otpSync();
    if (id === 'otp_err') { go('otp', { focus: `.otp[data-i="${n.dataset.i}"]` }); return; }
    if (n.value && +n.dataset.i < 3) otpBoxes(id)[+n.dataset.i + 1].focus();
  }
  function otpKey(e, id, n) {
    const i = +n.dataset.i;
    if (e.key === 'Backspace' && !n.value && i > 0) { S.otp[i - 1] = ''; otpSync(); otpBoxes(id)[i - 1].focus(); }
    if (e.key === 'Enter') act('verify');
  }
  function otpPaste(e, id) {
    const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4); if (!d) return; e.preventDefault();
    S.otp = [...d].concat(['', '', '', '']).slice(0, 4); otpSync(); otpBoxes(id)[Math.min(d.length, 3)].focus();
  }

  /* ---------- slider (volunteer: food packets) ---------- */
  function buildSlider(inner, o, dx) {
    const cv = el('cover'); place(cv, { x: o.x + dx, y: o.y, w: o.w, h: o.h }); inner.appendChild(cv);
    const x0 = o.x0 + dx, x1 = o.x1 + dx, ty = o.ty, step = (x1 - x0) / 5;
    const tr = el('sl-track'); tr.style.cssText += `left:${x0}px;width:${x1 - x0}px;top:${ty - 3}px`;
    const fl = el('sl-fill'); fl.style.top = (ty - 3) + 'px'; fl.style.left = x0 + 'px';
    const th = el('sl-thumb'); th.style.top = ty + 'px'; th.tabIndex = 0; th.setAttribute('role', 'slider'); th.setAttribute('aria-label', 'Food packets'); th.setAttribute('aria-valuemin', 0); th.setAttribute('aria-valuemax', 5);
    const lbl = [0, 1, 2, 3, 4, 5].map((n) => { const l = el('sl-lbl'); l.textContent = n; l.style.left = (x0 + n * step) + 'px'; l.style.top = o.ly + 'px'; l.addEventListener('click', () => set(n)); return l; });
    [tr, fl, th, ...lbl].forEach((n) => inner.appendChild(n));
    function set(n) {
      S.packets = Math.max(0, Math.min(5, n)); const x = x0 + S.packets * step;
      fl.style.width = (x - x0) + 'px'; th.style.left = x + 'px'; th.setAttribute('aria-valuenow', S.packets);
      lbl.forEach((l, i) => l.classList.toggle('on', i === S.packets));
    }
    const fromEvent = (e) => { const r = tr.getBoundingClientRect(), k = r.width / (x1 - x0); set(Math.round(((e.clientX - r.left) / k) / step)); };
    let drag = false;
    [tr, th].forEach((n) => n.addEventListener('pointerdown', (e) => { drag = true; n.setPointerCapture && n.setPointerCapture(e.pointerId); fromEvent(e); }));
    addEventListener('pointermove', (e) => { if (drag) fromEvent(e); });
    addEventListener('pointerup', () => { drag = false; });
    th.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(S.packets + 1); e.preventDefault(); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(S.packets - 1); e.preventDefault(); } });
    set(S.packets);
  }

  /* ---------- swipe between meals ---------- */
  function swipe(sc, id, o) {
    let sx = null, sy = 0;
    sc.addEventListener('pointerdown', (e) => { const r = stage.getBoundingClientRect(), k = r.width / W, y = (e.clientY - r.top) / k; sx = (y >= o.y0 && y <= o.y1) ? e.clientX : null; sy = e.clientY; });
    sc.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) < 40 || Math.abs(e.clientY - sy) > 60) return; const to = dx < 0 ? o.left : o.right; if (to) go(to); });
  }

  /* ---------- navigation ---------- */
  function markStep() {
    const key = C.stepOf[cur];
    $$('#steps button').forEach((b) => (b.dataset.step === key ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    if (window.parent !== window) window.parent.postMessage({ arivooProto: C.key, step: key }, '*');
  }
  function go(id, o = {}) {
    if (!screens[id]) return;
    clearTimeout(timer);
    if (cur && cur !== id && !o.back && !o.reset) hist.push(cur);
    if (o.reset) hist = [];
    if (cur) screens[cur].classList.remove('active');
    cur = id; const sc = screens[id]; sc.classList.add('active'); const b = $('.body', sc); if (b) b.scrollTop = 0;
    if (C.screens[id].auto) timer = setTimeout(() => { if (cur === id) go(C.screens[id].auto.go); }, C.screens[id].auto.ms);
    if (o.focus) setTimeout(() => { const t = $(o.focus, sc); if (t) { t.focus(); if (t.setSelectionRange && t.value) t.setSelectionRange(t.value.length, t.value.length); } }, 40);
    markStep();
  }
  const say = (m) => () => announce(m);
  Object.assign(actions, {
    continue: () => { if (S.email.trim().length < 3) { announce('Enter your email or user name'); const t = $('[data-email]', screens[cur]); if (t) t.focus(); return; } S.otp = ['', '', '', '']; otpSync(); go('otp', { focus: '.otp[data-i="0"]' }); announce('Enter the verification code'); },
    verify: () => { if (S.otp.join('') === '1234') { go(C.afterLogin, { reset: true }); announce('Signed in'); } else { go('otp_err'); announce('The passcode you have entered is incorrect'); } },
    editemail: () => go(C.signin, { focus: '[data-email]' }),
    logout: () => { S.email = ''; $$('[data-email]').forEach((n) => (n.value = '')); S.otp = ['', '', '', '']; otpSync(); go(C.signin, { reset: true }); },
    back: () => { const p = hist.pop(); go(p || C.afterLogin, { back: true }); },
    fabclose: () => go('events'),
    inert: (h) => announce(h.msg || 'Not part of the designed flow'),
    submit: (h) => go(h.go || 'kiosk'),
  });
  function act(name, h) { const f = actions[name]; if (f) f(h || {}); }

  /* ---------- guide ---------- */
  $$('#steps button').forEach((b) => b.addEventListener('click', () => {
    const t = C.entry[b.dataset.step]; if (t) go(t, { reset: true });
  }));
  $('#restart').addEventListener('click', () => location.reload());
  addEventListener('message', (e) => {
    const d = e.data;
    if (window.parent === window || e.source !== window.parent || !d || d.arivooProto !== C.key || !d.goto) return;
    const b = $(`#steps button[data-step="${d.goto}"]`); if (b) b.click();
  });

  /* ---------- fit ---------- */
  function fit() {
    const embed = document.documentElement.classList.contains('embed');
    const phoneMode = innerWidth <= 760 && !embed;
    const side = phoneMode || embed ? 0 : 316, mv = phoneMode ? 0 : 48, mh = phoneMode ? 0 : 32;
    const emb = embed && innerWidth > 600 ? Math.min(1, (innerHeight * 0.72) / H) : 1;
    const s = embed && innerWidth > 600 ? emb : Math.min(1, (innerHeight - mv) / H, (innerWidth - side - mh) / W);
    stage.style.transform = `scale(${s})`; wrap.style.width = W * s + 'px'; wrap.style.height = H * s + 'px';
    if (phoneMode) { stage.style.borderRadius = '0'; stage.style.boxShadow = 'none'; }
  }
  addEventListener('resize', fit); fit();
  go(C.start);
})();
