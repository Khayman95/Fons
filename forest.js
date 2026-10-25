/* Лес (ночь): лунная хвойная чаща. Огромная бледно-зелёная луна с гало и столбом света,
 * тёмные ели по краям, силуэты подлеска, туман у земли, светящиеся грибы, светлячки.
 * Два варианта: buildNight (ночь) и buildDay (день); выбор по env.variant. */
(function () {
  function buildNight(env) {
  const { W, H, Y, Ys, U, px } = env;
  const { C, css, clamp, Layer, Overlay, mulberry32, randint, pick, bay, gradient, addGlow, makeRidge, hill, outward,
    makeStars, drawStars, makeMotes, drawMotes, fog, glowPulse } = px;
  const r = mulberry32(31);

  /* ---------- палитра ---------- */
  const P = {
    sky: ['#050a1c', '#08142c', '#0d2240', '#12304e', '#1c4a62'],
    f1: { body: '#1a4660', rim: '#3f8296', deep: '#12354e' },      // дальняя светлая полоса «шпилей»
    f2: { body: '#0e2c42', rim: '#2a6478', deep: '#0a2236' },      // средний подлесок
    t2: { body: '#071a2a', body2: '#0a2236', rim: '#2a6478' },     // дальние высокие ели (для широких экранов)
    f3: { body: '#06141f', rim: '#1c4a62', deep: '#04101a' },      // близкий подлесок
    t1: { body: '#04101a', body2: '#071a24', rim: '#3a8a86' },     // крупные ели по краям
    ground: { lit: '#0f2c34', shade: '#071a22', deep: '#04101a', rim: '#1e5a56' },
    fly: ['#ffee90', '#f2f070', '#b4f06a', '#ffd070', '#fff5a0'],
    mush: [
      { c: '#4de8c8', hi: '#e8fff4', dk: '#1f9a88', stem: '#2a8a80', glow: '#2fd8b8' },
      { c: '#5df0ff', hi: '#f0ffff', dk: '#2aa6c0', stem: '#2a8a9a', glow: '#36d0ec' },
    ],
  };

  /* ---------- ключевые точки ---------- */
  const R = 10, mx = U(10), my = Ys(34);                 // луна: u = +10 (эталон x=74, y=34)
  const lim = W / 2 + 14;                                // докуда по x рисовать полосы подлеска

  /* ---------- рисовалки ---------- */
  /* ель-«пила»: ярусы свисающих лап; side = +1 свет справа, -1 слева; светлая кромка идёт по верхней стороне яруса */
  function fir(L, cx, base, h, w, o) {
    const top = base - h, tl = o.tl || 7, side = o.side || 1, col = C(o.body), rim = o.rim ? C(o.rim) : null;
    const col2 = o.body2 ? C(o.body2) : null, lean = o.lean || 0, ph0 = o.ph || 0;
    let pe = null;
    for (let i = 0; i <= h; i++) {
      const t = i / h, loc = ((i + ph0) % tl) / tl;
      const hwMax = w / 2 * Math.pow(t, .9) + .5, rise = Math.min(1, loc / .7), hw = hwMax * (.45 + .55 * rise);
      const c = cx + lean * (1 - t), xl = Math.round(c - hw), xr = Math.round(c + hw), y = top + i;
      L.rect(xl, y, xr, y, col);
      const xe = side > 0 ? xr : xl;
      if (col2) for (let k = 1; k <= 3; k++) { const x = xe - side * k; if (x >= xl && x <= xr && bay(x, y) < .55 - k * .13) L.px(x, y, col2); }
      if (rim) {
        let a = xe, b = xe;
        if (pe !== null) { if (side > 0) a = Math.min(xe, pe + 1); else b = Math.max(xe, pe - 1); }
        L.rect(a, y, b, y, rim);
      }
      pe = xe;
    }
  }
  /* плавное затемнение пикселей слоя вниз дизерингом (только уже нарисованное) */
  function fadeDown(L, y0, y1, deep, k) {
    deep = C(deep); const d = L.d, w = L.w;
    for (let y = Math.max(0, y0); y < Math.min(L.h, y1); y++) {
      const p = clamp((y - y0) / (y1 - y0), 0, 1) * k;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) << 2;
        if (d[i + 3] && bay(x, y) < p) { d[i] = deep[0]; d[i + 1] = deep[1]; d[i + 2] = deep[2]; }
      }
    }
  }
  /* полоса елей по всей ширине от центра наружу; o: base, hmin/hmax, wmin/wmax, gmin/gmax, body, rim, lean, tl */
  function band(L, rng, o) {
    const us = [0].concat(outward(0, -1, lim, o.gmin, o.gmax, rng), outward(0, 1, lim, o.gmin, o.gmax, rng));
    for (const u of us) {
      const x = U(u), h = randint(rng, o.hmin, o.hmax), w = randint(rng, o.wmin, o.wmax);
      fir(L, x, o.base, h, w, { body: o.body, body2: o.body2, rim: o.rim, side: x < mx ? 1 : -1, tl: o.tl || 6,
        lean: Math.round((rng() - .5) * (o.lean || 0)), ph: randint(rng, 0, 6) });
    }
  }
  /* высокие ели по краям: tip — проектный y вершины (чем выше экран, тем выше дерево) */
  function bigTree(L, u, tip, w, base, o) {
    const x = U(u), top = Math.min(Y(tip), Ys(tip));
    fir(L, x, base, base - top, w, Object.assign({ side: x < mx ? 1 : -1, tl: 7, ph: randint(r, 0, 6) }, o));
  }
  function merge(cs) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const cx = cv.getContext('2d'); for (const c of cs) cx.drawImage(c, 0, 0);
    return cv;
  }

  /* ---------- небо и гало ---------- */
  const sky = new Layer(W, H);
  gradient(sky, P.sky, 0, Ys(128));
  addGlow(sky, mx, Y(122), 8, 58, '#1c4a62', .6, 4, 1.4);               // просвет за дальним лесом
  addGlow(sky, mx, my, 8, 112, '#1c4a62', .55, 4, 1.7);
  addGlow(sky, mx, my, 10, 66, '#2e6e74', .72, 5, 1.4);
  addGlow(sky, mx, my, 10, 30, '#5aa8a0', .78, 5, 1.2);
  const skyC = sky.canvas();

  /* ---------- луна ---------- */
  const moonC = (function () {
    const s = 2 * R + 7, c = s >> 1, L = new Layer(s, s);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const d = Math.hypot(x - c, y - c); if (d > R + .5 && d <= R + 1.7 && bay(x, y) < .5) L.px(x, y, '#9fc8b8');
    }
    L.disc(c, c, R, '#d4ecd0'); L.disc(c - 1, c - 1, R - 1, '#f2f8e0');
    L.disc(c - 4, c - 3, 2, '#c0dcc8');
    for (const [dx, dy] of [[4, -4], [2, 2], [-2, 4]]) { L.px(c + dx, c + dy, '#c0dcc8'); L.px(c + dx - 1, c + dy, '#c0dcc8'); L.px(c + dx + 1, c + dy, '#c0dcc8'); L.px(c + dx, c + dy - 1, '#c0dcc8'); L.px(c + dx, c + dy + 1, '#c0dcc8'); }
    return L.canvas();
  })();
  const moonH = moonC.width >> 1;
  const stars = makeStars(r, Math.round(26 * W / 128), W, Ys(104), { avoid: (x, y) => Math.hypot(x - mx, y - my) < R + 5 });

  /* ---------- плоские тёмные облака над лесом ---------- */
  function slab(w, seed) {
    const rr = mulberry32(seed), L = new Layer(w, 6);
    const row = (y, k, c) => { const m = Math.round(w * (1 - k) / 2); L.rect(m + Math.round(rr() * 3), y, w - 1 - m - Math.round(rr() * 3), y, c); };
    row(0, .45, '#0a1a30'); row(1, .75, '#0a1a30'); row(2, .94, '#0b1d34'); row(3, 1, '#0d2240');
    for (let x = 0; x < w; x++) { if (bay(x, 4) < .7) L.px(x, 4, '#2a5a70'); if (bay(x, 5) < .3) L.px(x, 5, '#1c4a62'); }
    return L.canvas();
  }
  const slabSpr = [slab(30, 3), slab(24, 8), slab(34, 12)];
  const slabP = W + 90, nSlab = Math.max(2, Math.round(W / 60));
  const slabs = Array.from({ length: nSlab }, (_, i) => ({ s: slabSpr[i % 3], x0: i * slabP / nSlab + r() * 12, y: Ys(58 + ((i * 5) % 11)), v: .07 + (i % 3) * .03 }));

  /* ---------- дальний лес: светлые «шпили» (f1) и тёмный подлесок (f2) ---------- */
  const f1 = new Layer(W, H), rf = mulberry32(11);
  band(f1, rf, { base: Y(150), hmin: 40, hmax: 60, wmin: 7, wmax: 11, gmin: 4, gmax: 8, body: P.f1.body, rim: P.f1.rim, lean: 4, tl: 6 });
  fadeDown(f1, Y(100), Y(150), P.f1.deep, .9);
  f1.rect(0, Y(150) + 1, W, H, P.f1.deep);
  const f2 = new Layer(W, H);
  band(f2, rf, { base: Y(166), hmin: 28, hmax: 46, wmin: 9, wmax: 15, gmin: 5, gmax: 10, body: P.f2.body, rim: P.f2.rim, lean: 3, tl: 6 });
  fadeDown(f2, Y(124), Y(166), P.f2.deep, .9);
  f2.rect(0, Y(166) + 1, W, H, P.f2.deep);
  const backC = merge([f1.canvas(), f2.canvas()]);

  /* ---------- передний план: дальние ели, близкий подлесок, крупные ели, земля ---------- */
  const rt = mulberry32(23), front = [];
  const t2 = new Layer(W, H);
  const t2us = [];
  for (const d of [-1, 1]) for (const u of outward(34 * d, d, lim + 30, 24, 40, rt)) t2us.push(u);
  t2us.sort((a, b) => Math.abs(b) - Math.abs(a));
  for (const u of t2us) bigTree(t2, u, randint(rt, 64, 108), randint(rt, 26, 40), Y(188), { body: P.t2.body, body2: P.t2.body2, rim: P.t2.rim, tl: 6, lean: randint(rt, -2, 2) });
  fadeDown(t2, Y(120), Y(178), '#04101a', .95);
  front.push(t2.canvas());

  const f3 = new Layer(W, H);
  band(f3, rt, { base: Y(184), hmin: 12, hmax: 28, wmin: 8, wmax: 13, gmin: 6, gmax: 12, body: P.f3.body, rim: P.f3.rim, lean: 3, tl: 5 });
  for (const d of [-1, 1]) for (const u of outward(0, d, lim, 14, 30, rt)) f3.ellipseBox(U(u) - randint(rt, 4, 8), Y(172) + randint(rt, 0, 4), U(u) + randint(rt, 4, 8), Y(196), P.f3.body);
  fadeDown(f3, Y(150), Y(190), P.f3.deep, .8);
  front.push(f3.canvas());

  const t1 = new Layer(W, H);
  const big = [{ u: -52, tip: 32, w: 54 }, { u: 55, tip: 56, w: 54 }];
  for (const d of [-1, 1]) for (const u of outward(d * 55, d, lim + 40, 36, 58, rt)) big.push({ u, tip: randint(rt, 20, 84), w: randint(rt, 40, 54) });
  big.sort((a, b) => Math.abs(b.u) - Math.abs(a.u));
  for (const b of big) bigTree(t1, b.u, b.tip, b.w, Y(192), { body: P.t1.body, body2: P.t1.body2, rim: P.t1.rim, tl: 7, lean: randint(rt, -2, 2) });
  front.push(t1.canvas());

  const hGrBase = makeRidge(W / 2, Y(177), [[120, 1.6], [48, 1], [260, 1.6]], 9);
  const hGr = x => hGrBase(x) - 4 * Math.exp(-Math.pow((x - U(2)) / 15, 2));   // небольшой холмик в центре
  const ground = new Layer(W, H);
  hill(ground, hGr, Object.assign({ lightX: mx, k: .8, lean: .3, depth: 6 }, P.ground));
  front.push(ground.canvas());
  const frontC = merge(front);

  /* ---------- светящиеся грибы ---------- */
  const mush = new Layer(W, H), glows = [], rm = mulberry32(41);
  function mushroom(x, y, w, k) {
    const m = P.mush[k], h = w > 5 ? 4 : 3, rows = h === 4 ? [w - 4, w - 2, w, w - 2] : [w - 2, w, w - 2];
    for (let i = 0; i < h; i++) { const hw = (rows[i] - 1) >> 1; mush.rect(x - hw, y - h + 1 + i, x + hw, y - h + 1 + i, i === h - 1 ? m.dk : m.c); }
    mush.px(x - 1, y - h + 1, m.hi); if (h === 4) mush.px(x - 2, y - h + 2, m.hi);
    mush.rect(x, y + 1, x, y + (h === 4 ? 3 : 2), m.stem);
    glows.push({ x, y: y - 1, r: h === 4 ? 12 : 9, col: m.glow, ph: Math.floor(rm() * 90), per: pick(rm, [70, 90, 110]) });
  }
  const clusters = [[-33, 177, 0, 7, -25, 183, 5, 0], [36, 180, 1, 7, 44, 186, 5, 0]];
  for (const d of [-1, 1]) for (const u of outward(d * 40, d, lim - 6, 46, 90, rm))
    clusters.push([u, randint(rm, 177, 184), randint(rm, 0, 1), randint(rm, 0, 1) ? 7 : 5, u + d * 8, randint(rm, 183, 188), 5, randint(rm, 0, 1)]);
  for (const [u1, y1, k1, w1, u2, y2, w2, k2] of clusters) { mushroom(U(u1), Y(y1), w1, k1); mushroom(U(u2), Y(y2), w2, k2); }
  const mushC = mush.canvas();

  /* ---------- динамика: гало, столб света, туман, трава, светлячки, пыль ---------- */
  const ov = new Overlay(W, H);
  const hx0 = Math.max(0, mx - 42), hx1 = Math.min(W, mx + 43), hy0 = Math.max(0, my - 42), hy1 = Math.min(H, my + 43);
  const sy0 = my + R, sy1 = Math.min(H, Y(150)), sx0 = Math.max(0, mx - 32), sx1 = Math.min(W, mx + 33);
  const fogY0 = Math.max(0, Y(104)), fogY1 = Math.min(H, Y(178));
  const glY0 = Math.max(0, Y(164));
  function shaft(f) {
    const col = '#7fcab8', span = sy1 - sy0;
    for (let y = sy0; y < sy1; y++) {
      const t = (y - sy0) / span, hw = 6 + 20 * Math.pow(t, .75), env = .08 + .5 * Math.pow(1 - t, 1.5);
      for (let x = Math.max(sx0, Math.floor(mx - hw)); x < Math.min(sx1, Math.ceil(mx + hw)); x++) {
        const prof = Math.pow(1 - Math.abs(x + .5 - mx) / hw, 1.3);
        const rays = .65 + .35 * Math.cos(6.2832 * ((x - mx) / 8 + y * .012 + f / 170));
        const a = env * prof * rays * (.88 + .12 * Math.sin(6.2832 * f / 220));
        const q = Math.floor(a * 3 + bay(x, y)) / 3;
        if (q > 0) ov.set(x, y, col, q);
      }
    }
  }

  const flies = makeMotes(r, Math.round(24 * W / 128), W, { y0: Y(72), y1: Y(186), colors: P.fly, amp: [2, 6], big: .22 });
  const dust = Array.from({ length: 16 }, () => ({ x: mx + (r() - .5) * 34, y: sy0 + 10 + r() * (sy1 - sy0 - 40), sp: 22 + Math.floor(r() * 16), v: .12 + r() * .1, off: r() * 400, ph: r() }));

  const blades = [], nb = Math.round(W / 2.6);
  for (let i = 0; i < nb; i++) {
    const x = Math.floor(r() * W), h = randint(r, 3, 7);
    blades.push({ x, y: Math.round(hGr(x)) + randint(r, 1, 3), h, per: pick(r, [50, 70, 90]), ph: r(), amp: h > 5 ? 1.6 : 1, tip: r() < .3 });
  }
  const bladeC = css('#050f16'), tipC = css('#1e5a56');

  return {
    draw(ctx, f) {
      ctx.drawImage(skyC, 0, 0);
      drawStars(ctx, stars, f);
      /* дыхание гало вокруг луны */
      glowPulse(ov, mx, my, 40, '#8fd8c4', f, { per: 150, lo: .35, strength: .3 });
      ov.flush(ctx, hx0, hy0, hx1, hy1);
      ctx.drawImage(moonC, mx - moonH, my - moonH);
      /* плоские облака */
      for (const s of slabs) {
        const x = (((s.x0 + s.v * f) % slabP) + slabP) % slabP - 45;
        ctx.drawImage(s.s, Math.round(x), s.y);
      }
      ctx.drawImage(backC, 0, 0);
      /* столб лунного света */
      shaft(f);
      ov.flush(ctx, sx0, sy0, sx1, sy1);
      /* пылинки в луче */
      for (const d of dust) {
        const age = (((d.off + d.v * f) % d.sp) / d.sp), k = Math.sin(Math.PI * age);
        if (k < .3) continue;
        ctx.fillStyle = css(k > .75 ? '#bfe8d8' : '#6fa8a0');
        ctx.fillRect(Math.round(d.x + 1.6 * Math.sin(6.2832 * (age + d.ph))), Math.round(d.y - age * d.sp), 1, 1);
      }
      /* туман: два слоя плывут в разные стороны */
      fog(ov, f, { y0: Y(104), y1: Y(140), color: '#2a5a70', strength: .3, lam: [90, 57], speed: -.1, levels: 3, power: 1, fade: 'mid' });
      fog(ov, f, { y0: Y(128), y1: Y(178), color: '#2e6a78', strength: .6, lam: [70, 46], speed: .2, levels: 3, power: 1.1, fade: 'down' });
      ov.flush(ctx, 0, fogY0, W, fogY1);
      ctx.drawImage(frontC, 0, 0);
      /* трава у земли чуть качается */
      for (const b of blades) {
        const s = Math.round(b.amp * Math.sin(6.2832 * (f / b.per + b.ph))), h1 = b.h >> 1;
        ctx.fillStyle = bladeC;
        ctx.fillRect(b.x, b.y - h1, 1, h1 + 1);
        ctx.fillRect(b.x + s, b.y - b.h, 1, b.h - h1);
        if (b.tip) { ctx.fillStyle = tipC; ctx.fillRect(b.x + s, b.y - b.h, 1, 1); }
      }
      /* свечение грибов */
      for (const g of glows) glowPulse(ov, g.x, g.y, g.r, g.col, f, { per: g.per, ph: g.ph, strength: .6, lo: .55 });
      ov.flush(ctx, 0, glY0, W, H);
      ctx.drawImage(mushC, 0, 0);
      drawMotes(ctx, flies, f);
    },
  };
}
/* ===== DAY ===== */
  function buildDay(env) {
    const { W, H, Y, Ys, U, px } = env;
    const { C, css, clamp, Layer, Overlay, mulberry32, randint, pick, bay, gradient, addGlow, makeRidge, hill, outward,
      makeStars, makeMotes, drawMotes, fog, glowPulse, cloudRow, drawCloudRows, drawBird } = px;
    const r = mulberry32(31), TP = 2 * Math.PI;

    /* ---------- палитра светлого утреннего леса ---------- */
    const P = {
      sky: ['#3a8ee6', '#5aa6ec', '#80bff0', '#a4d6f2', '#c4e6ee'],
      f1: { body: '#5aa890', rim: '#b4f0b0', deep: '#46907c' },
      f2: { body: '#2e8a5c', rim: '#7ad078', deep: '#247050' },
      t2: { body: '#237a4c', body2: '#2a8a56', rim: '#6ac870' },
      f3: { body: '#1a6a40', rim: '#58b860', deep: '#145a38' },
      t1: { body: '#14553a', body2: '#1a6642', rim: '#7ed272' },
      ground: { lit: '#5ab050', shade: '#3a8a40', deep: '#286a34', rim: '#a0e070' },
      pollen: ['#fff6b8', '#ffffff', '#f4e890', '#ffe8a0'],
      mush: [
        { c: '#d83a30', hi: '#fff0e0', dk: '#a02820', stem: '#f0e4d0' },
        { c: '#b0703c', hi: '#e0b080', dk: '#7a4a28', stem: '#e8dcc8' },
      ],
    };

    const R = 10, mx = U(10), my = Ys(34);
    const lim = W / 2 + 14;

    function fir(L, cx, base, h, w, o) {
      const top = base - h, tl = o.tl || 7, side = o.side || 1, col = C(o.body), rim = o.rim ? C(o.rim) : null;
      const col2 = o.body2 ? C(o.body2) : null, lean = o.lean || 0, ph0 = o.ph || 0;
      let pe = null;
      for (let i = 0; i <= h; i++) {
        const t = i / h, loc = ((i + ph0) % tl) / tl;
        const hwMax = w / 2 * Math.pow(t, .9) + .5, rise = Math.min(1, loc / .7), hw = hwMax * (.45 + .55 * rise);
        const c = cx + lean * (1 - t), xl = Math.round(c - hw), xr = Math.round(c + hw), y = top + i;
        L.rect(xl, y, xr, y, col);
        const xe = side > 0 ? xr : xl;
        if (col2) for (let k = 1; k <= 3; k++) { const x = xe - side * k; if (x >= xl && x <= xr && bay(x, y) < .55 - k * .13) L.px(x, y, col2); }
        if (rim) {
          let a = xe, b = xe;
          if (pe !== null) { if (side > 0) a = Math.min(xe, pe + 1); else b = Math.max(xe, pe - 1); }
          L.rect(a, y, b, y, rim);
        }
        pe = xe;
      }
    }
    function fadeDown(L, y0, y1, deep, k) {
      deep = C(deep); const d = L.d, w = L.w;
      for (let y = Math.max(0, y0); y < Math.min(L.h, y1); y++) {
        const p = clamp((y - y0) / (y1 - y0), 0, 1) * k;
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) << 2;
          if (d[i + 3] && bay(x, y) < p) { d[i] = deep[0]; d[i + 1] = deep[1]; d[i + 2] = deep[2]; }
        }
      }
    }
    function band(L, rng, o) {
      const us = [0].concat(outward(0, -1, lim, o.gmin, o.gmax, rng), outward(0, 1, lim, o.gmin, o.gmax, rng));
      for (const u of us) {
        const x = U(u), h = randint(rng, o.hmin, o.hmax), w = randint(rng, o.wmin, o.wmax);
        fir(L, x, o.base, h, w, { body: o.body, body2: o.body2, rim: o.rim, side: x < mx ? 1 : -1, tl: o.tl || 6,
          lean: Math.round((rng() - .5) * (o.lean || 0)), ph: randint(rng, 0, 6) });
      }
    }
    function bigTree(L, u, tip, w, base, o) {
      const x = U(u), top = Math.min(Y(tip), Ys(tip));
      fir(L, x, base, base - top, w, Object.assign({ side: x < mx ? 1 : -1, tl: 7, ph: randint(r, 0, 6) }, o));
    }
    function merge(cs) {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const cx = cv.getContext('2d'); for (const c of cs) cx.drawImage(c, 0, 0);
      return cv;
    }

    /* ---------- небо, солнце, облака ---------- */
    const sky = new Layer(W, H);
    gradient(sky, P.sky, 0, Ys(128));
    addGlow(sky, mx, Y(122), 8, 58, '#e8fadc', .5, 4, 1.4);
    addGlow(sky, mx, my, 8, 112, '#fff4c0', .5, 4, 1.7);
    addGlow(sky, mx, my, 10, 66, '#fff4c0', .7, 5, 1.4);
    const skyC = sky.canvas();
    const sunC = (function () {
      const s = 2 * R + 7, c = s >> 1, L = new Layer(s, s);
      L.disc(c, c, R - 1, '#ffe27a'); L.disc(c, c, R - 3, '#fff2a8'); L.disc(c, c, R - 5, '#ffffff');
      return L.canvas();
    })();
    const sunH = sunC.width >> 1;
    makeStars(r, Math.round(26 * W / 128), W, Ys(104), {});          // тот же ряд случайных чисел, что и ночью
    const cc = ['#f6f9fe', '#b4c8e6', '#ffffff'];
    const rows = [
      cloudRow({ sizes: [[44, 10], [34, 9], [50, 11]], seed: 4, cols: cc, y: Ys(16), v: .2, gap: 124, off: 20 }),
      cloudRow({ sizes: [[36, 9], [44, 10]], seed: 15, cols: cc, y: Ys(64), v: .28, gap: 112, off: 70 }),
    ];
    const slabP = W + 90, nSlab = Math.max(2, Math.round(W / 60));
    for (let i = 0; i < nSlab; i++) r();                              // ряд чисел как у ночных облаков
    const birds = [[.34, Ys(46), 0], [.26, Ys(70), 3], [.42, Ys(26), 6]].map(([v, y, i]) => ({ v, y, i, x0: r() * (W + 60) }));

    /* ---------- лес ---------- */
    const f1 = new Layer(W, H), rf = mulberry32(11);
    band(f1, rf, { base: Y(150), hmin: 40, hmax: 60, wmin: 7, wmax: 11, gmin: 4, gmax: 8, body: P.f1.body, rim: P.f1.rim, lean: 4, tl: 6 });
    fadeDown(f1, Y(100), Y(150), P.f1.deep, .9);
    f1.rect(0, Y(150) + 1, W, H, P.f1.deep);
    const f2 = new Layer(W, H);
    band(f2, rf, { base: Y(166), hmin: 28, hmax: 46, wmin: 9, wmax: 15, gmin: 5, gmax: 10, body: P.f2.body, rim: P.f2.rim, lean: 3, tl: 6 });
    fadeDown(f2, Y(124), Y(166), P.f2.deep, .9);
    f2.rect(0, Y(166) + 1, W, H, P.f2.deep);
    const backC = merge([f1.canvas(), f2.canvas()]);

    const rt = mulberry32(23), front = [];
    const t2 = new Layer(W, H), t2us = [];
    for (const d of [-1, 1]) for (const u of outward(34 * d, d, lim + 30, 24, 40, rt)) t2us.push(u);
    t2us.sort((a, b) => Math.abs(b) - Math.abs(a));
    for (const u of t2us) bigTree(t2, u, randint(rt, 64, 108), randint(rt, 26, 40), Y(188), { body: P.t2.body, body2: P.t2.body2, rim: P.t2.rim, tl: 6, lean: randint(rt, -2, 2) });
    fadeDown(t2, Y(120), Y(178), '#145a38', .9);
    front.push(t2.canvas());

    const f3 = new Layer(W, H);
    band(f3, rt, { base: Y(184), hmin: 12, hmax: 28, wmin: 8, wmax: 13, gmin: 6, gmax: 12, body: P.f3.body, rim: P.f3.rim, lean: 3, tl: 5 });
    for (const d of [-1, 1]) for (const u of outward(0, d, lim, 14, 30, rt)) f3.ellipseBox(U(u) - randint(rt, 4, 8), Y(172) + randint(rt, 0, 4), U(u) + randint(rt, 4, 8), Y(196), P.f3.body);
    fadeDown(f3, Y(150), Y(190), P.f3.deep, .8);
    front.push(f3.canvas());

    const t1 = new Layer(W, H);
    const big = [{ u: -52, tip: 32, w: 54 }, { u: 55, tip: 56, w: 54 }];
    for (const d of [-1, 1]) for (const u of outward(d * 55, d, lim + 40, 36, 58, rt)) big.push({ u, tip: randint(rt, 20, 84), w: randint(rt, 40, 54) });
    big.sort((a, b) => Math.abs(b.u) - Math.abs(a.u));
    for (const b of big) bigTree(t1, b.u, b.tip, b.w, Y(192), { body: P.t1.body, body2: P.t1.body2, rim: P.t1.rim, tl: 7, lean: randint(rt, -2, 2) });
    front.push(t1.canvas());

    const hGrBase = makeRidge(W / 2, Y(177), [[120, 1.6], [48, 1], [260, 1.6]], 9);
    const hGr = x => hGrBase(x) - 4 * Math.exp(-Math.pow((x - U(2)) / 15, 2));
    const ground = new Layer(W, H);
    hill(ground, hGr, Object.assign({ lightX: mx, k: .8, lean: .3, depth: 6 }, P.ground));
    front.push(ground.canvas());
    const frontC = merge(front);

    /* ---------- обычные грибы и папоротники ---------- */
    const mush = new Layer(W, H), rm = mulberry32(41);
    function mushroom(x, y, w, k) {
      const m = P.mush[k], h = w > 5 ? 4 : 3, rows2 = h === 4 ? [w - 4, w - 2, w, w - 2] : [w - 2, w, w - 2];
      for (let i = 0; i < h; i++) { const hw = (rows2[i] - 1) >> 1; mush.rect(x - hw, y - h + 1 + i, x + hw, y - h + 1 + i, i === h - 1 ? m.dk : m.c); }
      mush.px(x - 1, y - h + 1, m.hi); if (h === 4) { mush.px(x - 2, y - h + 2, m.hi); mush.px(x + 1, y - h + 2, m.hi); }
      mush.rect(x, y + 1, x, y + (h === 4 ? 3 : 2), m.stem);
      pick(rm, [70, 90, 110]); rm();
    }
    const clusters = [[-33, 177, 0, 7, -25, 183, 5, 0], [36, 180, 1, 7, 44, 186, 5, 0]];
    for (const d of [-1, 1]) for (const u of outward(d * 40, d, lim - 6, 46, 90, rm))
      clusters.push([u, randint(rm, 177, 184), randint(rm, 0, 1), randint(rm, 0, 1) ? 7 : 5, u + d * 8, randint(rm, 183, 188), 5, randint(rm, 0, 1)]);
    for (const [u1, y1, k1, w1, u2, y2, w2, k2] of clusters) { mushroom(U(u1), Y(y1), w1, k1); mushroom(U(u2), Y(y2), w2, k2); }
    const ferns = new Layer(W, H), rfn = mulberry32(77);
    function fern(x, y, n, len) {
      for (let k = 0; k < n; k++) {
        const a = -Math.PI / 2 + (k - (n - 1) / 2) * .5, ex = Math.round(x + Math.cos(a) * len), ey = Math.round(y + Math.sin(a) * len * .8);
        ferns.line(Math.round(x), Math.round(y), ex, ey, '#2e8a3c');
        for (let t = .3; t <= 1; t += .22) { const px_ = Math.round(x + (ex - x) * t), py_ = Math.round(y + (ey - y) * t); ferns.px(px_ - 1, py_, '#4cb054'); ferns.px(px_ + 1, py_, '#4cb054'); }
        ferns.px(ex, ey, '#8ad468');
      }
    }
    for (const u of [-46, -16, 22, 52]) fern(U(u), Y(184 + (u & 3)), 5, 11);
    for (const d of [-1, 1]) for (const u of outward(d * 58, d, lim, 20, 44, rfn)) fern(U(u), Y(randint(rfn, 182, 190)), 5, randint(rfn, 8, 12));
    const mushC = mush.canvas(), fernC = ferns.canvas();

    /* ---------- динамика: гало, солнечный столб, дымка, пыльца, бабочки ---------- */
    const ov = new Overlay(W, H);
    const hx0 = Math.max(0, mx - 42), hx1 = Math.min(W, mx + 43), hy0 = Math.max(0, my - 42), hy1 = Math.min(H, my + 43);
    const sy0 = my + R, sy1 = Math.min(H, Y(150)), sx0 = Math.max(0, mx - 32), sx1 = Math.min(W, mx + 33);
    const fogY0 = Math.max(0, Y(104)), fogY1 = Math.min(H, Y(178));
    function shaft(f) {
      const col = '#fff2b8', span = sy1 - sy0;
      for (let y = sy0; y < sy1; y++) {
        const t = (y - sy0) / span, hw = 6 + 20 * Math.pow(t, .75), env = .08 + .62 * Math.pow(1 - t, 1.5);
        for (let x = Math.max(sx0, Math.floor(mx - hw)); x < Math.min(sx1, Math.ceil(mx + hw)); x++) {
          const prof = Math.pow(1 - Math.abs(x + .5 - mx) / hw, 1.3);
          const rays = .65 + .35 * Math.cos(TP * ((x - mx) / 8 + y * .012 + f / 170));
          const a = env * prof * rays * (.88 + .12 * Math.sin(TP * f / 220));
          const q = Math.floor(a * 3 + bay(x, y)) / 3;
          if (q > 0) ov.set(x, y, col, q);
        }
      }
    }
    const pollen = makeMotes(r, Math.round(26 * W / 128), W, { y0: Y(72), y1: Y(186), colors: P.pollen, amp: [2, 6], rise: .06, big: .12 });
    const dust = Array.from({ length: 16 }, () => ({ x: mx + (r() - .5) * 34, y: sy0 + 10 + r() * (sy1 - sy0 - 40), sp: 22 + Math.floor(r() * 16), v: .12 + r() * .1, off: r() * 400, ph: r() }));
    const flies = [[-30, 150, '#ff9a30', 0], [14, 168, '#4aa0ff', .3], [40, 142, '#ffe040', .6], [-8, 176, '#ff70c0', .85], [58, 170, '#ffffff', .15]]
      .map(([u, y, c, ph]) => ({ cx: U(u), cy: Y(y), c, ph }));
    const blades = [], nb = Math.round(W / 2.6);
    for (let i = 0; i < nb; i++) {
      const x = Math.floor(r() * W), h = randint(r, 3, 7);
      blades.push({ x, y: Math.round(hGr(x)) + randint(r, 1, 3), h, per: pick(r, [50, 70, 90]), ph: r(), amp: h > 5 ? 1.6 : 1, tip: r() < .3 });
    }
    const bladeC = css('#2a7a34'), tipC = css('#9ae060');

    return {
      draw(ctx, f) {
        ctx.drawImage(skyC, 0, 0);
        glowPulse(ov, mx, my, 40, '#fff6c8', f, { per: 150, lo: .35, strength: .3 });
        ov.flush(ctx, hx0, hy0, hx1, hy1);
        ctx.drawImage(sunC, mx - sunH, my - sunH);
        drawCloudRows(ctx, rows, f, W);
        for (const b of birds) { const x = Math.floor(((b.x0 + b.v * f) % (W + 60) + W + 60) % (W + 60)) - 30; drawBird(ctx, x, b.y + Math.round(1.5 * Math.sin(f / 22 + b.i)), (((f >> 2) + b.i) & 1) === 1, '#2a4a48'); }
        ctx.drawImage(backC, 0, 0);
        shaft(f);
        ov.flush(ctx, sx0, sy0, sx1, sy1);
        for (const d of dust) {
          const age = (((d.off + d.v * f) % d.sp) / d.sp), k = Math.sin(Math.PI * age);
          if (k < .3) continue;
          ctx.fillStyle = css(k > .75 ? '#ffffff' : '#fff0a8');
          ctx.fillRect(Math.round(d.x + 1.6 * Math.sin(TP * (age + d.ph))), Math.round(d.y - age * d.sp), 1, 1);
        }
        fog(ov, f, { y0: Y(104), y1: Y(140), color: '#e8fff0', strength: .26, lam: [90, 57], speed: -.1, levels: 3, power: 1, fade: 'mid' });
        fog(ov, f, { y0: Y(128), y1: Y(178), color: '#e0f8e8', strength: .38, lam: [70, 46], speed: .2, levels: 3, power: 1.1, fade: 'down' });
        ov.flush(ctx, 0, fogY0, W, fogY1);
        ctx.drawImage(frontC, 0, 0);
        for (const b of blades) {
          const s = Math.round(b.amp * Math.sin(TP * (f / b.per + b.ph))), h1 = b.h >> 1;
          ctx.fillStyle = bladeC;
          ctx.fillRect(b.x, b.y - h1, 1, h1 + 1);
          ctx.fillRect(b.x + s, b.y - b.h, 1, b.h - h1);
          if (b.tip) { ctx.fillStyle = tipC; ctx.fillRect(b.x + s, b.y - b.h, 1, 1); }
        }
        ctx.drawImage(fernC, 0, 0);
        ctx.drawImage(mushC, 0, 0);
        drawMotes(ctx, pollen, f);
        for (const b of flies) {
          const x = Math.round(b.cx + 14 * Math.sin(TP * (f / 140 + b.ph))), y = Math.round(b.cy + 6 * Math.sin(TP * (f / 90 + b.ph * 2))), up = (f >> 1) & 1;
          ctx.fillStyle = b.c; ctx.fillRect(x - 1, y - (up ? 1 : 0), 1, 2); ctx.fillRect(x + 1, y - (up ? 1 : 0), 1, 2);
          ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x, y, 1, 1);
        }
      },
    };
  }
/* ===== END ===== */
  PixelBG.register('forest', function (env) { return env.day ? buildDay(env) : buildNight(env); });
})();
