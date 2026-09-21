/* Stan first-day quest: a small game through the real onboarding screens (Figma frames) that ends in a feedback form. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAIL = 'ankit.yadav383@gmail.com';
  const XP_MAX = 140;

  const MISSIONS = [
    { id: 'start', t: 'Start your session', d: 'Pick a way to sign in', xp: 20 },
    { id: 'verify', t: 'Verify it is you', d: 'Confirm your account', xp: 30 },
    { id: 'avatar', t: 'Unlock your avatar', d: 'Tap the welcome card', xp: 30 },
    { id: 'join', t: 'Join a community', d: 'Find a club you like', xp: 30 },
    { id: 'play', t: 'Play a game', d: 'Pick any game tile', xp: 30 },
  ];

  /* ---------- screens: frame coordinates are CSS px of the 390-wide Figma frames ---------- */
  const KEYS = [];
  ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach((k, i) => KEYS.push({ k, x: [6, 134, 262][i % 3], y: [562, 616, 670][Math.floor(i / 3)], w: 122, h: 45 }));
  KEYS.push({ k: '0', x: 134, y: 723, w: 122, h: 45 }, { k: 'del', x: 262, y: 723, w: 122, h: 45 });
  const keypad = KEYS.map((o) => ({ id: 'key-' + o.k, x: o.x, y: o.y, w: o.w, h: o.h, label: o.k === 'del' ? 'Delete' : 'Key ' + o.k, act: 'key', v: o.k }));
  const SKIP = { id: 'skip', x: 327, y: 53, w: 49, h: 33, label: 'Skip', act: 'skip' };
  const NAV = [
    { id: 'nav-home', x: 11, w: 74, label: 'Home', act: 'nav', v: 'top' }, { id: 'nav-game', x: 85, w: 74, label: 'Game', act: 'nav', v: 'games' },
    { id: 'nav-mic', x: 159, w: 74, label: 'Audio rooms', act: 'nav', v: 'clubs' }, { id: 'nav-circle', x: 233, w: 74, label: 'Circle', act: 'nav', v: 'circle' },
    { id: 'nav-reward', x: 307, w: 74, label: 'Reward', act: 'nav', v: 'reward' },
  ];
  const homeNav = (h) => NAV.map((n) => ({ ...n, y: h - 100, h: 100 }));

  const SC = {
    welcome: { img: 'welcome', h: 844, hero: 208, label: 'Welcome', hs: [
      SKIP,
      { id: 'google', x: 15, y: 565, w: 359, h: 43, label: 'Sign in with Google', act: 'signin' },
      { id: 'phone', x: 15, y: 661, w: 359, h: 43, label: 'Sign in using phone number', act: 'signin' }] },
    sheet: { img: 'sheet', h: 844, hero: 208, dim: true, label: 'Login to Stan', hs: [
      { id: 'dismiss', x: 0, y: 0, w: 390, h: 575, label: 'Use another method', act: 'other', catch: true },
      { id: 'continue', x: 16, y: 675, w: 358, h: 41, label: 'Continue', act: 'continue' },
      { id: 'other', x: 124, y: 732, w: 143, h: 21, label: 'Use another method', act: 'other' }] },
    phone: { img: 'phone', h: 844, hero: 108, label: 'Sign in using phone number', hs: [
      SKIP, { id: 'field', x: 86, y: 389, w: 291, h: 43, label: 'Phone number', act: 'field' },
      { id: 'submit', x: 14, y: 506, w: 363, h: 38, label: 'Submit', act: 'submit' }, ...keypad] },
    otp: { img: 'otp', h: 844, hero: 108, label: 'Verify OTP', hs: [
      SKIP, { id: 'edit', x: 309, y: 377, w: 40, h: 24, label: 'Edit number', act: 'edit' },
      { id: 'resend', x: 236, y: 471, w: 62, h: 22, label: 'Resend code', act: 'resend' },
      { id: 'send', x: 14, y: 506, w: 363, h: 38, label: 'Send OTP', act: 'send' }, ...keypad] },
    guest: { img: 'guest', h: 1319, pin: 1219, label: 'Home (guest)', hs: [
      { id: 'catch', x: 0, y: 0, w: 390, h: 1219, label: 'Locked', act: 'locked', catch: true },
      { id: 'avchip', x: 16, y: 55, w: 36, h: 36, label: 'Log in', act: 'login' },
      { id: 'login', x: 15, y: 453, w: 358, h: 40, label: 'Login to Explore Clubs', act: 'login' }, ...homeNav(1319).map((n) => ({ ...n, act: 'locked' }))] },
    home1: { img: 'home1', h: 1407, pin: 1307, label: 'Home (first time)', hs: [
      { id: 'catch', x: 0, y: 0, w: 390, h: 1307, label: 'Locked', act: 'lockedAvatar', catch: true },
      { id: 'unlock', x: 61, y: 228, w: 269, h: 77, label: 'Welcome: unlock your avatar', act: 'unlock' }, ...homeNav(1407).map((n) => ({ ...n, act: 'lockedAvatar' }))] },
    home2: { img: 'home2', h: 1538, pin: 1438, label: 'Avatar unlocked', hs: [
      { id: 'catch', x: 0, y: 0, w: 390, h: 1438, label: 'Continue', act: 'skipwait', catch: true }, ...homeNav(1538).map((n) => ({ ...n, act: 'skipwait' }))] },
    home3: { img: 'home3', h: 1309, pin: 1209, label: 'Home', hs: [
      { id: 'catch', x: 0, y: 0, w: 390, h: 1209, label: 'Background', act: 'tap', catch: true },
      { id: 'avchip', x: 16, y: 54, w: 36, h: 36, label: 'Your avatar', act: 'avatar' },
      { id: 'bell', x: 337, y: 54, w: 36, h: 36, label: 'Notifications', act: 'bell' },
      { id: 'reward', x: 16, y: 118, w: 168, h: 76, label: 'Win reward', act: 'reward' },
      { id: 'join', x: 199, y: 118, w: 176, h: 76, label: 'Join community', act: 'join' },
      { id: 'create', x: 32, y: 337, w: 155, h: 42, label: 'Create a club', act: 'clubtool' },
      { id: 'host', x: 204, y: 337, w: 155, h: 42, label: 'Talk to host', act: 'clubtool' },
      { id: 'club1', x: 16, y: 402, w: 84, h: 183, label: 'Join a club', act: 'join' },
      { id: 'club2', x: 102, y: 402, w: 185, h: 183, label: 'Join the Warzone club', act: 'join' },
      { id: 'club3', x: 289, y: 402, w: 101, h: 183, label: 'Join a club', act: 'join' },
      { id: 'spin', x: 12, y: 636, w: 84, h: 68, label: 'Spin', act: 'daily' }, { id: 'streak', x: 98, y: 636, w: 84, h: 68, label: 'Streak', act: 'daily' },
      { id: 'predict', x: 184, y: 636, w: 84, h: 68, label: 'Predict', act: 'daily' }, { id: 'gamesq', x: 270, y: 636, w: 84, h: 68, label: 'Games', act: 'play', v: 'Games' },
      { id: 'commall', x: 318, y: 745, w: 58, h: 24, label: 'View all communities', act: 'viewall' },
      { id: 'com1', x: 16, y: 769, w: 198, h: 107, label: 'Free Fire community', act: 'join' }, { id: 'com2', x: 234, y: 769, w: 150, h: 107, label: 'Club update', act: 'join' },
      { id: 'gameall', x: 318, y: 899, w: 58, h: 24, label: 'View all games', act: 'viewall' },
      { id: 'g1', x: 16, y: 949, w: 110, h: 110, label: 'Play', act: 'play', v: 'Stan Originals' }, { id: 'g2', x: 140, y: 949, w: 110, h: 110, label: 'Play Trump Cards', act: 'play', v: 'Trump Cards' },
      { id: 'g3', x: 264, y: 949, w: 110, h: 110, label: 'Play UNO', act: 'play', v: 'UNO' },
      { id: 'm1', x: 12, y: 1108, w: 72, h: 92, label: 'Play Ludo', act: 'play', v: 'Ludo' }, { id: 'm2', x: 84, y: 1108, w: 72, h: 92, label: 'Play Bottle shoot', act: 'play', v: 'Bottle shoot' },
      { id: 'm3', x: 156, y: 1108, w: 72, h: 92, label: 'Play Tower Twist', act: 'play', v: 'Tower Twist' }, { id: 'm4', x: 228, y: 1108, w: 72, h: 92, label: 'Play Gold Guard', act: 'play', v: 'Gold Guard' },
      { id: 'm5', x: 300, y: 1108, w: 78, h: 92, label: 'Play Blaze ride', act: 'play', v: 'Blaze ride' },
      ...homeNav(1309)] },
  };
  const SCROLL = { top: 0, clubs: 190, circle: 380, games: 465, reward: 0 };   // body scrolls 0..465 (frame 1209 minus the 744px viewport)
  const NEXT = { welcome: 'phone', sheet: 'continue', unlock: 'unlock', home1: 'unlock' };

  /* ---------- state ---------- */
  const S = { xp: 0, done: {}, screen: null, digits: '', otp: '', logged: false, lvl: 1, sent: false, rating: 0, solved: '' };
  const screens = {}, scrEl = $('#screens'), phone = $('#phone'), wrap = $('#wrap');
  const ptoast = $('#ptoast'), tipEl = $('#tip');
  let timer = 0, hintTimer = 0, toastT = 0;
  let video = null;

  /* ---------- build ---------- */
  function build(id, c) {
    const s = document.createElement('section'); s.className = 'scr'; s.id = 's-' + id; s.setAttribute('aria-label', c.label);
    const pin = c.pin || 0, navH = pin ? c.h - pin : 0, bodyH = 844 - navH;
    const body = document.createElement('div'); body.className = 'sc-body'; body.style.height = bodyH + 'px';
    const inner = document.createElement('div'); inner.className = 'sc-inner'; inner.style.height = (pin || c.h) + 'px';
    const img = new Image(); img.className = 'bg'; img.alt = ''; img.src = 'assets/' + c.img + '.webp'; img.style.height = c.h + 'px'; img.style.top = '0';
    inner.appendChild(img); body.appendChild(inner); s.appendChild(body);
    let nav = null;
    if (pin) {
      nav = document.createElement('div'); nav.className = 'sc-pin'; nav.style.height = navH + 'px';
      const ni = new Image(); ni.className = 'bg'; ni.alt = ''; ni.src = 'assets/' + c.img + '.webp'; ni.style.height = c.h + 'px'; ni.style.top = -pin + 'px'; nav.appendChild(ni); s.appendChild(nav);
    }
    if (c.hero) { const h = document.createElement('div'); h.className = 'hero' + (c.dim ? ' dim' : ''); h.style.height = c.hero + 'px'; inner.appendChild(h); }
    if (id === 'phone') {
      inner.insertAdjacentHTML('beforeend', '<div class="f-patch" id="ph-patch" style="left:129px;top:399px;width:118px;height:22px;display:none"></div><div class="f-digits" id="ph-digits"></div>');
    }
    if (id === 'otp') {
      [93, 147, 201, 256].forEach((x, i) => inner.insertAdjacentHTML('beforeend', `<div class="otp-d" data-i="${i}" style="left:${x}px"></div>`));
    }
    c.hs.forEach((h) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'hs' + (h.catch ? ' catch' : ''); b.dataset.act = h.act; b.dataset.id = h.id; if (h.v) b.dataset.v = h.v;
      b.setAttribute('aria-label', h.label); b.style.cssText = `left:${h.x}px;top:${h.y - (pin && h.y >= pin ? pin : 0)}px;width:${h.w}px;height:${h.h}px`;
      if (h.catch) { b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); }
      (pin && h.y >= pin ? nav : inner).appendChild(b);
    });
    scrEl.appendChild(s); screens[id] = { el: s, body, inner, nav, c };
  }
  Object.entries(SC).forEach(([id, c]) => build(id, c));

  /* one shared video for the animated hero strip, moved into the active screen */
  function heroVideo() {
    if (video) return video;
    video = document.createElement('video'); video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'auto'; video.setAttribute('aria-hidden', 'true');
    video.innerHTML = '<source src="assets/hero.mp4" type="video/mp4"><source src="assets/hero.webm" type="video/webm">'; return video;
  }
  function attachHero(id) {
    const s = screens[id], slot = s && $('.hero', s.inner), v = heroVideo();
    if (!slot) { v.pause(); return; }
    slot.appendChild(v); if (!reduce) v.play().catch(() => {});
  }

  /* ---------- HUD ---------- */
  const missionsEl = $('#missions');
  MISSIONS.forEach((m) => {
    const li = document.createElement('li'); li.dataset.id = m.id;
    li.innerHTML = `<span class="ck"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg></span><span class="mt">${m.t}<small>${m.d}</small></span><span class="xp">+${m.xp}</span>`;
    missionsEl.appendChild(li);
  });
  function renderHud() {
    $('#xp').textContent = S.xp; $('#xpfill').style.width = Math.min(100, (S.xp / XP_MAX) * 100) + '%';
    const bar = $('#xpbar'); bar.setAttribute('aria-valuenow', S.xp); $('#lvl').textContent = S.lvl;
    const first = MISSIONS.find((m) => !S.done[m.id]);
    $$('li', missionsEl).forEach((li) => { li.classList.toggle('done', !!S.done[li.dataset.id]); li.classList.toggle('now', !!first && li.dataset.id === first.id); });
    const un = !!S.done.avatar; $('#hud').classList.toggle('unlocked', un); $('#hudName').textContent = un ? 'Skull Thorn' + (S.lvl > 1 ? ' · upgraded' : '') : 'Avatar locked';
  }
  function floatXp(txt, x, y) {
    const f = document.createElement('div'); f.className = 'xp-float'; f.textContent = txt; f.style.left = x + 'px'; f.style.top = y + 'px'; document.body.appendChild(f); setTimeout(() => f.remove(), 1300);
  }
  function award(id, ev) {
    if (S.done[id]) return false;
    const m = MISSIONS.find((x) => x.id === id); S.done[id] = true; S.xp += m.xp; renderHud();
    const hud = $('#hud'); hud.classList.remove('pulse'); void hud.offsetWidth; hud.classList.add('pulse');
    const r = ev && ev.target && ev.target.getBoundingClientRect ? ev.target.getBoundingClientRect() : phone.getBoundingClientRect();
    floatXp('+' + m.xp + ' XP', r.left + r.width / 2 - 24, r.top + r.height / 2 - 10);
    tip(); if (MISSIONS.every((x) => S.done[x.id])) setTimeout(levelUp, 900);
    return true;
  }
  const TIPS = {
    welcome: 'Tap a sign-in option to begin. You can also press Skip and see what a guest gets.',
    sheet: 'Stan recognises your number. Confirm with Continue, or pick another method.',
    phone: 'Type any 10 digits on the keypad (or your keyboard), then Submit.',
    otp: 'Enter any 4 digits, then Send OTP.',
    guest: 'Guests see a locked home. Log in to unlock your avatar.',
    home1: 'Tap the Welcome card to unlock your avatar. The rest of the app waits.',
    home2: 'Skull Thorn is yours. The home screen opens in a moment.',
    home3: 'Join a club and play a game to finish the quest. Tap the outlined card.',
  };
  function tip(t) { tipEl.textContent = t || (S.screen === 'home3' && !S.done.join ? TIPS.home3 : S.screen === 'home3' && !S.done.play ? 'Nice. Now play a game: any tile in Games or Must try.' : TIPS[S.screen] || ''); }

  /* ---------- phone toast / effects ---------- */
  function toast(t) { ptoast.textContent = t; ptoast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => ptoast.classList.remove('on'), 1900); }
  function ripple(btn, ev) {
    const r = btn.getBoundingClientRect(), k = phoneScale || 1, d = Math.max(r.width, r.height) / k * 1.6;
    const x = ev && ev.clientX ? (ev.clientX - r.left) / k : r.width / (2 * k), y = ev && ev.clientY ? (ev.clientY - r.top) / k : r.height / (2 * k);
    const s = document.createElement('span'); s.className = 'rip'; s.style.cssText = `width:${d}px;height:${d}px;left:${x - d / 2}px;top:${y - d / 2}px`;
    btn.style.overflow = 'hidden'; btn.appendChild(s); setTimeout(() => s.remove(), 600);
  }
  function nudge(sel) {
    const n = $(sel, screens[S.screen].el); if (!n) return; n.classList.remove('nudge'); void n.offsetWidth; n.classList.add('nudge');
  }
  function shakePhone() { if (reduce) return; phone.classList.remove('shake'); void phone.offsetWidth; phone.classList.add('shake'); setTimeout(() => phone.classList.remove('shake'), 520); }
  function flash() { const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }

  /* ---------- navigation ---------- */
  function go(id, mode = 'slide') {
    const prev = S.screen && screens[S.screen], nxt = screens[id]; if (!nxt) return;
    clearTimeout(timer); clearTimeout(hintTimer);
    $$('.scr', scrEl).forEach((s) => s.classList.remove('in-slide', 'out-slide', 'in-fade', 'out-fade', 'in-reveal', 'out-reveal'));
    if (prev && prev !== nxt) { prev.el.classList.remove('active'); prev.el.classList.add('out', 'out-' + mode); setTimeout(() => prev.el.classList.remove('out', 'out-' + mode), 700); }
    nxt.el.classList.add('active', 'in-' + mode); setTimeout(() => nxt.el.classList.remove('in-' + mode), 900);
    nxt.body.scrollTop = 0; S.screen = id; attachHero(id); tip();
    if (id === 'phone') { S.digits = ''; renderDigits(); }
    if (id === 'otp') { S.otp = ''; renderOtp(); }
    if (id === 'home2') timer = setTimeout(() => { if (S.screen === 'home2') go('home3', 'fade'); }, 4000);
    hintTimer = setTimeout(hint, 1500);
  }
  function hint() {
    $$('.hs.hint').forEach((n) => n.classList.remove('hint')); const s = screens[S.screen]; if (!s) return;
    let sel = null;
    if (S.screen === 'welcome') sel = '[data-id="phone"]'; else if (S.screen === 'sheet') sel = '[data-id="continue"]'; else if (S.screen === 'home1') sel = '[data-id="unlock"]';
    else if (S.screen === 'phone') sel = S.digits.length === 10 ? '[data-id="submit"]' : '[data-id="key-5"]'; else if (S.screen === 'otp') sel = S.otp.length === 4 ? '[data-id="send"]' : '[data-id="key-5"]';
    else if (S.screen === 'guest') sel = '[data-id="login"]'; else if (S.screen === 'home3') sel = !S.done.join ? '[data-id="join"]' : (!S.done.play ? '[data-id="g2"]' : null);
    const n = sel && $(sel, s.el); if (n) n.classList.add('hint');
  }

  function renderDigits() {
    const d = $('#ph-digits'), p = $('#ph-patch'); if (!d) return;
    d.textContent = S.digits.replace(/(\d{5})(\d{0,5})/, (m, a, b) => (b ? a + ' ' + b : a)); p.style.display = S.digits ? 'block' : 'none';
  }
  function renderOtp() {
    $$('.otp-d', screens.otp.el).forEach((n, i) => { n.textContent = S.otp[i] || ''; n.classList.toggle('fill', !!S.otp[i]); n.classList.toggle('on', i === Math.min(S.otp.length, 3)); });
  }
  function key(k) {
    if (S.screen === 'phone') { S.digits = k === 'del' ? S.digits.slice(0, -1) : (S.digits.length < 10 ? S.digits + k : S.digits); renderDigits(); }
    else if (S.screen === 'otp') { S.otp = k === 'del' ? S.otp.slice(0, -1) : (S.otp.length < 4 ? S.otp + k : S.otp); renderOtp(); }
    hint();
  }

  /* ---------- actions ---------- */
  const ACT = {
    signin(ev) { award('start', ev); go('sheet', 'fade'); },
    continue(ev) { award('verify', ev); go('home1'); },
    other() { go('phone'); },
    skip() { go('guest'); },
    login() { go('welcome'); },
    field() { toast('Use the keypad below'); nudge('[data-id="key-5"]'); },
    key(ev, b) { key(b.dataset.v); },
    submit() { if (S.digits.length === 10) go('otp'); else { toast('Enter 10 digits (any number works)'); nudge('[data-id="field"]'); shakePhone(); } },
    send(ev) { if (S.otp.length === 4) { award('verify', ev); go('home1'); } else { toast('Enter the 4-digit code (any digits work)'); shakePhone(); } },
    edit() { go('phone'); },
    resend() { toast('A new code is on its way'); },
    locked() { toast('Log in to unlock the app'); nudge('[data-id="login"]'); },
    lockedAvatar() { toast('Unlock your avatar first'); nudge('[data-id="unlock"]'); },
    unlock(ev) {
      award('avatar', ev); flash(); shakePhone(); burst(0.5, 0.4, 60);
      const b = $('#banner'); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
      go('home2', 'reveal'); renderHud();
    },
    skipwait() { go('home3', 'fade'); },
    tap() { /* ripple only */ },
    avatar() { toast('Skull Thorn · level ' + S.lvl); const h = $('#hud'); h.classList.remove('pulse'); void h.offsetWidth; h.classList.add('pulse'); },
    bell() { toast('You are all caught up'); },
    reward() { toast(S.lvl > 1 ? 'Reward claimed' : 'Finish the quest to claim this reward'); },
    join(ev) { if (award('join', ev)) toast('You joined the club. Now play a game.'); else toast('Already in. Try a game tile.'); hint(); },
    clubtool() { toast('Tap a club card to join one'); nudge('[data-id="club2"]'); },
    daily() { toast('Daily rewards open after level 2'); },
    viewall() { toast('The full list opens in the real app'); },
    play(ev, b) {
      const g = b.dataset.v || 'a game'; toast('Launching ' + g + '...');
      if (!S.done.join && !S.done.play) { /* allow any order */ }
      award('play', ev); hint();
    },
    nav(ev, b) {
      const y = SCROLL[b.dataset.v] || 0, body = screens[S.screen].body;
      body.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    },
  };
  scrEl.addEventListener('click', (e) => {
    const b = e.target.closest('.hs'); if (!b || !scrEl.contains(b)) return;
    if (!b.classList.contains('catch')) ripple(b, e);
    else if (b.dataset.act === 'tap') ripple(b, e);
    const f = ACT[b.dataset.act]; if (f) f(e, b);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea,.modal:not([hidden])')) { if (e.key === 'Escape') closeModals(); return; }
    if (S.screen === 'phone' || S.screen === 'otp') {
      if (/^[0-9]$/.test(e.key)) { key(e.key); e.preventDefault(); } else if (e.key === 'Backspace') { key('del'); e.preventDefault(); } else if (e.key === 'Enter') { ACT[S.screen === 'phone' ? 'submit' : 'send']({ target: phone }); }
    }
    if (e.key === 'Escape') closeModals();
  });

  /* ---------- confetti ---------- */
  const cv = $('#confetti'), cx = cv.getContext('2d'); let parts = [], raf = 0;
  const COLORS = ['#8149F4', '#39FF14', '#ffffff', '#f5b301', '#ff5c8a'];
  function size() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
  addEventListener('resize', size); size();
  function burst(px, py, n = 140) {
    if (reduce) return;
    const ox = cv.width * px, oy = cv.height * py;
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = (4 + Math.random() * 9) * devicePixelRatio; parts.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6 * devicePixelRatio, r: (3 + Math.random() * 5) * devicePixelRatio, c: COLORS[i % COLORS.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 90 + Math.random() * 50 }); }
    if (!raf) raf = requestAnimationFrame(tickConfetti);
  }
  function tickConfetti() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => p.life-- > 0 && p.y < cv.height + 40);
    parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += .35 * devicePixelRatio; p.vx *= .992; p.rot += p.vr; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.globalAlpha = Math.min(1, p.life / 30); cx.fillStyle = p.c; cx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); cx.restore(); });
    raf = parts.length ? requestAnimationFrame(tickConfetti) : 0;
  }

  /* ---------- modals ---------- */
  const modals = { intro: $('#intro'), levelup: $('#levelup'), fb: $('#fb') };
  let lastFocus = null;
  function openModal(name) { lastFocus = document.activeElement; Object.values(modals).forEach((m) => (m.hidden = true)); modals[name].hidden = false; const f = $('button,input,textarea,a', modals[name]); if (f) f.focus({ preventScroll: true }); }
  function closeModals() { Object.values(modals).forEach((m) => (m.hidden = true)); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  function levelUp() {
    S.lvl = 2; renderHud(); tip('Quest complete. Skull Thorn is now level 2.');
    openModal('levelup'); burst(0.5, 0.35, 200); setTimeout(() => burst(0.25, 0.4, 90), 250); setTimeout(() => burst(0.75, 0.4, 90), 450);
  }
  $('#startQuest').addEventListener('click', () => { closeModals(); });
  $('#introFb').addEventListener('click', () => openModal('fb'));
  $('#luFb').addEventListener('click', () => openModal('fb'));
  $('#luClose').addEventListener('click', closeModals);
  $('#openFb').addEventListener('click', () => openModal('fb'));
  $('#fbClose').addEventListener('click', closeModals);
  Object.values(modals).forEach((m) => m.addEventListener('mousedown', (e) => { if (e.target === m && m !== modals.intro) closeModals(); }));

  /* ---------- feedback form ---------- */
  const stars = $('#stars');
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false'); b.setAttribute('aria-label', i + (i === 1 ? ' star' : ' stars')); b.dataset.v = i;
    b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>'; stars.appendChild(b);
  }
  stars.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.rating = +b.dataset.v; $$('button', stars).forEach((x) => { x.classList.toggle('on', +x.dataset.v <= S.rating); x.setAttribute('aria-checked', +x.dataset.v === S.rating ? 'true' : 'false'); }); });
  $('#solved').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.solved = b.dataset.v; $$('#solved button').forEach((x) => x.setAttribute('aria-checked', x === b ? 'true' : 'false')); });
  const msg = $('#fbMsg'), form = $('#fbForm'), send = $('#fbSend'), mail = $('#fbMail');
  function summary() {
    const done = MISSIONS.filter((m) => S.done[m.id]).length;
    return { rating: S.rating ? S.rating + ' / 5' : 'not given', solved_the_overwhelm: S.solved || 'not answered', comment: $('#comment').value.trim() || '(none)', reply_email: $('#replyTo').value.trim() || '(none)', missions_completed: done + ' / ' + MISSIONS.length, xp: S.xp };
  }
  function mailto() {
    const s = summary(), body = Object.entries(s).map(([k, v]) => k.replace(/_/g, ' ') + ': ' + v).join('\n');
    return 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Stan prototype feedback') + '&body=' + encodeURIComponent(body);
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); msg.className = 'fb-msg'; mail.hidden = true;
    if (!S.rating && !S.solved && !$('#comment').value.trim()) { msg.className = 'fb-msg err'; msg.textContent = 'Give a rating, pick an answer or write a line first.'; return; }
    if ($('#honey').value) return;
    const em = $('#replyTo').value.trim(); if (em && !/^\S+@\S+\.\S+$/.test(em)) { msg.className = 'fb-msg err'; msg.textContent = 'That email does not look right. Leave it empty if you prefer.'; return; }
    send.disabled = true; send.textContent = 'Sending...'; msg.textContent = '';
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + MAIL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: 'Stan prototype feedback', _template: 'table', _captcha: 'false', ...(em ? { _replyto: em } : {}), ...summary() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === 'false') throw new Error(data.message || 'failed');
      S.sent = true; form.classList.add('sent'); msg.className = 'fb-msg ok'; msg.textContent = 'Sent. Thank you, this lands straight in my inbox.'; send.hidden = true; burst(0.5, 0.45, 80);
    } catch (err) {
      msg.className = 'fb-msg err'; msg.textContent = 'Could not send it from here. You can email it instead, nothing is lost.'; mail.href = mailto(); mail.hidden = false; send.disabled = false; send.textContent = 'Try again';
    }
  });

  /* ---------- restart / fit ---------- */
  function reset() {
    S.xp = 0; S.done = {}; S.digits = ''; S.otp = ''; S.lvl = 1; renderHud(); renderDigits(); renderOtp();
    Object.values(screens).forEach((s) => { s.el.classList.remove('active', 'out'); s.body.scrollTop = 0; });
    S.screen = null; go('welcome', 'fade'); tip();
  }
  $('#restart').addEventListener('click', () => { closeModals(); reset(); });
  let phoneScale = 1;
  function fit() {
    const narrow = innerWidth <= 900, avW = narrow ? innerWidth - 24 : innerWidth - 340 - 56 - 48, avH = (window.visualViewport ? visualViewport.height : innerHeight) - (narrow ? 270 : 96);
    phoneScale = Math.max(.42, Math.min(1, avH / 864, avW / 410));
    phone.style.transform = `scale(${phoneScale})`; phone.style.setProperty('--s', phoneScale); wrap.style.width = 410 * phoneScale + 'px'; wrap.style.height = 864 * phoneScale + 'px';
  }
  addEventListener('resize', fit); fit(); addEventListener('load', fit); setTimeout(fit, 400);
  document.addEventListener('visibilitychange', () => { if (video) { if (document.hidden) video.pause(); else if (S.screen && $('.hero', screens[S.screen].inner) && !reduce) video.play().catch(() => {}); } });

  renderHud(); go('welcome', 'fade');
  const h = location.hash;
  if (h === '#feedback') openModal('fb'); else if (h === '#play') { /* straight into the game */ } else openModal('intro');
  window.STAN = { S, go, award, ACT };
})();
