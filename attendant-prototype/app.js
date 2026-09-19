(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#screen');
  const live = $('#live');
  let current = 'welcome';
  const stack = [];
  let autoTimer = 0;
  /* what the Back arrow returns to when a step is opened from the guide */
  const PRE = { welcome: [], number: ['welcome'], routes: ['welcome'], before: ['welcome', 'routes'], live: ['welcome', 'routes'], students: ['welcome', 'routes', 'live'], done: ['welcome', 'routes', 'live', 'students'] };
  const ORDER = ['welcome', 'number', 'routes', 'before', 'live', 'students', 'done'];

  function announce(msg) { live.textContent = ''; setTimeout(() => (live.textContent = msg), 30); }

  const students = $('.scr[data-screen="students"]');
  const michael = $('.si[data-i="0"]', students);
  function stepKey() { return current === 'students' && michael.classList.contains('open') ? 'guardians' : current; }
  function markStep() {
    const key = stepKey();
    $$('#steps button').forEach(b => { if (b.dataset.step === key) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    /* when embedded (portfolio slide), tell the host page which screen is showing so it can reveal matching details */
    if (window.parent !== window) window.parent.postMessage({ arivooProto: 'attendant', step: key }, '*');
  }

  function go(name, { replace = false, back = false } = {}) {
    if (name === current) return;
    clearTimeout(autoTimer);
    if (current === 'done') stopCountdown();
    const from = $(`.scr[data-screen="${current}"]`);
    const to = $(`.scr[data-screen="${name}"]`);
    if (!back && !replace) stack.push(current);
    from.classList.remove('active');
    from.classList.toggle('back', !back);
    to.classList.toggle('back', false);
    to.classList.add('active');
    current = name;
    if (name === 'students') { const sc = $('.ss', students); sc.scrollTop = 0; }
    if (name === 'done') startCountdown();
    markStep();
  }
  function goBack() { const p = stack.pop(); if (p) go(p, { back: true }); }

  /* ---- login: two frames (idle / keyboard open) share one number ---- */
  const phones = $$('input[data-phone]');
  const [phoneA, phoneB] = phones;
  const logins = $$('[data-act="login"]');
  const valid = v => /^[6-9]\d{9}$/.test(v);
  function syncPhone(from) {
    const v = from.value.replace(/\D/g, '').slice(0, 10);
    phones.forEach(p => { p.value = v; p.closest('.fld').classList.toggle('err', v.length > 0 && !/^[6-9]/.test(v)); });
    logins.forEach(b => { const ok = valid(v); b.disabled = !ok; b.classList.toggle('dis', !ok); b.classList.toggle('en', ok); });
    if (v.length > 0 && !/^[6-9]/.test(v) && from === phoneB) announce('Invalid number');
  }
  phones.forEach(p => {
    p.addEventListener('input', () => syncPhone(p));
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter' && valid(p.value)) actions.login(); });
  });
  /* focusing the number on the idle frame opens the keyboard frame */
  phoneA.addEventListener('focus', () => { if (current === 'welcome') { go('number'); setTimeout(() => { phoneB.focus(); phoneB.setSelectionRange(phoneB.value.length, phoneB.value.length); }, 30); } });
  $('.kb', app).addEventListener('mousedown', (e) => e.preventDefault());

  /* ---- students ---- */
  const marked = $('#marked'), bulk = $('.ov .tg', app);
  const kids = $$('.si', students);
  const setTg = (tg, on) => tg.setAttribute('aria-checked', on ? 'true' : 'false');
  function refreshCount() {
    const n = kids.filter(k => $('.tg', k).getAttribute('aria-checked') === 'true').length;
    marked.textContent = n + ' of ' + kids.length + ' Students Marked';
    setTg(bulk, n === kids.length);
  }

  /* ---- confirmation: tick animation, countdown, redirect to the route listing ---- */
  const COUNT = 3;                 /* seconds shown on the countdown */
  const TICK_MS = 900;             /* tick animation runs first, then the countdown starts */
  let cdDelay = null, cdTimer = null;
  function stopCountdown() { clearTimeout(cdDelay); clearInterval(cdTimer); cdDelay = cdTimer = null; }
  function startCountdown() {
    stopCountdown();
    const scr = $('.scr[data-screen="done"]'), num = $('#cdNum');
    const n0 = kids.filter(k => $('.tg', k).getAttribute('aria-checked') === 'true').length;
    $('#doneSub').textContent = n0 + ' of ' + kids.length + ' students marked present';
    num.textContent = COUNT;
    scr.style.setProperty('--cd', COUNT + 's');
    scr.classList.remove('play'); void scr.offsetWidth; scr.classList.add('play');
    announce(`Attendance submitted. Back to the route listing in ${COUNT} seconds.`);
    cdDelay = setTimeout(() => {
      let n = COUNT;
      cdTimer = setInterval(() => {
        n -= 1;
        if (n <= 0) { stopCountdown(); toListing(); return; }
        num.textContent = n;
      }, 1000);
    }, TICK_MS);
  }
  /* back to the route listing, with a clean attendance list for the next stop */
  function toListing() {
    stopCountdown();
    kids.forEach(k => setTg($('.tg', k), false)); refreshCount();
    michael.classList.remove('open'); $('.vp', michael).setAttribute('aria-expanded', 'false'); $('.vp span', michael).textContent = 'View Parent Details';
    stack.length = 0; stack.push('welcome', 'routes');
    go('live', { replace: true, back: true });
    announce('Route listing');
  }

  /* ---- actions ---- */
  const nyi = (msg) => () => announce(msg);
  const actions = {
    back: goBack,
    login: () => { if (!valid(phoneA.value)) return; phones.forEach(p => p.blur()); go('routes'); announce('Choose your route'); },
    dismiss: () => { phoneB.blur(); go('welcome', { back: true }); },
    start: () => {
      go('before');
      announce('Route started. Bus will start at 07:00 AM');
      autoTimer = setTimeout(() => { if (current === 'before') { go('live', { replace: true }); announce('Next stop in 5 minutes, Teghoria Flyover Crossing'); } }, 3200);
    },
    startdrop: nyi('Only the pick-up route is designed in this flow'),
    ended: nyi('Ended trips are not designed in this flow'),
    menu: nyi('The menu is not part of the designed flow'),
    reload: nyi('Refresh is not part of the designed flow'),
    bell: nyi('Notifications are not part of the designed flow'),
    details: () => go('students'),
    toggle: (el) => { setTg(el, el.getAttribute('aria-checked') !== 'true'); refreshCount(); },
    all: (el) => { const on = el.getAttribute('aria-checked') !== 'true'; kids.forEach(k => setTg($('.tg', k), on)); refreshCount(); },
    parent: (el) => {
      const item = el.closest('.si');
      if (item !== michael) { announce('Parent details are designed for Michael only'); return; }
      const open = item.classList.toggle('open');
      el.setAttribute('aria-expanded', open ? 'true' : 'false');
      $('span', el).textContent = open ? 'Hide Parent Details' : 'View Parent Details';
      markStep();
    },
    call: nyi('Calling is not part of the designed flow'),
    submit: () => go('done'),
    golist: toListing,
  };

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    const fn = actions[el.dataset.act];
    if (fn) fn(el, e);
  });
  app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const el = e.target.closest('[data-act]');
      if (el && !['INPUT', 'BUTTON'].includes(el.tagName)) { e.preventDefault(); el.click(); }
    }
    if (e.key === 'Escape' && current === 'number') actions.dismiss();
  });

  /* ---- guide ---- */
  $$('#steps button').forEach(b => b.addEventListener('click', () => {
    const key = b.dataset.step;
    const target = key === 'guardians' ? 'students' : key;
    clearTimeout(autoTimer);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    stack.length = 0; (PRE[target] || []).forEach(s => stack.push(s));
    if (key === 'guardians') { michael.classList.add('open'); $('.vp', michael).setAttribute('aria-expanded', 'true'); $('.vp span', michael).textContent = 'Hide Parent Details'; setTg($('.tg', michael), true); refreshCount(); }
    else if (target === 'students' || target === 'done') { michael.classList.remove('open'); $('.vp', michael).setAttribute('aria-expanded', 'false'); $('.vp span', michael).textContent = 'View Parent Details'; }
    go(target, { replace: true, back: ORDER.indexOf(target) < ORDER.indexOf(current) });
    if (target === 'number') setTimeout(() => phoneB.focus(), 60);
    markStep();
  }));
  /* host page (portfolio slide) can jump to a step */
  addEventListener('message', (e) => {
    const d = e.data;
    if (window.parent === window || e.source !== window.parent || !d || d.arivooProto !== 'attendant' || !d.goto) return;
    const b = $(`#steps button[data-step="${d.goto}"]`);
    if (b) b.click();
  });
  $('#restart').addEventListener('click', () => location.reload());
  refreshCount(); markStep();

  /* ---- fit stage to viewport ---- */
  const stage = $('#stage'), wrap = $('#stageWrap');
  function fit() {
    const embed = document.documentElement.classList.contains('embed');
    const phoneMode = innerWidth <= 760 && !embed;
    const side = phoneMode || embed ? 0 : 316, mv = phoneMode ? 0 : 48, mh = phoneMode ? 0 : 32;
    const s = Math.min(1, (innerHeight - mv) / 844, (innerWidth - side - mh) / 390) * (embed && innerWidth > 600 ? 0.78 : 1);
    stage.style.transform = `scale(${s})`;
    wrap.style.width = 390 * s + 'px'; wrap.style.height = 844 * s + 'px';
    if (phoneMode) { stage.style.borderRadius = '0'; stage.style.boxShadow = 'none'; }
  }
  addEventListener('resize', fit); fit();
})();
