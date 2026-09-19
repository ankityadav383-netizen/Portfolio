(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#screen');
  const live = $('#live');
  let current = 'welcome';
  const stack = [];
  /* what the Back arrow returns to when a step is opened from the guide */
  const PRE = { welcome: [], otp: ['welcome'], home: ['welcome', 'otp'], trip: ['home'], details: ['home', 'trip'], stops: ['home', 'trip'], error: ['home', 'trip'] };
  const ORDER = ['welcome', 'otp', 'home', 'trip', 'details', 'stops', 'error'];

  function announce(msg) { live.textContent = ''; setTimeout(() => (live.textContent = msg), 30); }

  function markStep() {
    const key = current === 'home' && sheetLayer.classList.contains('open') ? 'switch' : current;
    $$('#steps button').forEach(b => { if (b.dataset.step === key) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    /* when embedded (portfolio slide), tell the host page which screen is showing so it can reveal matching details */
    if (window.parent !== window) window.parent.postMessage({ arivooProto: 'parent', step: key }, '*');
  }

  function go(name, { replace = false, back = false } = {}) {
    if (name === current) return;
    const from = $(`.scr[data-screen="${current}"]`);
    const to = $(`.scr[data-screen="${name}"]`);
    if (!back && !replace) stack.push(current);
    from.classList.remove('active');
    from.classList.toggle('back', !back);
    to.classList.toggle('back', false);
    to.classList.add('active');
    current = name;
    closeSheet();
    markStep();
  }
  function goBack() { const p = stack.pop(); if (p) go(p, { back: true }); }

  /* ---- switch-school sheet (overlay on the home screen) ---- */
  const sheetLayer = $('#sheetLayer');
  function openSheet() { sheetLayer.classList.add('open'); sheetLayer.setAttribute('aria-hidden', 'false'); announce('Switch school opened'); markStep(); }
  function closeSheet() { if (!sheetLayer.classList.contains('open')) return; sheetLayer.classList.remove('open'); sheetLayer.setAttribute('aria-hidden', 'true'); markStep(); }

  /* ---- welcome: 10-digit number enables Submit ---- */
  const phone = $('#phone'), s1 = $('#submit1');
  function setBtn(btn, on) { btn.disabled = !on; btn.classList.toggle('dis', !on); btn.classList.toggle('en', on); }
  phone.addEventListener('input', () => {
    phone.value = phone.value.replace(/\D/g, '').slice(0, 10);
    setBtn(s1, phone.value.length === 10);
  });
  phone.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !s1.disabled) s1.click(); });

  /* ---- otp: 4 boxes, auto-advance, Submit enabled when full ---- */
  const boxes = $$('#otpRow input'), s2 = $('#submit2');
  function markActive() {
    const focused = boxes.findIndex(b => b === document.activeElement);
    const idx = focused >= 0 ? focused : Math.max(0, boxes.findIndex(b => !b.value));
    boxes.forEach((b, i) => b.parentElement.classList.toggle('act', i === idx));
    setBtn(s2, boxes.every(b => b.value));
  }
  boxes.forEach((b, i) => {
    b.addEventListener('input', () => {
      b.value = b.value.replace(/\D/g, '').slice(-1);
      if (b.value && i < boxes.length - 1) boxes[i + 1].focus();
      markActive();
    });
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !b.value && i > 0) { boxes[i - 1].value = ''; boxes[i - 1].focus(); markActive(); }
      if (e.key === 'Enter' && !s2.disabled) s2.click();
    });
    b.addEventListener('paste', (e) => {
      const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, boxes.length);
      if (!d) return;
      e.preventDefault();
      [...d].forEach((ch, k) => (boxes[k].value = ch));
      boxes[Math.min(d.length, boxes.length - 1)].focus();
      markActive();
    });
    b.addEventListener('focus', markActive);
    b.addEventListener('blur', () => setTimeout(markActive, 0));
  });
  function resetOtp() { boxes.forEach(b => (b.value = '')); markActive(); }

  /* ---- actions ---- */
  const actions = {
    back: goBack,
    login: () => { $('#otpNum').textContent = '+91 ' + phone.value; resetOtp(); go('otp'); setTimeout(() => boxes[0].focus(), 260); announce('Enter the verification code'); },
    edit: () => { stack.length = 0; go('welcome', { back: true }); setTimeout(() => phone.focus(), 260); },
    resend: () => { resetOtp(); boxes[0].focus(); announce('Verification code sent again'); },
    verify: () => go('home'),
    track: () => go('trip'),
    switch: openSheet,
    closesheet: closeSheet,
    pick: () => { closeSheet(); announce('Adamas International School selected'); },
    details: () => go('details'),
    okay: () => goBack(),
    expand: () => go('stops'),
    collapse: () => goBack(),
    refresh: (el, e) => {
      e.stopPropagation();
      el.classList.remove('spin'); void el.offsetWidth; el.classList.add('spin');
      announce('Refreshing bus location');
      setTimeout(() => go('error'), 650);
    },
    call: () => announce('Calling is not part of the designed flow'),
    live: () => announce('Live tracking is not part of the designed flow'),
    school: () => announce('Calling the school is not part of the designed flow'),
  };

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    const fn = actions[el.dataset.act];
    if (fn) fn(el, e);
  });
  $$('.opt:not(.sel)', app).forEach(o => { o.setAttribute('aria-disabled', 'true'); o.addEventListener('click', () => announce('Only Adamas International School is designed in this flow')); });

  app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const el = e.target.closest('[data-act]');
      if (el && !['INPUT', 'BUTTON'].includes(el.tagName)) { e.preventDefault(); el.click(); }
    }
    if (e.key === 'Escape') closeSheet();
  });

  /* ---- guide ---- */
  $$('#steps button').forEach(b => b.addEventListener('click', () => {
    const key = b.dataset.step;
    const target = key === 'switch' ? 'home' : key;
    closeSheet();
    if (target === 'otp') resetOtp();
    stack.length = 0; (PRE[target] || []).forEach(s => stack.push(s));
    go(target, { replace: true, back: ORDER.indexOf(target) < ORDER.indexOf(current) });
    if (key === 'switch') openSheet();
    markStep();
  }));
  $('#restart').addEventListener('click', () => location.reload());

  /* ---- host page (portfolio slide) can jump to a step ---- */
  addEventListener('message', (e) => {
    const d = e.data;
    if (window.parent === window || e.source !== window.parent || !d || d.arivooProto !== 'parent' || !d.goto) return;
    const b = $(`#steps button[data-step="${d.goto}"]`);
    if (b) b.click();
  });
  markStep();

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
