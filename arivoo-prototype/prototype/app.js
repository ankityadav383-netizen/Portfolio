(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const live = $('#live');
  const ORDER = ['list', 'camera', 'photos', 'results', 'done'];
  let current = 'list';
  const stack = [];

  function announce(msg) { live.textContent = ''; setTimeout(() => (live.textContent = msg), 30); }

  function go(name, { replace = false, back = false } = {}) {
    if (name === current) return;
    const from = $(`.scr[data-screen="${current}"]`);
    const to = $(`.scr[data-screen="${name}"]`);
    if (!back && !replace) stack.push(current);
    if (current === 'done') stopCountdown();
    from.classList.remove('active');
    from.classList.toggle('back', !back);
    to.classList.toggle('back', false);
    to.classList.add('active');
    current = name;
    if (name === 'done') startCountdown();
    $$('#steps button').forEach(b => { if (b.dataset.step === name) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    closeSheet();
  }
  function goBack() {
    const prev = stack.pop();
    if (prev) go(prev, { back: true });
  }

  /* ---- bottom sheet ---- */
  const sheetLayer = $('#sheetLayer');
  function openSheet() { sheetLayer.classList.add('open'); sheetLayer.setAttribute('aria-hidden', 'false'); announce('Class details opened'); }
  function closeSheet() { sheetLayer.classList.remove('open'); sheetLayer.setAttribute('aria-hidden', 'true'); }

  /* ---- switches ---- */
  function setSw(sw, on) { sw.classList.toggle('on', on); sw.classList.toggle('off', !on); sw.setAttribute('aria-checked', String(on)); }
  function syncMarkAll(scr) {
    const mark = $('[data-act="markall"]', scr);
    if (!mark) return;
    const sws = $$('[data-act="toggle"]', scr);
    setSw(mark, sws.length > 0 && sws.every(s => s.classList.contains('on')));
  }

  /* ---- photos ---- */
  /* a fresh capture shows 1 card; every Retake -> shutter reveals one more (up to 3) */
  let retaking = false;
  function resetPhotos() {
    $$('#pcards .pcard').forEach((c, i) => { c.classList.remove('gone'); c.classList.toggle('later', i > 0); });
    updatePhotos();
  }
  function revealNextPhoto() {
    const next = $('#pcards .pcard.later') || $('#pcards .pcard.gone');
    if (next) next.classList.remove('later', 'gone');
    updatePhotos();
  }
  function updatePhotos() {
    const n = $$('#pcards .pcard:not(.gone):not(.later)').length;
    $('#pcount').textContent = `Photo Captured : ${n}`;
    $('#pempty').hidden = n !== 0;
    $('[data-act="review"]').classList.toggle('disabled', n === 0);
    const first = $('#pcards .pcard:not(.gone):not(.later)');
    $$('#pcards .pcard').forEach(c => (c.style.marginTop = ''));
    if (first) first.style.marginTop = '0';
  }

  /* ---- results tabs ---- */
  function setTab(key) {
    $$('.scr[data-screen="results"] .chip').forEach(c => {
      const on = c.dataset.tab === key;
      c.classList.toggle('sel', on);
      c.setAttribute('aria-selected', String(on));
    });
    $$('.scr[data-screen="results"] [data-panel]').forEach(p => (p.hidden = p.dataset.panel !== key));
  }

  /* ---- confirmation: tick animation, countdown, redirect ---- */
  const COUNT = 3;                 /* seconds shown on the countdown */
  const TICK_MS = 900;             /* tick animation runs first, then the countdown starts */
  let cdDelay = null, cdTimer = null;
  const initialSwitches = $$('[data-act="toggle"]').map(s => s.classList.contains('on'));
  function stopCountdown() { clearTimeout(cdDelay); clearInterval(cdTimer); cdDelay = cdTimer = null; }
  function startCountdown() {
    stopCountdown();
    const scr = $('.scr[data-screen="done"]'), num = $('#cdNum');
    num.textContent = COUNT;
    scr.style.setProperty('--cd', COUNT + 's');
    scr.classList.remove('play'); void scr.offsetWidth; scr.classList.add('play');
    announce(`Attendance submitted. Going to the dashboard in ${COUNT} seconds.`);
    cdDelay = setTimeout(() => {
      let n = COUNT;
      cdTimer = setInterval(() => {
        n -= 1;
        if (n <= 0) { stopCountdown(); toDashboard(); return; }
        num.textContent = n;
      }, 1000);
    }, TICK_MS);
  }
  /* the dashboard is not in the Figma flow: the class list (home of the teacher flow) stands in, with a clean demo state */
  function toDashboard() {
    stopCountdown();
    $$('[data-act="toggle"]').forEach((s, i) => setSw(s, initialSwitches[i]));
    syncMarkAll($('.scr[data-screen="list"]'));
    retaking = false; resetPhotos(); setTab('absent');
    stack.length = 0;
    go('list', { replace: true, back: true });
    announce('Dashboard');
  }

  /* ---- actions ---- */
  const actions = {
    back: goBack,
    info: openSheet,
    closesheet: closeSheet,
    capture: () => { retaking = false; go('camera'); },
    recapture: () => { retaking = false; go('camera'); },
    camclose: goBack,
    shutter: () => {
      const f = $('#camflash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
      if (retaking) revealNextPhoto(); else resetPhotos();
      retaking = false;
      setTimeout(() => go('photos', { replace: false }), 140);
    },
    retake: () => { retaking = true; go('camera', { replace: true }); },
    review: () => { setTab('absent'); go('results'); },
    remove: (el) => { el.closest('.pcard').classList.add('gone'); updatePhotos(); announce('Photo removed'); },
    tab: (el) => setTab(el.dataset.tab),
    toggle: (el) => { setSw(el, !el.classList.contains('on')); syncMarkAll(el.closest('.scr')); },
    markall: (el) => {
      const on = !el.classList.contains('on');
      setSw(el, on);
      $$('[data-act="toggle"]', el.closest('.scr')).forEach(s => setSw(s, on));
    },
    submit: (el) => {
      el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
      setTimeout(() => go('done', { replace: true }), 220);
    },
    godash: toDashboard,
  };

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    const fn = actions[el.dataset.act];
    if (fn) fn(el);
  });

  /* ---- keyboard + a11y roles ---- */
  $$('[data-act]', app).forEach(el => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    const act = el.dataset.act;
    if (act === 'toggle' || act === 'markall') { el.setAttribute('role', 'switch'); el.setAttribute('aria-checked', String(el.classList.contains('on'))); }
    else if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    const labels = { back: 'Back', info: 'Class details', capture: 'Capture with AI', recapture: 'Capture again', submit: 'Submit', retake: 'Retake', review: 'Review', remove: 'Remove photo', markall: 'Mark all present', toggle: 'Present', closesheet: 'Close' };
    if (!el.hasAttribute('aria-label') && labels[act] && !['submit', 'retake', 'review', 'capture', 'recapture'].includes(act)) el.setAttribute('aria-label', labels[act]);
  });
  app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const el = e.target.closest('[data-act]');
      if (el) { e.preventDefault(); el.click(); }
    }
    if (e.key === 'Escape') closeSheet();
  });

  /* ---- side panel ---- */
  $$('#steps button').forEach(b => b.addEventListener('click', () => {
    const t = b.dataset.step;
    retaking = false;
    if (t === 'photos') resetPhotos();
    if (t === 'results') setTab('absent');
    stack.length = 0;
    ORDER.slice(0, ORDER.indexOf(t)).forEach(s => stack.push(s));
    go(t, { back: ORDER.indexOf(t) < ORDER.indexOf(current), replace: true });
  }));
  $('#restart').addEventListener('click', () => location.reload());
  $('#steps button[data-step="list"]').setAttribute('aria-current', 'step');

  /* ---- fit stage to viewport ---- */
  const stage = $('#stage'), wrap = $('#stageWrap');
  function fit() {
    const embed = document.documentElement.classList.contains('embed');
    const phone = innerWidth <= 760 && !embed;
    const side = phone || embed ? 0 : 316, mv = phone ? 0 : 48, mh = phone ? 0 : 32;
    const s = Math.min(1, (innerHeight - mv) / 844, (innerWidth - side - mh) / 390) * (embed && innerWidth > 600 ? 0.78 : 1);
    stage.style.transform = `scale(${s})`;
    wrap.style.width = 390 * s + 'px'; wrap.style.height = 844 * s + 'px';
    if (phone) { stage.style.borderRadius = '0'; stage.style.boxShadow = 'none'; }
  }
  addEventListener('resize', fit); fit();
  resetPhotos();
})();
