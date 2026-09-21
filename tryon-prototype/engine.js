/* Senco try-on plugin renderer. Same components and geometry as build_screens.py (Figma-verified); state decides the content. */
(() => {
  'use strict';
  const D = window.TRYON_DATA, A = 'assets/';
  const im = (n) => A + (/\.svg$/.test(n) ? n : n.replace(/\.(png|jpe?g)$/i, '.webp'));
  const inr = (n) => '₹' + n.toLocaleString('en-IN');
  const PIECE = {
    earrings: { label: 'Earrings', chip: 'Earring', cat: 'Earrings', name: 'Dazzling Bud Diamond Drop Earrings', price: 53361, tab: 'face', two: false },
    necklace: { label: 'Necklace', chip: 'Necklace', cat: 'Necklace', name: 'Dazzling Bud Diamond Drop Necklace', price: 30000, tab: 'face', two: true },
    nosepin: { label: 'Nosepin', chip: 'Nosepin', cat: 'Nosepin', name: 'Dazzling Bud Diamond Drop Nosepin', price: 20000, tab: 'face', two: true },
    bangle: { label: 'Bangle', chip: 'Bangles', cat: 'Bangle', name: 'Dazzling Bud Diamond Drop Bangle', price: 17000, tab: 'hand', two: false },
    ring: { label: 'Ring', chip: 'Ring', cat: 'Ring', name: 'Dazzling Bud Diamond Drop Ring', price: 20000, tab: 'hand', two: false },
  };
  const CHIP_ORDER = { face: ['necklace', 'earrings', 'nosepin'], hand: ['bangle', 'ring'] };
  const CHIP_W = { necklace: 93, earrings: 102, nosepin: 86, bangle: 84, ring: 60 };
  const MAXN = { face: 3, hand: 2 };
  const N = 'Diamond Drop Necklaces';
  const CARDS = {
    necklace: [['c-neck-a.png', N, 1], ['c-neck-2.png', N, 1], ['c-neck-c.png', N, 0], ['c-neck-1.png', N, 0], ['c-neck-3.png', N, 0]],
    earrings: [['th-earrings.png', 'Diamond Drop Earrings', 1], ['c-earr.png', 'Diamond Drop Earrings', 0]],
    nosepin: [['c-nose-1.png', 'Diamond Drop Nosepin', 0], ['c-nose-2.png', 'Diamond Drop Nosepin', 0], ['c-nose-3.png', 'Diamond Drop Nosepin', 0]],
    bangle: [['c-bang-1.png', 'Diamond Drop Bangales', 1], ['c-bang-2.png', 'Diamond Drop Bangales', 1], ['c-bang-3.png', 'Diamond Drop Bangales', 0]],
    ring: [['c-ring-1.png', 'Diamond Drop Ring', 1], ['c-ring-2.png', 'Diamond Drop Rings', 1], ['c-ring-3.png', 'Diamond Drop Ring', 0]],
  };
  const INFO_TPL = { earrings: 's1', necklace: 's4', nosepin: 's6', bangle: 's8', ring: 's10' };
  const ADD_TPL = { necklace: ['s2', 's3'], earrings: ['s2', 's2'], nosepin: ['s5', 's5'], bangle: ['s7', 's7'], ring: ['s9', 's9'] };

  const G = (adj, name, html) => { const a = adj[name]; return a && (a[0] || a[1]) ? `<div class="g" style="left:${a[0]}px;top:${a[1]}px">${html}</div>` : html; };
  const T = (x, y, w, h, txt, cls) => `<div class="txt ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${txt}</div>`;
  const logoEl = (x, y) => `<div class="logo" style="left:${x}px;top:${y}px"><img src="${im('senco-logo.png')}" alt="Senco Gold &amp; Diamonds"></div>`;
  const NOHAND = `<div class="nh a" style="left:104px;top:310px;width:392px"><div class="nh-t"><img src="${im('i-hand-white.svg')}" alt="" style="width:24px;height:24px">Show Your Hand </div><div class="nh-p">To achieve the best result when virtually<br>trying on, keep a 10-inch Distance, and<br>ensure clear visiblity!</div></div>`;

  function keys(S) {
    const list = S[S.tab];
    let tpl;
    if (S.mode === 'empty') tpl = 'empty';
    else if (S.mode === 'info') tpl = INFO_TPL[list[S.focus].c];
    else tpl = ADD_TPL[S.cat][S.pick != null ? 1 : 0];
    let model;
    if (S.live) model = S.tab === 'face' ? 'live' : 'nohand';
    else if (S.tab === 'hand') model = 'hand';
    else {
      const n = S.face.length + (S.mode === 'add' && S.pick != null && !S.swap ? 1 : 0), add = S.mode === 'add';
      model = n === 0 ? 'empty' : n === 1 ? (add ? 'earrings0' : 'earrings') : n === 2 ? (add ? 'necklace3' : 'necklace4') : (add ? 'nosepin5' : 'nosepin6');
    }
    return { tpl, model };
  }

  function left(model, logo) {
    const [f, x, y, w, h] = D.models[model];
    let o = `<div class="mdl" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><img src="${im(f)}" alt=""></div>`;
    if (model === 'nohand') o += logoEl(14, 17) + `<div class="a" style="left:-1px;top:-2px;width:648px;height:724px;background:rgba(0,0,0,.7)"></div>` + NOHAND;
    else o += logoEl(logo[0], logo[1]);
    return o;
  }
  function overlays(live) {
    let o = `<div class="pby"><span>Powered by</span><img src="${im('i-adamas.svg')}" alt="Powered by adamas tech"></div>`;
    o += live
      ? `<div class="seg lv"><div class="o on" data-act="live"><img src="${im('i-cam-white.svg')}" alt="">Live</div><div class="o" style="color:var(--t-ink-62)" data-act="model"><img src="${im('i-user-grey.svg')}" alt="">Model</div></div>`
      : `<div class="seg"><div class="o" data-act="live"><img src="${im('i-cam.svg')}" alt="">Live</div><div class="o on mo" data-act="model"><img src="${im('i-user-white.svg')}" alt="">Model</div></div>`;
    return o + `<div class="dl" data-act="download"><img src="${im('i-download.svg')}" alt="Download look"></div>`;
  }
  function header(tab) {
    const face = tab === 'face', hx = face ? 124.7 : 136.8;
    let o = T(682, 22, 174.9, 15, 'Try Virtually', 'eyebrow') + T(682, 43, 117.1, 37, 'Your Look', 'h-title');
    o += `<div class="xbtn" style="left:1085px;top:22px" data-act="close"><img src="${im('i-plus.svg')}" alt="Close" style="width:24px;height:24px"></div>`;
    const ic1 = face ? 'i-user-red.svg' : 'i-user-grey.svg', ic2 = face ? 'i-hand-grey.svg' : 'i-hand-red.svg';
    return o + `<div class="tabs" style="left:682px;top:107px"><div class="tb" style="left:0;width:105px" data-act="tab-face"><img src="${im(ic1)}" alt=""><span style="color:${face ? 'var(--t-ink)' : 'var(--t-ink-62)'};width:76px;text-align:center;justify-content:center">Face &amp; Neck</span></div>`
      + `<div class="tb" style="left:${hx}px;width:56.2px" data-act="tab-hand"><img src="${im(ic2)}" alt=""><span style="color:${face ? 'var(--t-ink-62)' : 'var(--t-ink)'};width:33.5px;text-align:center">Hand</span></div>`
      + `<div class="ul" style="left:${face ? 0 : hx}px;width:${face ? 104.7 : 56.2}px"></div></div>`;
  }
  function row(S, t) {
    const list = S[S.tab], [x0, y0] = t.rowpos, sel = S.mode === 'info' ? S.focus : (list.length ? 0 : null);
    let o = '';
    list.forEach((p, i) => {
      const x = x0 + i * 154, lab = PIECE[p.c].label, src = CARDS[p.c][p.v][0];
      o += `<div class="th${i === sel ? ' sel' : ''}" style="left:${x - 4.5}px;top:${y0}px" data-act="focus-${i}"><img src="${im(src)}" alt="${lab}"><div class="bd2"></div></div>`;
      o += `<div class="thl" style="left:${x}px;top:${y0 + 124}px">${lab}</div>`;
      o += `<div class="sx" style="left:${x + 103}px;top:${y0 + t.cdy}px" data-act="remove-${i}"><img src="${im('i-plus.svg')}" alt="Remove ${lab}"></div>`;
    });
    if (list.length < MAXN[S.tab]) o += `<div class="slot" style="left:${x0 + list.length * 154}px;top:${y0}px" data-act="add"><img src="${im('i-plus.svg')}" alt=""><span>Add</span></div>`;
    return o;
  }
  function info(p, adj, S) {
    const P = PIECE[p.c], y = 323, two = P.two;
    let o = G(adj, 'cat', `<div class="cat" style="left:682px;top:${y}px"><i></i><span>${P.cat}</span></div>`);
    o += G(adj, 'name', `<div class="pname" style="left:682px;top:${y + 18}px;height:${35 + (two ? 30 : 0)}px">${P.name}</div>`);
    const py = y + 65 + (two ? 30 : 0);
    o += G(adj, 'price', `<div class="pr" style="left:682px;top:${py}px">₹18,461</div><div class="pr2" style="left:780.2px;top:${py + 12}px">₹20,250</div><div class="pr3" style="left:844.5px;top:${py + 14}px">Save ₹1,789</div>`);
    const my = y + 124 + (two ? 30 : 0);
    o += G(adj, 'meta', `<div class="mt" style="left:682px;top:${my}px;width:96.1px"><b>Metal</b><span>18K Yellow Gold</span></div><div class="mt bl" style="left:810.1px;top:${my}px;width:128px;padding-left:17px"><b style="left:17px">Stone</b><span style="left:17px">Diamond · SI–IJ</span></div><div class="mt bl" style="left:970.2px;top:${my}px;width:136.7px"><b style="left:17px">Weight</b><span style="left:17px">2.84 g</span></div>`);
    o += G(adj, 'swap', `<div class="swap" style="left:682px;top:${162 + (two ? 351.6 : 350.5)}px" data-act="swap"><img src="${im('i-refresh.svg')}" alt=""><span>Swap Item</span></div>`);
    return o;
  }
  const total = (S) => S.face.concat(S.hand).reduce((a, p) => a + PIECE[p.c].price, 0);
  function cartBar(S) {
    const n = S.face.length + S.hand.length, dis = n === 0;
    return `<div class="bar" style="top:598px;height:121px"></div><div class="tot" style="left:673px;top:623px;width:164px">Look Total · ${n} pieces</div><div class="totp" style="left:1021px;top:610px;width:94px">${inr(total(S))}</div>`
      + `<div class="cta${dis ? ' dis' : ''}" style="left:673px;top:658px;width:442px" data-act="cart"><img src="${im('i-bag.svg')}" alt="">Add to cart</div>`;
  }
  const doneBar = (on) => `<div class="bar" style="top:655px;height:64px"></div><div class="bk" style="left:673px;top:669.5px;width:209px" data-act="back">Back</div><div class="dn${on ? '' : ' dis'}" style="left:906px;top:669px;width:209px" data-act="done">Done </div>`;
  function addPanel(S) {
    const cat = S.cat, tab = S.tab, list = S[tab];
    let o = `<div class="atl" style="left:673px;top:309px;width:441px">Add To Look</div>`, x = 673;
    CHIP_ORDER[tab].forEach((c) => {
      const has = list.some((p) => p.c === c), on = c === cat, done = has && !on, w = done ? 102 : CHIP_W[c];
      o += `<div class="chip${on ? ' on' : ''}" style="left:${x}px;top:341px;width:${w}px" data-act="cat-${c}">${done ? `<img src="${im('i-check.svg')}" alt="">` : ''}${PIECE[c].chip}</div>`; x += w + 14;
    });
    o += '<div class="tray" style="left:649px;top:377px;width:538px"></div>';
    const all = CARDS[cat], n = all.length, off = ((S.off[cat] || 0) % n + n) % n, show = Math.min(3, n);
    for (let i = 0; i < show; i++) {
      const idx = (off + i) % n, [src, lab, fit] = all[idx], sel = S.pick === idx;
      o += `<div class="cd${sel ? ' sel' : ''}" style="left:${665 + i * 156}px;top:392px;height:247px" data-act="pick-${idx}"><div class="im${fit ? ' fit' : ''}" style="height:159px"><img src="${im(src)}" alt="${lab}">${sel ? `<img class="ck" src="${im('i-check-circle.svg')}" alt="Selected">` : ''}</div><div class="lb">${lab}</div><div class="sp" data-act="pd"><span>Show Product Details</span><img src="${im('i-ext.svg')}" alt=""></div></div>`;
    }
    if (n > 3) { const [src, lab] = all[(off + 3) % n]; o += `<div class="cd" style="left:${665 + 468}px;top:421.5px;height:188px"><div class="im cr" style="height:100px"><img src="${im(src)}" alt=""></div><div class="lb">${lab}</div><div class="sp"><span>Show Product Details</span><img src="${im('i-ext.svg')}" alt=""></div></div>`; }
    return o + `<div class="chv l" style="left:652px;top:433px" data-act="prev"><img src="${im('i-chev.svg')}" alt="Previous"></div><div class="chv" style="left:1104px;top:433px" data-act="next"><img src="${im('i-chev.svg')}" alt="Next"></div>`;
  }
  function empty(S, t) {
    return `<div class="pname" style="left:682px;top:341px;height:35px;padding:0">Your Looks is empty </div><div class="addj" style="left:682px;top:388px" data-act="add"><img src="${im('i-plus-white.svg')}" alt="">Add Jewellery</div>`;
  }

  function render(S) {
    const { tpl, model } = keys(S), t = D.tpl[tpl], adj = t.adj || {};
    let o = `<img class="bd" src="${im('backdrop.png')}" alt=""><div class="scrim" data-act="scrim"></div><div class="modal">`;
    o += G(adj, 'model', left(model, t.logo)) + '<div class="pnl"></div>' + G(adj, 'head', header(S.tab));
    o += G(adj, 'thumbs', row(S, t));
    if (S.mode === 'empty') o += empty(S, t) + G(adj, 'bar', cartBar(S));
    else if (S.mode === 'info') o += info(S[S.tab][S.focus], adj, S) + G(adj, 'bar', cartBar(S));
    else o += G(adj, 'panel', addPanel(S)) + G(adj, 'bar', doneBar(S.pick != null));
    return o + G(adj, 'overlays', overlays(S.live)) + '</div>';
  }
  window.TryonEngine = { render, PIECE, CARDS, CHIP_ORDER, MAXN, total, keys };
})();
